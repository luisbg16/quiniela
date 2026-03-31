import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes     from "./routes/auth.js";
import quinielaRoutes from "./routes/quiniela.js";
import adminRoutes    from "./routes/admin.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ══════════════════════════════════════════════════════════
// SEGURIDAD: Headers HTTP (reemplaza helmet sin dependencia)
// ══════════════════════════════════════════════════════════

app.use((_req, res, next) => {
  // Evitar que el browser adivine el Content-Type
  res.setHeader("X-Content-Type-Options", "nosniff");
  // No embeber la app en iframes de otros dominios
  res.setHeader("X-Frame-Options", "DENY");
  // Forzar HTTPS en browsers (1 año)
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Limitar referrer para no exponer rutas internas
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // No exponer qué software corre el servidor
  res.removeHeader("X-Powered-By");
  // Política de permisos (deshabilitar features no usadas)
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// ══════════════════════════════════════════════════════════
// SEGURIDAD: Rate limiting reutilizable sin dependencia externa
// ══════════════════════════════════════════════════════════

/**
 * Crea un middleware de rate limiting en memoria.
 * @param {{ max: number, windowMs: number, mensaje?: string }} opts
 */
function crearRateLimiter({ max, windowMs, mensaje }) {
  const store = new Map(); // IP → { count, resetAt }

  // Limpiar entradas expiradas cada hora
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
      if (now >= entry.resetAt) store.delete(ip);
    }
  }, 60 * 60 * 1000);

  return function rateLimiter(req, res, next) {
    const ip  = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const entry = store.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({
          error: mensaje || `Demasiadas peticiones. Esperá ${Math.ceil(retryAfter / 60)} minutos.`,
        });
      }
      entry.count += 1;
    } else {
      store.set(ip, { count: 1, resetAt: now + windowMs });
    }
    next();
  };
}

// Login: máx 10 intentos / 15 min por IP
const loginRateLimiter = crearRateLimiter({
  max:      10,
  windowMs: 15 * 60 * 1000,
  mensaje:  "Demasiados intentos de inicio de sesión. Esperá 15 minutos.",
});

// Verificación de afiliado: máx 30 consultas / 15 min por IP
const afiliadoRateLimiter = crearRateLimiter({
  max:      30,
  windowMs: 15 * 60 * 1000,
  mensaje:  "Demasiadas consultas de verificación. Esperá unos minutos.",
});

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "256kb" })); // reducido de 1mb a 256kb

// ─── Logging simple en desarrollo ────────────────────────────────────────────

if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()}  ${req.method}  ${req.path}`);
    next();
  });
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

// Rate limiters selectivos por ruta
app.use("/api/auth/login",             loginRateLimiter);
app.use("/api/auth/verificar-afiliado", afiliadoRateLimiter);

app.use("/api/auth",     authRoutes);
app.use("/api/quiniela", quinielaRoutes);
app.use("/api/admin",    adminRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ estado: "ok", timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler global
app.use((err, _req, res, _next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// ─── Arrancar servidor ───────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n API corriendo en puerto ${PORT}`);
});
