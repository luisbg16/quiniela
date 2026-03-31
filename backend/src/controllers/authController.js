import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

// ─── Webservice de verificación de afiliados ──────────────────────────────────
//
// Configurable mediante variables de entorno:
//   AFILIADOS_WS_URL   — URL base del webservice (ej: https://ws.chorotega.hn/afiliados)
//   AFILIADOS_WS_TOKEN — Bearer token de autenticación (opcional)
//
// El webservice debe responder con JSON que contenga al menos uno de estos campos:
//   { esAfiliado: true }  |  { activo: true }  |  { afiliado: true }  |  { estado: "ACTIVO" }
//
// La función NUNCA bloquea el registro si el WS no está disponible o falla.
// Devuelve: { esAfiliado: boolean, wsDisponible: boolean }
//
async function verificarAfiliado(numeroAsociado) {
  if (!numeroAsociado) return { esAfiliado: false, wsDisponible: false };

  const wsUrl = process.env.AFILIADOS_WS_URL;

  // Si no hay URL configurada, el WS no está disponible aún
  if (!wsUrl) return { esAfiliado: false, wsDisponible: false };

  try {
    const headers = { "Content-Type": "application/json" };
    if (process.env.AFILIADOS_WS_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.AFILIADOS_WS_TOKEN}`;
    }

    const resp = await fetch(
      `${wsUrl}?dni=${encodeURIComponent(numeroAsociado)}`,
      { headers, signal: AbortSignal.timeout(5000) }
    );

    if (!resp.ok) return { esAfiliado: false, wsDisponible: true };

    const data = await resp.json();

    // Soporta múltiples formatos de respuesta del webservice
    const esAfiliado = !!(
      data?.esAfiliado ||
      data?.activo     ||
      data?.afiliado   ||
      data?.estado === "ACTIVO"
    );

    return { esAfiliado, wsDisponible: true };
  } catch {
    // Error de red o timeout — no bloquear el registro
    return { esAfiliado: false, wsDisponible: false };
  }
}

// ─── Verificación pública (endpoint para el formulario de registro) ───────────

export async function checkAfiliado(req, res) {
  const dni = req.query.dni?.trim();
  if (!dni) {
    return res.status(400).json({ error: "Parámetro 'dni' requerido" });
  }

  // Validación básica: solo dígitos, longitud razonable
  if (!/^\d{8,20}$/.test(dni)) {
    return res.status(400).json({ error: "DNI inválido" });
  }

  const resultado = await verificarAfiliado(dni);
  return res.json(resultado); // { esAfiliado: bool, wsDisponible: bool }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generarToken(usuario) {
  return jwt.sign(
    {
      id:         usuario.id,
      email:      usuario.email,
      nombre:     usuario.nombre,
      esAdmin:    usuario.es_admin,
      esAfiliado: usuario.es_afiliado,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function sanitizarUsuario(usuario) {
  return {
    id:              usuario.id,
    nombre:          usuario.nombre,
    apellido:        usuario.apellido,
    email:           usuario.email,
    numeroAsociado:  usuario.numero_asociado,
    esAdmin:         usuario.es_admin,
    esAfiliado:      usuario.es_afiliado,
    fechaRegistro:   usuario.fecha_registro,
  };
}

// ─── Registro ─────────────────────────────────────────────────────────────────

export async function registrar(req, res) {
  try {
    const { nombre, apellido, email, password, numeroAsociado } = req.body;

    // Validaciones básicas
    if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Nombre, apellido, email y contraseña son obligatorios" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "El email no tiene un formato válido" });
    }

    // Verificar si el email ya existe
    const existente = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo electrónico" });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Verificar si es afiliado mediante webservice (no bloquea el registro)
    const { esAfiliado } = await verificarAfiliado(numeroAsociado?.trim());

    // Insertar usuario
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, numero_asociado, es_afiliado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        nombre.trim(),
        apellido.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        numeroAsociado?.trim() || null,
        esAfiliado,
      ]
    );

    const nuevoUsuario = resultado.rows[0];
    const token = generarToken(nuevoUsuario);

    return res.status(201).json({
      mensaje:  "Cuenta creada exitosamente",
      token,
      usuario:  sanitizarUsuario(nuevoUsuario),
    });
  } catch (err) {
    console.error("Error en registro:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function ingresar(req, res) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    // Buscar usuario
    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE",
      [email.toLowerCase().trim()]
    );

    if (resultado.rows.length === 0) {
      // Mensaje genérico por seguridad (no revelar si el email existe)
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const usuario = resultado.rows[0];

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Actualizar último acceso
    await pool.query(
      "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1",
      [usuario.id]
    );

    const token = generarToken(usuario);

    return res.json({
      mensaje:  "Ingreso exitoso",
      token,
      usuario:  sanitizarUsuario(usuario),
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Perfil del usuario autenticado ──────────────────────────────────────────

export async function obtenerPerfil(req, res) {
  try {
    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE id = $1 AND activo = TRUE",
      [req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ usuario: sanitizarUsuario(resultado.rows[0]) });
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
