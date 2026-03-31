import jwt from "jsonwebtoken";

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si es válido, agrega req.usuario con { id, email, nombre, esAdmin }.
 */
export function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acceso requerido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Sesión expirada, ingresá de nuevo" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
}

/**
 * Middleware adicional: solo permite acceso a administradores.
 * Usar DESPUÉS de verificarToken.
 */
export function soloAdmin(req, res, next) {
  if (!req.usuario?.esAdmin) {
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  }
  next();
}
