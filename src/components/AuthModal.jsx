import { useState, useEffect, useRef } from "react";
import logoNavBar from "../assets/logo_color.png";
import { auth } from "../services/api.js";

// ——————————————————————————————————————————
// Campo de formulario reutilizable
// ——————————————————————————————————————————
function Field({ label, type = "text", value, onChange, placeholder, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{
        fontSize: "11px", fontWeight: "600", color: "var(--ch-navy)",
        textTransform: "uppercase", letterSpacing: "0.6px",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>
        {label} {required && <span style={{ color: "#e53935" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          border: "1.5px solid var(--ch-border)",
          borderRadius: "7px",
          padding: "9px 12px",
          fontSize: "13px",
          fontFamily: "'Inter', sans-serif",
          color: "var(--ch-navy)",
          outline: "none",
          background: "white",
          transition: "border-color 0.15s",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--ch-blue)")}
        onBlur={(e)  => (e.target.style.borderColor = "var(--ch-border)")}
      />
    </div>
  );
}

// ——————————————————————————————————————————
// Banner de error
// ——————————————————————————————————————————
function ErrorBanner({ mensaje }) {
  if (!mensaje) return null;
  return (
    <div style={{
      background: "#fff0f0", border: "1px solid #ffcdd2", borderRadius: "6px",
      padding: "8px 12px", fontSize: "12px", color: "#c62828",
      fontFamily: "'Inter', sans-serif",
    }}>
      {mensaje}
    </div>
  );
}

// ——————————————————————————————————————————
// FORMULARIO DE INICIO DE SESIÓN
// ——————————————————————————————————————————
function LoginForm({ onSuccess, onSwitch }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Por favor completá todos los campos."); return; }

    setLoading(true);
    try {
      const data = await auth.login({ email, password });
      onSuccess(data.usuario);
    } catch (err) {
      setError(err.message || "Error al ingresar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Field label="Correo electrónico" type="email" value={email} onChange={setEmail}
        placeholder="tu@email.com" required />
      <Field label="Contraseña" type="password" value={password} onChange={setPassword}
        placeholder="••••••••" required />

      <ErrorBanner mensaje={error} />

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? "#90bce8" : "var(--ch-blue)",
          color: "white", border: "none", borderRadius: "8px",
          padding: "12px", fontSize: "14px", fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: "0.5px", transition: "background 0.15s",
        }}
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "var(--ch-text-muted)", fontFamily: "'Inter', sans-serif" }}>
          ¿No tenés cuenta?{" "}
        </span>
        <button
          type="button" onClick={onSwitch}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--ch-blue)", fontSize: "12px", fontWeight: "700",
            fontFamily: "'Inter', sans-serif", padding: 0,
          }}
        >
          Registrarse
        </button>
      </div>
    </form>
  );
}

// ——————————————————————————————————————————
// Badge de estado de verificación de afiliado
// ——————————————————————————————————————————
// status: "idle" | "loading" | "afiliado" | "no-afiliado" | "no-ws"
function AfiliadoBadge({ status }) {
  if (status === "idle") return null;

  const configs = {
    loading: {
      bg: "#f0f4ff", border: "#c5d8f7", color: "#4a6080",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      ),
      texto: "Verificando DNI en el sistema de afiliados…",
    },
    afiliado: {
      bg: "#e8f5e9", border: "#a5d6a7", color: "#1b5e20",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ flexShrink: 0 }}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ),
      texto: "DNI verificado — eres afiliado activo de Cooperativa Chorotega",
    },
    "no-afiliado": {
      bg: "#fff8e1", border: "#ffe082", color: "#5f4200",
      icon: <span style={{ fontSize: "14px", flexShrink: 0 }}>⚠️</span>,
      texto: "DNI no encontrado como afiliado activo. Podés registrarte, pero ser afiliado es requisito para reclamar premios.",
    },
    "no-ws": {
      bg: "#f3f3f3", border: "#d0d0d0", color: "#555",
      icon: <span style={{ fontSize: "14px", flexShrink: 0 }}>ℹ️</span>,
      texto: "Verificación automática no disponible por ahora. Un administrador confirmará tu condición de afiliado.",
    },
  };

  const c = configs[status];
  if (!c) return null;

  return (
    <>
      {/* Animación de rotación para el spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "8px",
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: "7px",
        padding: "10px 12px", fontSize: "11.5px", color: c.color,
        fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
      }}>
        <span style={{ marginTop: "1px" }}>{c.icon}</span>
        <span>{c.texto}</span>
      </div>
    </>
  );
}

// ——————————————————————————————————————————
// FORMULARIO DE REGISTRO
// ——————————————————————————————————————————
function RegisterForm({ onSuccess, onSwitch }) {
  const [dni,      setDni]      = useState("");
  const [nombre,   setNombre]   = useState("");
  const [apellido, setApellido] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Estado de verificación de afiliado: idle | loading | afiliado | no-afiliado | no-ws
  const [afiliadoStatus, setAfiliadoStatus] = useState("idle");
  const debounceRef = useRef(null);

  const dniLimpio = dni.replace(/\D/g, "");

  // Verificación automática: se dispara 800ms después de que el DNI tenga 13 dígitos
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (dniLimpio.length !== 13) {
      setAfiliadoStatus("idle");
      return;
    }

    // DNI completo → mostrar "cargando" y luego consultar el backend
    setAfiliadoStatus("loading");
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await auth.verificarAfiliado(dniLimpio);
        if (!data.wsDisponible) {
          setAfiliadoStatus("no-ws");
        } else {
          setAfiliadoStatus(data.esAfiliado ? "afiliado" : "no-afiliado");
        }
      } catch {
        // Error de red u otro → tratar como WS no disponible
        setAfiliadoStatus("no-ws");
      }
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [dniLimpio]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!dniLimpio) {
      setError("El DNI es obligatorio.");
      return;
    }
    if (!nombre || !apellido || !email || !password) {
      setError("Por favor completá todos los campos obligatorios.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const data = await auth.register({
        nombre, apellido, email, password,
        numeroAsociado: dniLimpio || undefined,
      });
      onSuccess(data.usuario);
    } catch (err) {
      setError(err.message || "Error al crear la cuenta. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* DNI — primer campo */}
      <Field label="DNI (Identidad)" value={dni} onChange={setDni}
        placeholder="Ej. 0801199012345" required />

      {/* Badge de verificación automática */}
      <AfiliadoBadge status={afiliadoStatus} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Nombre"   value={nombre}   onChange={setNombre}   placeholder="Juan"  required />
        <Field label="Apellido" value={apellido} onChange={setApellido} placeholder="Pérez" required />
      </div>

      <Field label="Correo electrónico" type="email" value={email} onChange={setEmail}
        placeholder="tu@email.com" required />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Contraseña" type="password" value={password} onChange={setPassword}
          placeholder="Mínimo 6 caracteres" required />
        <Field label="Confirmar" type="password" value={confirm} onChange={setConfirm}
          placeholder="Repetir" required />
      </div>

      <ErrorBanner mensaje={error} />

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? "#90bce8" : "var(--ch-blue)",
          color: "white", border: "none", borderRadius: "8px",
          padding: "12px", fontSize: "14px", fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: "0.5px", transition: "background 0.15s",
        }}
      >
        {loading ? "Creando cuenta..." : "Crear cuenta y guardar quiniela"}
      </button>

      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "var(--ch-text-muted)", fontFamily: "'Inter', sans-serif" }}>
          ¿Ya tenés cuenta?{" "}
        </span>
        <button
          type="button" onClick={onSwitch}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--ch-blue)", fontSize: "12px", fontWeight: "700",
            fontFamily: "'Inter', sans-serif", padding: 0,
          }}
        >
          Iniciá sesión
        </button>
      </div>
    </form>
  );
}

