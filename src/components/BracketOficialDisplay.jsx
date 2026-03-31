import { useState, useEffect } from "react";
import { admin as adminApi } from "../services/api.js";
import { getFlagUrl } from "../data/flags.js";

// ─── Estructura de rondas ───────────────────────────────────────────────────
// Cada side (L / R) tiene: r32 (8 slots), r16 (4), qf (2), sf (1), f (1)
// En r32 cada par de slots adyacentes (0-1, 2-3, ...) forma un partido
// En r16 cada par (0-1, 2-3) forma un partido, y así.

const RONDAS = [
  { key: "r32", label: "16avos de Final",  matchesPerSide: 4, teamsPerMatch: 2 },
  { key: "r16", label: "Octavos de Final", matchesPerSide: 2, teamsPerMatch: 2 },
  { key: "qf",  label: "Cuartos de Final", matchesPerSide: 1, teamsPerMatch: 2 },
  { key: "sf",  label: "Semifinales",      matchesPerSide: 1, teamsPerMatch: 1 },
];

// ─── Componente bandera pequeña ──────────────────────────────────────────────
function Flag({ nombre, size = 18 }) {
  const [err, setErr] = useState(false);
  const url = nombre && !err ? getFlagUrl(nombre, size) : null;
  if (!url) return <span style={{ fontSize: "13px" }}>🏳️</span>;
  return (
    <img
      src={url} alt={nombre}
      style={{ width: `${Math.round(size * 1.5)}px`, height: `${size}px`, objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
      onError={() => setErr(true)}
    />
  );
}

// ─── Celda de un equipo ──────────────────────────────────────────────────────
function TeamCell({ nombre, isDefined }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "7px",
      padding: "6px 10px",
      background: isDefined ? "white" : "#f5f7fc",
      borderRadius: "6px",
      border: `1px solid ${isDefined ? "#c5d5f0" : "#e8ecf5"}`,
      minWidth: "140px", flex: 1,
    }}>
      {isDefined ? (
        <>
          <Flag nombre={nombre} size={16} />
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: "700", fontSize: "13px", color: "#003080",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {nombre}
          </span>
        </>
      ) : (
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "11px", color: "#b0bec5", fontStyle: "italic",
        }}>
          Por definir
        </span>
      )}
    </div>
  );
}

