import { Router } from "express";
import { registrar, ingresar, obtenerPerfil, checkAfiliado } from "../controllers/authController.js";
import { verificarToken } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register           — Crear cuenta nueva
router.post("/register", registrar);

// POST /api/auth/login              — Iniciar sesión
router.post("/login", ingresar);

// GET  /api/auth/me                 — Perfil del usuario autenticado (requiere JWT)
router.get("/me", verificarToken, obtenerPerfil);

// GET  /api/auth/verificar-afiliado — Consultar si un DNI está en el webservice
// ?dni=0801199012345  →  { esAfiliado: bool, wsDisponible: bool }
// (rate limited en index.js: 30 req / 15 min por IP)
router.get("/verificar-afiliado", checkAfiliado);

export default router;
