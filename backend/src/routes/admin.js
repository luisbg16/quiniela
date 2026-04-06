import { Router } from "express";
import { verificarToken, soloAdmin } from "../middleware/auth.js";
import {
  guardarResultado,
  obtenerResultados,
  guardarBracketOficial,
  obtenerBracketOficial,
  calcularTodosPuntos,
  obtenerRankingPublico,
  obtenerUsuarios,
  setAfiliado,
  obtenerPartidosConfig,
  togglePartidoConfig,
} from "../controllers/adminController.js";

const router = Router();

// ─── Rutas públicas (sin autenticación) ──────────────────────────────────────

// GET  /api/admin/resultados          — Resultados oficiales (público, para mostrar en sitio)
router.get("/resultados",      obtenerResultados);

// GET  /api/admin/bracket             — Bracket oficial (público)
router.get("/bracket",         obtenerBracketOficial);

// GET  /api/admin/ranking             — Tabla de posiciones (público, paginada)
router.get("/ranking",         obtenerRankingPublico);

// GET  /api/admin/partidos-config     — Config de partidos abiertos/cerrados (público)
router.get("/partidos-config", obtenerPartidosConfig);

// ─── Rutas protegidas (requieren login + admin) ───────────────────────────────
router.use(verificarToken, soloAdmin);

// POST /api/admin/resultados          — Guardar resultado de un partido
router.post("/resultados",     guardarResultado);

// POST /api/admin/bracket             — Actualizar bracket oficial
router.post("/bracket",        guardarBracketOficial);

// POST /api/admin/calcular-puntos     — Recalcular puntos de todas las quinielas
router.post("/calcular-puntos", calcularTodosPuntos);

// GET  /api/admin/usuarios            — Listar todos los usuarios
router.get("/usuarios",        obtenerUsuarios);

// POST /api/admin/set-afiliado        — Marcar/desmarcar afiliado manualmente
router.post("/set-afiliado",   setAfiliado);

// POST /api/admin/partidos-config     — Abrir/cerrar partido para predicciones
router.post("/partidos-config", togglePartidoConfig);

export default router;
