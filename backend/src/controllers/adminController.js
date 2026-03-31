import pool from "../config/database.js";

// ─── Utilidad: calcular puntaje de una quiniela ───────────────────────────────
//
// Sistema de puntos:
//   Fase de grupos (predicciones de marcador):
//     +1 pt si el resultado (V/E/D) es correcto
//     +2 pts adicionales si el marcador es exacto
//     Máximo 3 pts por partido
//
//   Bracket eliminatorio (picks de avance):
//     +1 pt por cada equipo que el usuario dijo que avanzaba y avanzó
//     (comparado con el bracket oficial guardado por el admin)
//
function calcularPuntaje(predicciones, resultadosMap, bracketOficial) {
  let pts = 0;

  // ── Fase de grupos ────────────────────────────────────────────────────────
  const scores = predicciones?.scores ?? {};
  for (const [matchId, real] of Object.entries(resultadosMap)) {
    const pred = scores[matchId];
    if (!pred || pred.home == null || pred.away == null) continue;

    const ph = Number(pred.home), pa = Number(pred.away);
    const rh = Number(real.goles_local), ra = Number(real.goles_vis);

    const predOutcome = ph > pa ? "H" : pa > ph ? "A" : "D";
    const realOutcome = rh > ra ? "H" : ra > rh ? "A" : "D";

    if (predOutcome === realOutcome) {
      pts += 1;
      if (ph === rh && pa === ra) pts += 2; // marcador exacto
    }
  }

  // ── Bracket eliminatorio ──────────────────────────────────────────────────
  // bracketOficial.avances = { "L_r32_0": "Argentina", "L_r32_1": "Brasil", ... }
  // predicciones.bracket = { lPicks: [...], rPicks: [...], finalPick, thirdPick }
  const avances = bracketOficial?.avances ?? {};
  if (Object.keys(avances).length > 0) {
    const bPred = predicciones?.bracket ?? {};
    const rounds = ["r32", "r16", "qf", "sf"];
    const sides  = ["L", "R"];

    sides.forEach((side) => {
      const picks = side === "L" ? (bPred.lPicks ?? {}) : (bPred.rPicks ?? {});
      rounds.forEach((round) => {
        const roundPicks = picks[round] ?? [];
        roundPicks.forEach((pick, idx) => {
          if (pick === null || pick === undefined) return;
          const slotKey = `${side}_${round}_${idx}`;
          const winner  = avances[slotKey];
          if (winner && winner === avances[`${slotKey}_winner`]) pts += 1;
        });
      });
    });
  }

  return pts;
}

