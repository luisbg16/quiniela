import { useState, useEffect, useMemo } from "react";
import { ranking as rankingApi } from "../services/api.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];
const PAGE_SIZE = 20;

function PaginadorTabla({ page, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const withEllipsis = nums.reduce((acc, p, i) => {
    if (i > 0 && p - nums[i - 1] > 1) acc.push("...");
    acc.push(p);
    return acc;
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "16px", justifyContent: "center", flexWrap: "wrap" }}>
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1}
        style={{ minWidth: "32px", height: "32px", padding: "0 8px", border: "1.5px solid #d0d9ec", borderRadius: "7px", background: "white", color: "#005aba", cursor: "pointer", fontSize: "14px" }}>‹</button>
      {withEllipsis.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} style={{ fontSize: "12px", color: "#8097c0", padding: "0 2px" }}>…</span>
        ) : (
          <button key={p} type="button" onClick={() => onPage(p)}
            style={{ minWidth: "32px", height: "32px", padding: "0 8px", border: "1.5px solid #d0d9ec", borderRadius: "7px", background: p === page ? "#003080" : "white", color: p === page ? "white" : "#003080", cursor: "pointer", fontSize: "13px", fontWeight: p === page ? "700" : "400", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {p}
          </button>
        )
      )}
      <button type="button" onClick={() => onPage(page + 1)} disabled={page === totalPages}
        style={{ minWidth: "32px", height: "32px", padding: "0 8px", border: "1.5px solid #d0d9ec", borderRadius: "7px", background: "white", color: "#005aba", cursor: "pointer", fontSize: "14px" }}>›</button>
      <span style={{ fontSize: "11px", color: "#8097c0", marginLeft: "8px" }}>{total} participantes</span>
    </div>
  );
}

