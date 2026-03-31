import { Router } from "express";
import {
  guardarQuiniela,
  obtenerMiQuiniela,
  obtenerRanking,
  actualizarPuntajes,
} from "../controllers/quinielaController.js";
import { verificarToken, soloAdmin } from "../middleware/auth.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// POST /api/quiniela       — Guardar / actualizar mi quiniela
router.post("/", guardarQuiniela);

// GET  /api/quiniela       — Obtener mi quiniela
router.get("/", obtenerMiQuiniela);

// GET  /api/quiniela/ranking        — [ADMIN] Ver todas las quinielas rankeadas
router.get("/ranking", soloAdmin, obtenerRanking);

// POST /api/quiniela/puntajes       — [ADMIN] Recalcular puntajes
router.post("/puntajes", soloAdmin, actualizarPuntajes);

export default router;