// ——————————————————————————————————————————
// MODAL PRINCIPAL
// ——————————————————————————————————————————
export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState("login");

  if (!isOpen) return null;

  const handleSuccess = (usuario) => {
    onAuthSuccess(usuario);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="auth-modal-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,30,80,0.55)",
        backdropFilter: "blur(3px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="auth-modal-content"
        style={{
          background: "white", borderRadius: "20px 20px 0 0",
          padding: "28px 24px 32px", width: "100%", maxWidth: "480px",
          boxShadow: "0 -8px 40px rgba(0,30,80,0.22)",
          position: "relative",
          maxHeight: "92dvh",
          overflowY: "auto",
          /* En desktop, lo mostramos como modal centrado */
          margin: "0 auto",
        }}
      >
        {/* Cerrar */}
        <button type="button" onClick={onClose} style={{
          position: "absolute", top: "14px", right: "16px",
          background: "none", border: "none", cursor: "pointer",
          fontSize: "18px", color: "var(--ch-text-muted)", lineHeight: 1, padding: "4px",
        }}>
          ✕
        </button>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img src={logoNavBar} alt="Chorotega" style={{ height: "38px", objectFit: "contain" }} />
        </div>

        {/* Título */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <h2 style={{
            fontFamily: "'Boldonse', cursive", fontSize: "20px",
            color: "var(--ch-navy)", margin: "0 0 6px",
          }}>
            {tab === "login" ? "Iniciá sesión" : "Registrate"}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--ch-text-muted)", margin: 0, fontFamily: "'Inter', sans-serif" }}>
            {tab === "login"
              ? "Ingresá para guardar tu quiniela."
              : "Creá tu cuenta para participar en el concurso."}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "#f0f3fa", borderRadius: "10px",
          padding: "3px", marginBottom: "22px", gap: "3px",
        }}>
          {[["login", "Ingresar"], ["register", "Registrarse"]].map(([key, label]) => (
            <button
              key={key} type="button" onClick={() => setTab(key)}
              style={{
                flex: 1, padding: "8px", border: "none", borderRadius: "8px", cursor: "pointer",
                fontSize: "12px", fontWeight: "700",
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.5px", textTransform: "uppercase",
                background: tab === key ? "white" : "transparent",
                color: tab === key ? "var(--ch-blue)" : "var(--ch-text-muted)",
                boxShadow: tab === key ? "0 1px 4px rgba(0,30,80,0.12)" : "none",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Formulario activo */}
        {tab === "login"
          ? <LoginForm    onSuccess={handleSuccess} onSwitch={() => setTab("register")} />
          : <RegisterForm onSuccess={handleSuccess} onSwitch={() => setTab("login")} />
        }

        <p style={{
          fontSize: "10px", color: "var(--ch-text-muted)",
          textAlign: "center", marginTop: "16px", marginBottom: 0,
          fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
        }}>
          Al continuar, aceptás las condiciones del concurso de Cooperativa Chorotega.
        </p>
      </div>
    </div>
  );
}
