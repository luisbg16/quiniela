import pool from "../config/database.js";

// ─── Guardar o actualizar quiniela ────────────────────────────────────────────
//
// Seguridad: los partidos cerrados por el admin NO se actualizan.
// Si el usuario tiene predicciones previas para esos partidos, se mantienen.
// Si no tiene predicciones previas para un partido cerrado, se ignoran las nuevas.
//
export async function guardarQuiniela(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const { predicciones } = req.body;

    if (!predicciones || typeof predicciones !== "object") {
      return res.status(400).json({ error: "Las predicciones deben ser un objeto válido" });
    }

    // ── 1. Obtener lista de partidos cerrados ─────────────────────────────────
    const cfgRows = await pool.query(
      "SELECT partido_id FROM partidos_config WHERE abierto = FALSE"
    );
    const cerrados = new Set(cfgRows.rows.map((r) => r.partido_id));

    // ── 2. Obtener quiniela existente del usuario (para preservar picks cerrados) ──
    let prevPredicciones = null;
    if (cerrados.size > 0) {
      const prev = await pool.query(
        "SELECT predicciones FROM quinielas WHERE usuario_id = $1",
        [usuarioId]
      );
      prevPredicciones = prev.rows[0]?.predicciones ?? null;
    }

    // ── 3. Construir predicciones finales ─────────────────────────────────────
    // Partidos cerrados → conservar valor guardado (o null si es la primera vez).
    // Partidos abiertos → usar el valor que manda el usuario.
    let prediccionesFinal = { ...predicciones };

    if (cerrados.size > 0 && predicciones.scores) {
      const scoresFinal = { ...(predicciones.scores ?? {}) };

      cerrados.forEach((pid) => {
        if (prevPredicciones?.scores?.[pid] !== undefined) {
          // Restaurar valor guardado previamente
          scoresFinal[pid] = prevPredicciones.scores[pid];
        } else {
          // No había predicción guardada; eliminar cualquier valor nuevo
          delete scoresFinal[pid];
        }
      });

      prediccionesFinal = { ...predicciones, scores: scoresFinal };
    }

    // ── 4. UPSERT con predicciones ya saneadas ────────────────────────────────
    const resultado = await pool.query(
      `INSERT INTO quinielas (usuario_id, predicciones, fecha_actualizacion)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (usuario_id)
       DO UPDATE SET
         predicciones        = EXCLUDED.predicciones,
         fecha_actualizacion = NOW()
       RETURNING *`,
      [usuarioId, JSON.stringify(prediccionesFinal)]
    );

    // Informar qué partidos fueron ignorados (útil para debugging en frontend)
    const ignorados = Object.keys(predicciones.scores ?? {}).filter((id) => cerrados.has(id));

    return res.json({
      mensaje:   "Quiniela guardada exitosamente",
      quiniela:  resultado.rows[0],
      ...(ignorados.length > 0 && {
        advertencia: `Predicciones ignoradas para partidos cerrados: ${ignorados.join(", ")}`,
        cerrados:    ignorados,
      }),
    });
  } catch (err) {
    console.error("Error al guardar quiniela:", err);
    return res.status(500).json({
      error: "Error al guardar quiniela",
      detalle: err.message,
      codigo: err.code,
    });
  }
}

// ─── Obtener quiniela del usuario autenticado ─────────────────────────────────