// ─── Guardar resultado oficial de un partido ──────────────────────────────────
export async function guardarResultado(req, res) {
  try {
    const { partidoId, golesLocal, golesVis, fase = "grupos" } = req.body;

    if (partidoId === undefined || golesLocal === undefined || golesVis === undefined) {
      return res.status(400).json({ error: "partidoId, golesLocal y golesVis son obligatorios" });
    }
    if (golesLocal < 0 || golesVis < 0) {
      return res.status(400).json({ error: "Los goles no pueden ser negativos" });
    }

    await pool.query(
      `INSERT INTO resultados_oficiales (partido_id, goles_local, goles_vis, fase)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (partido_id)
       DO UPDATE SET goles_local = $2, goles_vis = $3, fase = $4, updated_at = NOW()`,
      [String(partidoId), Number(golesLocal), Number(golesVis), fase]
    );

    return res.json({ mensaje: "Resultado guardado", partidoId, golesLocal, golesVis });
  } catch (err) {
    console.error("Error guardarResultado:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Obtener todos los resultados oficiales ───────────────────────────────────
export async function obtenerResultados(req, res) {
  try {
    const rows = await pool.query(
      "SELECT partido_id, goles_local, goles_vis, fase FROM resultados_oficiales ORDER BY CASE WHEN partido_id ~ '^[0-9]+$' THEN partido_id::int ELSE 9999 END, partido_id"
    );
    // Convertir a mapa { [partidoId]: { goles_local, goles_vis, fase } }
    const mapa = {};
    rows.rows.forEach((r) => { mapa[r.partido_id] = r; });
    return res.json({ resultados: mapa });
  } catch (err) {
    console.error("Error obtenerResultados:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Guardar / actualizar bracket oficial ─────────────────────────────────────
// datos: cualquier objeto que el admin gestione (equipos por slot, avances, etc.)
export async function guardarBracketOficial(req, res) {
  try {
    const { datos } = req.body;
    if (!datos || typeof datos !== "object") {
      return res.status(400).json({ error: "datos debe ser un objeto" });
    }

    // Siempre hay solo una fila en bracket_oficial
    // JSON.stringify es obligatorio — pg no serializa objetos a JSONB automáticamente
    await pool.query(
      `UPDATE bracket_oficial SET datos = $1::jsonb, updated_at = NOW()`,
      [JSON.stringify(datos)]
    );

    return res.json({ mensaje: "Bracket oficial actualizado" });
  } catch (err) {
    console.error("Error guardarBracketOficial:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Obtener bracket oficial ──────────────────────────────────────────────────
export async function obtenerBracketOficial(req, res) {
  try {
    const row = await pool.query("SELECT datos FROM bracket_oficial LIMIT 1");
    return res.json({ bracket: row.rows[0]?.datos ?? {} });
  } catch (err) {
    console.error("Error obtenerBracketOficial:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Recalcular puntajes de TODAS las quinielas ───────────────────────────────
export async function calcularTodosPuntos(req, res) {
  try {
    // Obtener resultados oficiales
    const resOficiales = await pool.query(
      "SELECT partido_id, goles_local, goles_vis FROM resultados_oficiales"
    );
    const resultadosMap = {};
    resOficiales.rows.forEach((r) => { resultadosMap[r.partido_id] = r; });

    // Obtener bracket oficial
    const bracketRow = await pool.query("SELECT datos FROM bracket_oficial LIMIT 1");
    const bracketOficial = bracketRow.rows[0]?.datos ?? {};

    // Obtener todas las quinielas
    const quinielas = await pool.query("SELECT id, predicciones FROM quinielas");

    let actualizadas = 0;
    for (const q of quinielas.rows) {
      const pts = calcularPuntaje(q.predicciones, resultadosMap, bracketOficial);
      await pool.query("UPDATE quinielas SET puntaje = $1 WHERE id = $2", [pts, q.id]);
      actualizadas++;
    }

    return res.json({
      mensaje: `Puntos recalculados para ${actualizadas} quinielas`,
      actualizadas,
    });
  } catch (err) {
    console.error("Error calcularTodosPuntos:", err);
    return res.status(500).json({
      error: "Error al calcular puntos",
      detalle: err.message,
      codigo: err.code,
    });
  }
}

// ─── Ranking público (no requiere admin) ─────────────────────────────────────
export async function obtenerRankingPublico(req, res) {
  try {
    const rows = await pool.query(
      `SELECT
         ROW_NUMBER() OVER (ORDER BY q.puntaje DESC, q.fecha_actualizacion ASC) AS posicion,
         u.nombre,
         u.apellido,
         u.numero_asociado,
         u.es_afiliado,
         q.puntaje,
         q.fecha_actualizacion
       FROM quinielas q
       JOIN usuarios u ON q.usuario_id = u.id
       WHERE u.activo = TRUE
       ORDER BY q.puntaje DESC, q.fecha_actualizacion ASC`
    );
    return res.json({ ranking: rows.rows });
  } catch (err) {
    console.error("Error obtenerRankingPublico:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Lista de usuarios (para panel admin) ────────────────────────────────────
export async function obtenerUsuarios(req, res) {
  try {
    const rows = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.numero_asociado,
              u.es_admin, u.es_afiliado, u.activo, u.fecha_registro, u.ultimo_acceso,
              q.puntaje
       FROM usuarios u
       LEFT JOIN quinielas q ON q.usuario_id = u.id
       ORDER BY u.fecha_registro DESC`
    );
    return res.json({ usuarios: rows.rows });
  } catch (err) {
    console.error("Error obtenerUsuarios:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Actualizar afiliado de un usuario (manual) ───────────────────────────────
export async function setAfiliado(req, res) {
  try {
    const { usuarioId, esAfiliado } = req.body;
    if (!usuarioId || esAfiliado === undefined) {
      return res.status(400).json({ error: "usuarioId y esAfiliado son obligatorios" });
    }
    await pool.query(
      "UPDATE usuarios SET es_afiliado = $1 WHERE id = $2",
      [Boolean(esAfiliado), Number(usuarioId)]
    );
    return res.json({ mensaje: "Afiliado actualizado" });
  } catch (err) {
    console.error("Error setAfiliado:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
