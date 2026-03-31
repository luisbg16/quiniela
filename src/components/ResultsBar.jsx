import { useRef, useEffect, useState, useCallback } from "react";
import { getFlagUrl } from "../data/flags.js";

const CARD_W   = 210; // px — ancho fijo de cada tarjeta
const CARD_GAP = 10;  // px — espacio entre tarjetas
const PAGE_SZ  = 4;   // tarjetas visibles por "página" al hacer scroll
const AUTO_MS  = 3500; // ms entre scroll automático

function TeamBadge({ team }) {
  const flagUrl = team?.nombre ? getFlagUrl(team.nombre, 32) : null;

  if (team?.logo) {
    return (
      <img
        src={team.logo}
        alt={team.nombre}
        style={{ width: "22px", height: "22px", objectFit: "contain", display: "block" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={team?.nombre || ""}
        style={{ width: "28px", height: "19px", objectFit: "cover", borderRadius: "3px", display: "block" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return <span style={{ fontSize: "20px", lineHeight: 1 }}>{team?.bandera || "🏳️"}</span>;
}

export default function ResultsBar({ matches = [] }) {
  const scrollRef  = useRef(null);
  const timerRef   = useRef(null);
  const [paused, setPaused]   = useState(false);
  const [page,   setPage]     = useState(0);

  const totalPages = Math.ceil(matches.length / PAGE_SZ);

  // ——— Scroll a una página concreta ———
  const goToPage = useCallback((p) => {
    const el = scrollRef.current;
    if (!el) return;
    const target = p * PAGE_SZ * (CARD_W + CARD_GAP);
    el.scrollTo({ left: target, behavior: "smooth" });
    setPage(p);
  }, []);

  // ——— Auto-scroll ———
  useEffect(() => {
    if (matches.length <= PAGE_SZ) return; // sin scroll si caben todos
    timerRef.current = setInterval(() => {
      if (paused) return;
      setPage((prev) => {
        const next = prev >= totalPages - 1 ? 0 : prev + 1;
        const el = scrollRef.current;
        if (el) {
          const target = next * PAGE_SZ * (CARD_W + CARD_GAP);
          el.scrollTo({ left: target, behavior: "smooth" });
        }
        return next;
      });
    }, AUTO_MS);
    return () => clearInterval(timerRef.current);
  }, [matches.length, paused, totalPages]);

  if (!matches || matches.length === 0) {
    return (
      <div style={{
        background: "white",
        borderBottom: "1px solid var(--ch-border)",
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <div style={{ width: "3px", height: "12px", background: "var(--ch-blue)", borderRadius: "2px" }} />
        <span style={{
          color: "var(--ch-text-muted)", fontSize: "9px", fontWeight: "700",
          textTransform: "uppercase", letterSpacing: "2.5px",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          Cargando calendario del Mundial 2026…
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ background: "white", borderBottom: "1px solid var(--ch-border)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "12px 28px 10px" }}>

        {/* Label + indicadores */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "3px", height: "12px", background: "var(--ch-blue)", borderRadius: "2px" }} />
            <span style={{
              color: "var(--ch-text-muted)", fontSize: "9px", fontWeight: "700",
              textTransform: "uppercase", letterSpacing: "2.5px",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}>
              Calendario Mundial 2026
            </span>
          </div>

          {/* Dots de página */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPage(i)}
                  style={{
                    width: i === page ? "18px" : "6px",
                    height: "6px",
                    borderRadius: "3px",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    background: i === page ? "var(--ch-blue)" : "var(--ch-border)",
                    transition: "all 0.25s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Carrusel */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: `${CARD_GAP}px`,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",       // Firefox
            msOverflowStyle: "none",      // IE/Edge
            paddingBottom: "2px",
          }}
        >
          {/* Ocultar scrollbar en WebKit */}
          <style>{`.results-scroll::-webkit-scrollbar{display:none}`}</style>

          {matches.map((match) => (
            <article
              key={match.id}
              style={{
                flexShrink: 0,
                width: `${CARD_W}px`,
                scrollSnapAlign: "start",
                background: "#f8f9fc",
                border: "1px solid var(--ch-border)",
                borderRadius: "8px",
                padding: "9px 12px",
              }}
            >
              {/* Grupo + fecha */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "8px",
              }}>
                <span style={{
                  background: "var(--ch-blue)", color: "white",
                  fontSize: "8px", fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: "1px",
                  padding: "2px 6px", borderRadius: "3px",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  flexShrink: 0,
                }}>
                  {match.grupo}
                </span>
                <span style={{
                  color: "var(--ch-text-muted)", fontSize: "9px",
                  fontWeight: "500", fontFamily: "'Inter', sans-serif",
                  marginLeft: "6px", textAlign: "right",
                  whiteSpace: "nowrap",
                }}>
                  {match.fecha}
                </span>
              </div>

              {/* Equipos */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: "4px",
              }}>
                {/* Local */}
                <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "3px" }}>
                    <TeamBadge team={match.local} />
                  </div>
                  <div style={{
                    color: "var(--ch-navy)", fontSize: "10px", fontWeight: "600",
                    fontFamily: "'Inter', sans-serif",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {match.local?.nombre}
                  </div>
                </div>

                {/* Marcador / VS */}
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  {match.resultado ? (
                    <div style={{
                      color: "var(--ch-navy)", fontSize: "14px", fontWeight: "700",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: "1px",
                    }}>
                      {match.resultado.home} – {match.resultado.away}
                    </div>
                  ) : (
                    <>
                      <div style={{
                        color: "var(--ch-border)", fontSize: "9px", fontWeight: "700",
                        letterSpacing: "1px",
                      }}>
                        VS
                      </div>
                      <div style={{
                        color: "var(--ch-text-muted)", fontSize: "8px",
                        fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
                        marginTop: "1px",
                      }}>
                        {match.hora}
                      </div>
                    </>
                  )}
                </div>

                {/* Visitante */}
                <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "3px" }}>
                    <TeamBadge team={match.visitante} />
                  </div>
                  <div style={{
                    color: "var(--ch-navy)", fontSize: "10px", fontWeight: "600",
                    fontFamily: "'Inter', sans-serif",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {match.visitante?.nombre}
                  </div>
                </div>
              </div>

              {/* Estadio */}
              <div style={{
                marginTop: "7px", paddingTop: "6px",
                borderTop: "1px solid var(--ch-border)",
                color: "var(--ch-text-muted)", fontSize: "8px",
                fontFamily: "'Inter', sans-serif",
                textAlign: "center",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                📍 {match.estadio}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