export async function obtenerMiQuiniela(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT q.*, u.nombre, u.apellido, u.numero_asociado
       FROM quinielas q
       JOIN usuarios u ON q.usuario_id = u.id
       WHERE q.usuario_id = $1`,
      [req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.json({ quiniela: null });
    }

    return res.json({ quiniela: resultado.rows[0] });
  } catch (err) {
    console.error("Error al obtener quiniela:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── [ADMIN] Obtener todas las quinielas con ranking ─────────────────────────

export async function obtenerRanking(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT
         q.id,
         q.puntaje,
         q.fecha_actualizacion,
         u.nombre,
         u.apellido,
         u.email,
         u.numero_asociado
       FROM quinielas q
       JOIN usuarios u ON q.usuario_id = u.id
       ORDER BY q.puntaje DESC, q.fecha_actualizacion ASC`
    );

    return res.json({
      total:    resultado.rows.length,
      ranking:  resultado.rows,
    });
  } catch (err) {
    console.error("Error al obtener ranking:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── [ADMIN] Actualizar puntajes ──────────────────────────────────────────────
// Llamar cuando ya hay resultados reales para calcular puntos

export async function actualizarPuntajes(req, res) {
  try {
    const { resultadosOficiales } = req.body;
    // resultadosOficiales: { grupos: {...}, bracket: {...} }
    // La lógica de cálculo va aquí según las reglas del concurso

    if (!resultadosOficiales) {
      return res.status(400).json({ error: "Se requieren los resultados oficiales" });
    }

    // Obtener todas las quinielas
    const quinielas = await pool.query("SELECT id, usuario_id, predicciones FROM quinielas");

    let actualizadas = 0;

    for (const quiniela of quinielas.rows) {
      const puntaje = calcularPuntaje(quiniela.predicciones, resultadosOficiales);

      await pool.query(
        "UPDATE quinielas SET puntaje = $1 WHERE id = $2",
        [puntaje, quiniela.id]
      );
      actualizadas++;
    }

    return res.json({
      mensaje:     `Puntajes actualizados para ${actualizadas} quinielas`,
      actualizadas,
    });
  } catch (err) {
    console.error("Error al actualizar puntajes:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Función de cálculo de puntaje ───────────────────────────────────────────
// Reglas del concurso:
//   1 pt  por cada clasificado correcto en grupos (1° y 2°)
//   2 pts por resultado correcto en Octavos
//   3 pts por resultado correcto en Cuartos
//   4 pts por resultado correcto en Semis
//   5 pts por resultado correcto en Final
//  10 pts adicionales si acertó el campeón

function calcularPuntaje(predicciones, resultados) {
  let puntaje = 0;

  try {
    // Fase de grupos (1° y 2° lugar)
    if (predicciones.grupos && resultados.grupos) {
      for (const grupo of Object.keys(resultados.grupos)) {
        const predGrupo = predicciones.grupos[grupo];
        const realGrupo = resultados.grupos[grupo];
        if (!predGrupo || !realGrupo) continue;

        if (predGrupo[0] === realGrupo[0]) puntaje += 1; // 1° lugar correcto
        if (predGrupo[1] === realGrupo[1]) puntaje += 1; // 2° lugar correcto
      }
    }

    // Bracket eliminatorio
    const pb = predicciones.bracket;
    const rb = resultados.bracket;
    if (pb && rb) {
      // Octavos
      const r32Pts = contarAciertos(pb.left?.r32, rb.left?.r32) +
                     contarAciertos(pb.right?.r32, rb.right?.r32);
      puntaje += r32Pts * 2;

      // Cuartos
      const qfPts = contarAciertos(pb.left?.qf, rb.left?.qf) +
                    contarAciertos(pb.right?.qf, rb.right?.qf);
      puntaje += qfPts * 3;

      // Semis
      const sfPts = contarAciertos(pb.left?.sf, rb.left?.sf) +
                    contarAciertos(pb.right?.sf, rb.right?.sf);
      puntaje += sfPts * 4;

      // Final
      if (pb.finalPick !== null && pb.finalPick === rb.finalPick) {
        puntaje += 5;
        puntaje += 10; // Bonus campeón
      }
    }
  } catch {
    // Si hay error en el cálculo, devuelve lo que tenga
  }

  return puntaje;
}

function contarAciertos(predichos, reales) {
  if (!Array.isArray(predichos) || !Array.isArray(reales)) return 0;
  return predichos.filter((p, i) => p !== null && p === reales[i]).length;
}
