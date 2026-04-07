import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import pool from "../config/database.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Webservice de verificación de afiliados (Laravel/Chorotega) ─────────────
//
// Variable de entorno requerida:
//   AFILIADOS_WS_URL = https://afiliacion.chorotega.hn/validar-dni
//
// El endpoint espera:  GET /validar-dni/{dni}   (formato: xxxx-xxxx-xxxxx)
// Respuestas posibles:
//   { status_code: 200, message: "Afiliado encontrado" }     → es afiliado
//   { status_code: 404, message: "Afiliado no encontrado" }  → no es afiliado
//   HTTP 5xx / error de red                                   → WS no disponible
//
// La función NUNCA bloquea el registro si el WS no está disponible o falla.
//
/**
 * Convierte 13 dígitos puros → formato xxxx-xxxx-xxxxx requerido por el WS.
 * Ejemplo: "0801199012345" → "0801-1990-12345"
 * Si ya tiene guiones o no tiene exactamente 13 dígitos, lo deja como está.
 */
function formatearDni(dni) {
  const digits = String(dni).replace(/\D/g, "");
  if (digits.length === 13) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return dni; // formato inesperado — enviar tal cual
}

async function verificarAfiliado(numeroAsociado) {
  if (!numeroAsociado) return { esAfiliado: false, wsDisponible: false };

  const wsUrl = process.env.AFILIADOS_WS_URL;
  if (!wsUrl) return { esAfiliado: false, wsDisponible: false };

  const dniFormateado = formatearDni(numeroAsociado);

  try {
    const resp = await fetch(
      `${wsUrl}/${encodeURIComponent(dniFormateado)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(6000),
      }
    );

    // El endpoint siempre devuelve HTTP 200 aunque el afiliado no exista
    if (!resp.ok) return { esAfiliado: false, wsDisponible: true };

    const data = await resp.json();

    // status_code: 200 → afiliado encontrado y activo
    // status_code: 404 → no encontrado
    const esAfiliado = data?.status_code === 200;

    return { esAfiliado, wsDisponible: true };
  } catch {
    // Error de red, timeout o WS caído — no bloquear el registro
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
  return res.json(resultado); // { esAfiliado: bool, wsDisponible: bool, telefono: string|null }
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
    telefono:        usuario.telefono,
    numeroAsociado:  usuario.numero_asociado,
    esAdmin:         usuario.es_admin,
    esAfiliado:      usuario.es_afiliado,
    fechaRegistro:   usuario.fecha_registro,
  };
}

// ─── Registro ─────────────────────────────────────────────────────────────────

export async function registrar(req, res) {
  try {
    const { nombre, apellido, email, password, numeroAsociado, telefono } = req.body;

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

    // Verificar si el DNI ya está registrado
    const dniLimpio = numeroAsociado?.trim() || null;
    if (dniLimpio) {
      const dniExistente = await pool.query(
        "SELECT id FROM usuarios WHERE numero_asociado = $1",
        [dniLimpio]
      );
      if (dniExistente.rows.length > 0) {
        return res.status(409).json({ error: "Ya existe una cuenta registrada con ese DNI" });
      }
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Verificar si es afiliado mediante webservice (no bloquea el registro)
    const { esAfiliado } = await verificarAfiliado(numeroAsociado?.trim());

    // Insertar usuario
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, numero_asociado, telefono, es_afiliado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        nombre.trim(),
        apellido.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        numeroAsociado?.trim() || null,
        telefono?.trim() || null,
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

// ─── Recuperar contraseña — paso 1: solicitar reset ──────────────────────────

export async function olvideMiPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ error: "El email es obligatorio" });
    }

    // Buscar usuario — respuesta genérica para no revelar si el email existe
    const result = await pool.query(
      "SELECT id, nombre FROM usuarios WHERE email = $1 AND activo = TRUE",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.json({ mensaje: "Si el email está registrado, recibirás un enlace en breve" });
    }

    const usuario = result.rows[0];

    // Invalidar tokens anteriores del usuario
    await pool.query(
      "UPDATE password_reset_tokens SET usado = TRUE WHERE usuario_id = $1 AND usado = FALSE",
      [usuario.id]
    );

    // Generar token seguro de 32 bytes (64 chars hex)
    const token    = crypto.randomBytes(32).toString("hex");
    const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      "INSERT INTO password_reset_tokens (usuario_id, token, expira_en) VALUES ($1, $2, $3)",
      [usuario.id, token, expiraEn]
    );

    const frontendUrl = process.env.FRONTEND_URL || "https://quiniela-nu.vercel.app";
    const resetLink   = `${frontendUrl}/#reset?token=${token}`;

    // Enviar email con Nodemailer + Gmail
    await transporter.sendMail({
      from: `"La Jugada Ganadora" <${process.env.GMAIL_USER}>`,
      to:   email.toLowerCase().trim(),
      subject: "Recuperá tu contraseña — La Jugada Ganadora Chorotega",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #003080; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #f5c200; margin: 0; font-size: 22px;">La Jugada Ganadora</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Cooperativa Chorotega</p>
          </div>
          <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <p style="color: #111827; font-size: 15px;">Hola <strong>${usuario.nombre}</strong>,</p>
            <p style="color: #374151; font-size: 14px;">Recibimos una solicitud para recuperar la contraseña de tu cuenta.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}"
                 style="background: #003080; color: white; padding: 14px 32px; border-radius: 8px;
                        text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
                Recuperar contraseña
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, podés ignorar este email.</p>
          </div>
        </div>
      `,
    });

    return res.json({ mensaje: "Si el email está registrado, recibirás un enlace en breve" });
  } catch (err) {
    console.error("Error olvideMiPassword:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ─── Recuperar contraseña — paso 2: establecer nueva contraseña ───────────────

export async function resetPassword(req, res) {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ error: "Token y nueva contraseña son obligatorios" });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Buscar token válido, no usado y no expirado
    const result = await pool.query(
      `SELECT prt.id, prt.usuario_id
       FROM password_reset_tokens prt
       WHERE prt.token = $1
         AND prt.usado = FALSE
         AND prt.expira_en > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "El enlace es inválido o ya expiró" });
    }

    const { id: tokenId, usuario_id } = result.rows[0];

    // Actualizar contraseña
    const passwordHash = await bcrypt.hash(nuevaPassword, 12);
    await pool.query(
      "UPDATE usuarios SET password_hash = $1 WHERE id = $2",
      [passwordHash, usuario_id]
    );

    // Invalidar token usado
    await pool.query(
      "UPDATE password_reset_tokens SET usado = TRUE WHERE id = $1",
      [tokenId]
    );

    return res.json({ mensaje: "Contraseña actualizada correctamente. Ya podés iniciar sesión." });
  } catch (err) {
    console.error("Error resetPassword:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
