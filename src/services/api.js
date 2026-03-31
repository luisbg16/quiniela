/**
 * Cliente HTTP para la API de Quiniela Chorotega.
 * Todas las llamadas al backend pasan por aquí.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ─── Token JWT en memoria ─────────────────────────────────────────────────────
// (no usamos localStorage — se pierde al recargar, es intencional por seguridad)
let _token = null;

export function setToken(token) { _token = token; }
export function getToken()      { return _token; }
export function clearToken()    { _token = null; }

// ─── Fetch base con headers automáticos ──────────────────────────────────────

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (_token) {
    headers["Authorization"] = `Bearer ${_token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Incluye el detalle de PostgreSQL si está disponible
    const msg = data.detalle
      ? `${data.error}: ${data.detalle}`
      : (data.error || `Error ${response.status}`);
    throw new Error(msg);
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  /** Crear cuenta nueva */
  async register({ nombre, apellido, email, password, numeroAsociado }) {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ nombre, apellido, email, password, numeroAsociado }),
    });
    setToken(data.token);
    return data;
  },

  /** Iniciar sesión */
  async login({ email, password }) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  /** Obtener perfil del usuario autenticado */
  async me() {
    return request("/auth/me");
  },

  /**
   * Consultar si un DNI está registrado como afiliado activo.
   * Retorna: { esAfiliado: bool, wsDisponible: bool }
   * wsDisponible=false significa que el webservice no está configurado aún.
   */
  async verificarAfiliado(dni) {
    return request(`/auth/verificar-afiliado?dni=${encodeURIComponent(dni)}`);
  },

  /** Cerrar sesión (solo limpia el token en memoria) */
  logout() {
    clearToken();
  },
};

// ─── Quiniela ─────────────────────────────────────────────────────────────────

export const quiniela = {
  /** Guardar o actualizar predicciones */
  async guardar(predicciones) {
    return request("/quiniela", {
      method: "POST",
      body: JSON.stringify({ predicciones }),
    });
  },

  /** Obtener mi quiniela guardada */
  async obtener() {
    return request("/quiniela");
  },
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const admin = {
  /** Guardar resultado oficial de un partido */
  async guardarResultado({ partidoId, golesLocal, golesVis, fase = "grupos" }) {
    return request("/admin/resultados", {
      method: "POST",
      body: JSON.stringify({ partidoId, golesLocal, golesVis, fase }),
    });
  },

  /** Obtener todos los resultados oficiales */
  async obtenerResultados() {
    return request("/admin/resultados");
  },

  /** Guardar bracket oficial (equipos clasificados + picks del admin) */
  async guardarBracket(datos) {
    return request("/admin/bracket", {
      method: "POST",
      body: JSON.stringify({ datos }),
    });
  },

  /** Obtener bracket oficial */
  async obtenerBracket() {
    return request("/admin/bracket");
  },

  /** Recalcular puntos de todas las quinielas */
  async calcularPuntos() {
    return request("/admin/calcular-puntos", { method: "POST" });
  },

  /** Listar todos los usuarios (solo admin) */
  async obtenerUsuarios() {
    return request("/admin/usuarios");
  },

  /** Marcar/desmarcar afiliado (solo admin) */
  async setAfiliado({ usuarioId, esAfiliado }) {
    return request("/admin/set-afiliado", {
      method: "POST",
      body: JSON.stringify({ usuarioId, esAfiliado }),
    });
  },
};

// ─── Ranking público ──────────────────────────────────────────────────────────

export const ranking = {
  async obtener() {
    return request("/admin/ranking");
  },
};

// ─── Health check ─────────────────────────────────────────────────────────────

export async function healthCheck() {
  try {
    const data = await request("/health");
    return data.estado === "ok";
  } catch {
    return false;
  }
}
