import { useState, useEffect } from "react";
import { ranking as rankingApi } from "../services/api.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];
const PAGE_SIZE = 20;

function PaginadorTabla({ page, totalPages, total, onPage }) {
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

export default function TablaPage() {
  const [rows,       setRows]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    setError("");
    rankingApi.obtener({ page, limit: PAGE_SIZE })
      .then((r) => {
        setRows(r.ranking ?? []);
        setTotal(r.total ?? 0);
        setTotalPages(r.totalPages ?? 1);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  // visibleRows viene ya paginado del backend
  const visibleRows = rows;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px" }}>
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

      {/* Leyenda de puntos */}
      <div style={{
        background: "#eef7ff", border: "1px solid #b3d4f7",
        borderRadius: "10px", padding: "12px 18px",
        marginBottom: "24px", display: "flex", gap: "24px", flexWrap: "wrap",
      }}>
        <div style={{ fontSize: "12px", color: "#1565c0", fontFamily: "'Inter', sans-serif" }}>
          <strong>Sistema de puntos:</strong>
        </div>
        <div style={{ fontSize: "12px", color: "#1565c0" }}>✅ Resultado correcto = <strong>1 pt</strong></div>
        <div style={{ fontSize: "12px", color: "#1565c0" }}>🎯 Marcador exacto = <strong>+2 pts</strong></div>
        <div style={{ fontSize: "12px", color: "#1565c0" }}>📌 Máximo por partido = <strong>3 pts</strong></div>
      </div>

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
        total === 0 ? (
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
              return (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr 100px 90px 90px",
                    padding: "13px 20px",
                    borderBottom: "1px solid #f0f3fa",
                    alignItems: "center",
                    background: isTop3 ? (pos === 1 ? "#fffde7" : pos === 2 ? "#f8f9ff" : "#f9f9f9") : "white",
                    transition: "background 0.1s",
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
                      fontWeight: "700", fontSize: "15px", color: "#003080",
                    }}>
                      {row.nombre} {row.apellido}
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

      {!loading && !error && totalPages > 1 && (
        <PaginadorTabla page={page} totalPages={totalPages} total={total} onPage={setPage} />
      )}

      <p style={{ fontSize: "11px", color: "#b0bec5", textAlign: "center", marginTop: "20px", fontFamily: "'Inter', sans-serif" }}>
        Los puntos se actualizan después de cada ronda cuando el administrador carga los resultados oficiales.
      </p>
    </div>
  );
}