// ─── Partido (dos equipos enfrentados) ──────────────────────────────────────
function MatchCard({ teamA, teamB, matchNum }) {
  return (
    <div style={{
      background: "#f8f9fd", borderRadius: "8px",
      border: "1px solid #e0e8f5", overflow: "hidden",
    }}>
      <div style={{
        fontSize: "9px", fontWeight: "900", color: "#8097c0",
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: "1px", textTransform: "uppercase",
        padding: "4px 10px", background: "#eef2fa",
        borderBottom: "1px solid #e0e8f5",
      }}>
        Partido {matchNum}
      </div>
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <TeamCell nombre={teamA} isDefined={!!teamA} />
        <div style={{ textAlign: "center", fontSize: "10px", color: "#b0bec5", fontWeight: "700" }}>VS</div>
        <TeamCell nombre={teamB} isDefined={!!teamB} />
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function BracketOficialDisplay() {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.obtenerBracket()
      .then((d) => setBracket(d.bracket ?? {}))
      .catch(() => setBracket({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "32px", color: "#8097c0", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>
        Cargando fixture…
      </div>
    );
  }

  // Verificar si hay algún dato cargado
  const tieneData = bracket &&
    (bracket.L?.r32?.some(Boolean) || bracket.R?.r32?.some(Boolean) ||
     bracket.campeon || bracket.tercero);

  return (
    <div style={{ marginBottom: "40px" }}>

      {/* Encabezado */}
      <div style={{
        background: "linear-gradient(135deg, #003080, #005aba)",
        borderRadius: "12px 12px 0 0",
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <div>
          <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "16px", color: "#f5c200", textTransform: "uppercase" }}>
            🏆 Llaves Eliminatorias Oficiales
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif", marginTop: "3px" }}>
            El administrador actualiza el fixture conforme los equipos van clasificando
          </div>
        </div>
      </div>

      <div style={{
        border: "1px solid #c5d5f0", borderTop: "none",
        borderRadius: "0 0 12px 12px",
        background: "white", padding: "20px",
      }}>

        {!tieneData ? (
          /* Todavía no hay equipos cargados */
          <div style={{
            textAlign: "center", padding: "36px 20px",
            background: "#f8f9fd", borderRadius: "10px",
            border: "1.5px dashed #c5d5f0",
          }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>⏳</div>
            <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "15px", color: "#003080", marginBottom: "6px" }}>
              Pendiente de clasificaciones
            </div>
            <div style={{ fontSize: "12px", color: "#8097c0", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
              Las llaves eliminatorias se actualizarán aquí cuando el torneo avance
              y el administrador cargue los equipos clasificados de cada grupo.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {RONDAS.map(({ key, label, matchesPerSide, teamsPerMatch }) => {
              const L = bracket.L?.[key] ?? [];
              const R = bracket.R?.[key] ?? [];

              // Construir partidos para L y R
              // r32: 8 slots → 4 partidos (pares: 0-1, 2-3, 4-5, 6-7)
              // r16: 4 slots → 2 partidos (pares: 0-1, 2-3)
              // qf:  2 slots → 1 partido (par: 0-1)
              // sf:  1 slot  → mostrar solo el clasificado (no par)
              const makeMatches = (slots) => {
                if (teamsPerMatch === 1) return slots.map((t) => ({ a: t, b: null }));
                const matches = [];
                for (let i = 0; i < slots.length; i += 2) {
                  matches.push({ a: slots[i], b: slots[i + 1] });
                }
                return matches;
              };

              const lMatches = makeMatches(L.slice(0, matchesPerSide * teamsPerMatch));
              const rMatches = makeMatches(R.slice(0, matchesPerSide * teamsPerMatch));

              // Verificar si hay algún dato en esta ronda
              const hasL = L.some(Boolean);
              const hasR = R.some(Boolean);
              if (!hasL && !hasR) return null;

              return (
                <div key={key}>
                  {/* Título de ronda */}
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: "900", fontSize: "14px", color: "#003080",
                    textTransform: "uppercase", letterSpacing: "1.5px",
                    borderBottom: "2px solid #eef2fa", paddingBottom: "6px",
                    marginBottom: "12px",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <span style={{
                      background: "#003080", color: "#f5c200",
                      borderRadius: "4px", padding: "2px 8px", fontSize: "11px",
                    }}>
                      {label}
                    </span>
                  </div>

                  {/* Partidos lado L y R */}
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>

                    {/* Lado Izquierdo (Grupos A–F) */}
                    {hasL && (
                      <div style={{ flex: 1, minWidth: "280px" }}>
                        <div style={{
                          fontSize: "10px", fontWeight: "700", color: "#005aba",
                          textTransform: "uppercase", letterSpacing: "1px",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          marginBottom: "8px",
                        }}>
                          Zona A–F
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                          {teamsPerMatch === 2
                            ? lMatches.map((m, i) => (
                                <MatchCard key={i} teamA={m.a} teamB={m.b} matchNum={i + 1} />
                              ))
                            : lMatches.map((m, i) => (
                                <TeamCell key={i} nombre={m.a} isDefined={!!m.a} />
                              ))
                          }
                        </div>
                      </div>
                    )}

                    {/* Lado Derecho (Grupos G–L) */}
                    {hasR && (
                      <div style={{ flex: 1, minWidth: "280px" }}>
                        <div style={{
                          fontSize: "10px", fontWeight: "700", color: "#005aba",
                          textTransform: "uppercase", letterSpacing: "1px",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          marginBottom: "8px",
                        }}>
                          Zona G–L
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                          {teamsPerMatch === 2
                            ? rMatches.map((m, i) => (
                                <MatchCard key={i} teamA={m.a} teamB={m.b} matchNum={matchesPerSide + i + 1} />
                              ))
                            : rMatches.map((m, i) => (
                                <TeamCell key={i} nombre={m.a} isDefined={!!m.a} />
                              ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Gran Final */}
            {(bracket.L?.f?.[0] || bracket.R?.f?.[0]) && (
              <div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: "900", fontSize: "14px", color: "#003080",
                  textTransform: "uppercase", letterSpacing: "1.5px",
                  borderBottom: "2px solid #eef2fa", paddingBottom: "6px",
                  marginBottom: "12px",
                }}>
                  <span style={{
                    background: "#f5c200", color: "#003080",
                    borderRadius: "4px", padding: "2px 8px", fontSize: "11px",
                  }}>
                    ⭐ Gran Final
                  </span>
                </div>
                <MatchCard teamA={bracket.L?.f?.[0]} teamB={bracket.R?.f?.[0]} matchNum={1} />
              </div>
            )}

            {/* Campeón / 3er Puesto */}
            {(bracket.campeon || bracket.tercero) && (
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "4px" }}>
                {bracket.campeon && (
                  <div style={{
                    flex: 1, minWidth: "200px",
                    background: "linear-gradient(135deg, #fff8e1, #fffde7)",
                    border: "2px solid #f5c200", borderRadius: "10px",
                    padding: "14px 16px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "28px" }}>🏆</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: "700", color: "#7a5200", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Campeón</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <Flag nombre={bracket.campeon} size={20} />
                      <span style={{ fontFamily: "'Boldonse', cursive", fontSize: "15px", color: "#003080" }}>{bracket.campeon}</span>
                    </div>
                  </div>
                )}
                {bracket.tercero && (
                  <div style={{
                    flex: 1, minWidth: "200px",
                    background: "#f8f9fd", border: "1.5px solid #c5d5f0",
                    borderRadius: "10px", padding: "14px 16px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "24px" }}>🥉</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: "700", color: "#5c7080", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>3er Puesto</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <Flag nombre={bracket.tercero} size={20} />
                      <span style={{ fontFamily: "'Boldonse', cursive", fontSize: "15px", color: "#003080" }}>{bracket.tercero}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