export default function TablaPage({ currentUser }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    rankingApi.obtener({ page: 1, limit: 1000 })
      .then((r) => setData(r.ranking ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Encontrar al usuario logueado en el ranking
  const misDatos = useMemo(() => {
    if (!currentUser || data.length === 0) return null;
    const nom = (currentUser.nombre || "").toLowerCase().trim();
    const ape = (currentUser.apellido || "").toLowerCase().trim();
    return data.find(
      (r) =>
        (r.nombre || "").toLowerCase().trim() === nom &&
        (r.apellido || "").toLowerCase().trim() === ape
    ) || null;
  }, [data, currentUser]);

  // Filtrar por búsqueda
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) =>
      `${r.nombre} ${r.apellido}`.toLowerCase().includes(q)
    );
  }, [data, search]);

  // Filas visibles (paginadas sobre los filtrados)
  const visibleRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, page]);

  // Resetear página al buscar
  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

      {/* Encabezado con "Mis Puntos" */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", marginBottom: "24px", flexWrap: "wrap" }}>
        {/* Título */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "5px", height: "42px", background: "linear-gradient(180deg,#f5c200,#005aba)", borderRadius: "3px" }} />
          <div>
            <h1 style={{ fontFamily: "'Boldonse', cursive", fontSize: "26px", color: "#003080", margin: 0, textTransform: "uppercase" }}>
              Tabla de Posiciones
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#8097c0", fontFamily: "'Inter', sans-serif" }}>
              La Jugada Ganadora Chorotega · FIFA World Cup 2026
            </p>
          </div>
        </div>

        {/* Mis Puntos — usuario con datos en el ranking */}
        {currentUser && misDatos && (
          <div style={{
            background: "linear-gradient(135deg, #003080 0%, #005aba 100%)",
            borderRadius: "12px",
            padding: "12px 20px",
            color: "white",
            minWidth: "160px",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(0,48,128,0.25)",
          }}>
            <div style={{ fontSize: "10px", fontFamily: "'Inter', sans-serif", opacity: 0.8, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
              Mis Puntos
            </div>
            <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "28px", lineHeight: 1, color: "#f5c200" }}>
              {misDatos.puntaje ?? 0}
            </div>
            <div style={{ fontSize: "11px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "600", marginTop: "4px", opacity: 0.9 }}>
              {Number(misDatos.posicion) <= 3
                ? MEDALLAS[Number(misDatos.posicion) - 1]
                : `Posición #${misDatos.posicion}`}
            </div>
          </div>
        )}

        {/* Mis Puntos — usuario logueado pero sin puntos aún */}
        {currentUser && !misDatos && !loading && data.length > 0 && (
          <div style={{
            background: "#f0f4ff",
            border: "1.5px dashed #b3c8f0",
            borderRadius: "12px",
            padding: "12px 20px",
            color: "#5c7080",
            minWidth: "160px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "10px", fontFamily: "'Inter', sans-serif", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
              Mis Puntos
            </div>
            <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "24px", lineHeight: 1, color: "#8097c0" }}>—</div>
            <div style={{ fontSize: "10px", fontFamily: "'Inter', sans-serif", marginTop: "4px" }}>Sin puntos aún</div>
          </div>
        )}
      </div>

      {/* Leyenda de puntos */}
      <div style={{
        background: "#eef7ff", border: "1px solid #b3d4f7",
        borderRadius: "10px", padding: "12px 18px",
        marginBottom: "18px", display: "flex", gap: "24px", flexWrap: "wrap",
      }}>
        <div style={{ fontSize: "12px", color: "#1565c0", fontFamily: "'Inter', sans-serif" }}>
          <strong>Sistema de puntos:</strong>
        </div>
        <div style={{ fontSize: "12px", color: "#1565c0" }}>✅ Resultado correcto = <strong>1 pt</strong></div>
        <div style={{ fontSize: "12px", color: "#1565c0" }}>🎯 Marcador exacto = <strong>+2 pts</strong></div>
        <div style={{ fontSize: "12px", color: "#1565c0" }}>📌 Máximo por partido = <strong>3 pts</strong></div>
      </div>

      {/* Buscador */}
      {!loading && !error && data.length > 0 && (
        <div style={{ marginBottom: "16px", position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "#8097c0", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar participante por nombre..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 36px 10px 36px",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              border: "1.5px solid #d0d9ec",
              borderRadius: "10px",
              outline: "none",
              color: "#003080",
              background: "white",
              boxShadow: "0 1px 4px rgba(10,36,100,0.05)",
            }}
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8097c0", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}
            >×</button>
          )}
        </div>
      )}

      {/* Estados */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px", color: "#8097c0", fontSize: "14px" }}>
          Cargando tabla…
        </div>
      )}

      {error && (
        <div style={{ background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: "8px", padding: "14px 18px", color: "#c62828", fontSize: "13px" }}>
          ⚠️ No se pudo cargar la tabla: {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        data.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "56px 24px",
            background: "white", borderRadius: "12px",
            border: "1px solid var(--ch-border)",
          }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏆</div>
            <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "18px", color: "#003080", marginBottom: "8px" }}>
              El torneo no ha comenzado
            </div>
            <div style={{ fontSize: "13px", color: "#8097c0", fontFamily: "'Inter', sans-serif" }}>
              Los puntos se mostrarán aquí cuando el admin cargue los primeros resultados.
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 24px",
            background: "white", borderRadius: "12px",
            border: "1px solid var(--ch-border)",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>🔍</div>
            <div style={{ fontSize: "15px", color: "#5c7080", fontFamily: "'Inter', sans-serif" }}>
              No se encontró ningún participante con ese nombre.
            </div>
          </div>
        ) : (
          /* tabla-scroll habilita scroll horizontal en móvil (via index.css) */
          <div className="tabla-scroll">
          <div style={{ background: "white", borderRadius: "14px", border: "1px solid var(--ch-border)", overflow: "hidden", boxShadow: "0 4px 20px rgba(10,36,100,0.07)", minWidth: "480px" }}>
            {/* Cabecera tabla */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr 100px 90px 90px",
              background: "#003080", color: "white",
              padding: "12px 20px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: "700", fontSize: "12px",
              textTransform: "uppercase", letterSpacing: "1px",
            }}>
              <span style={{ textAlign: "center" }}>#</span>
              <span>Participante</span>
              <span style={{ textAlign: "center" }}>N° Afiliado</span>
              <span style={{ textAlign: "center" }}>Estado</span>
              <span style={{ textAlign: "center" }}>Puntos</span>
            </div>

            {/* Filas */}
            {visibleRows.map((row, idx) => {
              const pos = Number(row.posicion);
              const isTop3 = pos <= 3;
              const isMe = currentUser &&
                (row.nombre || "").toLowerCase().trim() === (currentUser.nombre || "").toLowerCase().trim() &&
                (row.apellido || "").toLowerCase().trim() === (currentUser.apellido || "").toLowerCase().trim();
              return (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr 100px 90px 90px",
                    padding: "13px 20px",
                    borderBottom: "1px solid #f0f3fa",
                    alignItems: "center",
                    background: isMe
                      ? "#e8f0fe"
                      : isTop3
                        ? (pos === 1 ? "#fffde7" : pos === 2 ? "#f8f9ff" : "#f9f9f9")
                        : "white",
                    transition: "background 0.1s",
                    outline: isMe ? "2px solid #4285f4" : "none",
                    outlineOffset: "-2px",
                  }}
                >
                  {/* Posición */}
                  <div style={{ textAlign: "center" }}>
                    {isTop3 ? (
                      <span style={{ fontSize: "22px" }}>{MEDALLAS[pos - 1]}</span>
                    ) : (
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: "700", fontSize: "16px",
                        color: "#8097c0",
                      }}>
                        {pos}
                      </span>
                    )}
                  </div>

                  {/* Nombre */}
                  <div>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: "700", fontSize: "15px",
                      color: isMe ? "#1a56db" : "#003080",
                      display: "flex", alignItems: "center", gap: "6px",
                    }}>
                      {row.nombre} {row.apellido}
                      {isMe && (
                        <span style={{
                          fontSize: "9px", fontFamily: "'Inter', sans-serif",
                          background: "#1a56db", color: "white",
                          borderRadius: "4px", padding: "1px 5px",
                          fontWeight: "700", letterSpacing: "0.5px",
                        }}>TÚ</span>
                      )}
                    </div>
                    {row.fecha_actualizacion && (
                      <div style={{ fontSize: "10px", color: "#b0bec5", marginTop: "1px" }}>
                        Actualizado {new Date(row.fecha_actualizacion).toLocaleDateString("es-HN")}
                      </div>
                    )}
                  </div>

                  {/* No. Asociado */}
                  <div style={{
                    textAlign: "center",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px", color: "#5c7080",
                  }}>
                    {row.numero_asociado || "—"}
                  </div>

                  {/* Afiliado */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 9px", borderRadius: "12px",
                      fontSize: "10px", fontWeight: "700",
                      background: row.es_afiliado ? "#e8f5e9" : "#f5f5f5",
                      color: row.es_afiliado ? "#2e7d32" : "#9e9e9e",
                    }}>
                      {row.es_afiliado ? "Afiliado" : "No"}
                    </span>
                  </div>

                  {/* Puntos */}
                  <div style={{
                    textAlign: "center",
                    fontFamily: "'Boldonse', cursive",
                    fontSize: "20px",
                    color: isTop3 ? "#005aba" : "#003080",
                  }}>
                    {row.puntaje ?? 0}
                  </div>
                </div>
              );
            })}
          </div>
          </div> /* cierra tabla-scroll */
        )
      )}

      {!loading && !error && filteredData.length > PAGE_SIZE && (
        <PaginadorTabla page={page} total={filteredData.length} onPage={setPage} />
      )}

      <p style={{ fontSize: "11px", color: "#b0bec5", textAlign: "center", marginTop: "20px", fontFamily: "'Inter', sans-serif" }}>
        Los puntos se actualizan después de cada ronda cuando el administrador carga los resultados oficiales.
      </p>
    </div>
  );
}
