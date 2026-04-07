import { Router } from "express";
import { registrar, ingresar, obtenerPerfil, checkAfiliado, olvideMiPassword, resetPassword } from "../controllers/authController.js";
import { verificarToken } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register             — Crear cuenta nueva
router.post("/register", registrar);

// POST /api/auth/login                — Iniciar sesión
router.post("/login", ingresar);

// GET  /api/auth/me                   — Perfil del usuario autenticado (requiere JWT)
router.get("/me", verificarToken, obtenerPerfil);

// GET  /api/auth/verificar-afiliado   — Consultar si un DNI está en el webservice
router.get("/verificar-afiliado", checkAfiliado);

// POST /api/auth/forgot-password      — Solicitar enlace de recuperación por email
router.post("/forgot-password", olvideMiPassword);

// POST /api/auth/reset-password       — Establecer nueva contraseña con token
router.post("/reset-password", resetPassword);

export default router;
