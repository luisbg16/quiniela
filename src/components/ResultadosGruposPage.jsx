import { useState, useEffect, useMemo } from "react";
import { admin as adminApi } from "../services/api.js";
import { WC2026_MATCHES } from "../data/wc2026matches.js";
import { GROUPS_DATA, GROUP_IDS } from "../data/groups.js";
import { getFlagUrl } from "../data/flags.js";

// ── Flag helper ───────────────────────────────────────────
function Flag({ nombre, bandera }) {
  const [err, setErr] = useState(false);
  const url = (!err && nombre) ? getFlagUrl(nombre, 20) : null;
  if (url) return <img src={url} alt={nombre} style={{ width: "20px", height: "14px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }} onError={() => setErr(true)} />;
  return <span style={{ fontSize: "14px" }}>{bandera || "🏳️"}</span>;
}

// ── Fixture 16avos de Final (FIFA WC 2026) ───────────────
const DIECISEISAVOS = [
  { id: "M73",  a: "2° Grupo A", b: "2° Grupo B",          fecha: "Dom 28 jun", estadio: "Los Ángeles"     },
  { id: "M74",  a: "1° Grupo C", b: "2° Grupo F",          fecha: "Lun 29 jun", estadio: "Houston"          },
  { id: "M75",  a: "1° Grupo E", b: "3° mejor A·B·C·D·F",  fecha: "Lun 29 jun", estadio: "Boston"           },
  { id: "M76",  a: "1° Grupo F", b: "2° Grupo C",          fecha: "Lun 29 jun", estadio: "Monterrey"        },
  { id: "M77",  a: "2° Grupo E", b: "2° Grupo I",          fecha: "Mar 30 jun", estadio: "Dallas"           },
  { id: "M78",  a: "1° Grupo I", b: "3° mejor C·D·F·G·H",  fecha: "Mar 30 jun", estadio: "Nueva York"       },
  { id: "M79",  a: "1° Grupo A", b: "3° mejor C·E·F·H·I",  fecha: "Mar 30 jun", estadio: "Ciudad de México" },
  { id: "M80",  a: "1° Grupo L", b: "3° mejor E·H·J·K",    fecha: "Mié 1 jul",  estadio: "Atlanta"          },
  { id: "M81",  a: "1° Grupo G", b: "3° mejor A·E·H·I·J",  fecha: "Mié 1 jul",  estadio: "Seattle"          },
  { id: "M82",  a: "1° Grupo D", b: "3° mejor B·E·F·I·J",  fecha: "Mié 1 jul",  estadio: "San Francisco"    },
  { id: "M83",  a: "1° Grupo H", b: "2° Grupo J",          fecha: "Jue 2 jul",  estadio: "Los Ángeles"      },
  { id: "M84",  a: "2° Grupo K", b: "2° Grupo L",          fecha: "Jue 2 jul",  estadio: "Toronto"          },
  { id: "M85",  a: "1° Grupo B", b: "3° mejor E·F·G·I·J",  fecha: "Jue 2 jul",  estadio: "Kansas City"      },
  { id: "M86",  a: "2° Grupo D", b: "2° Grupo G",          fecha: "Vie 3 jul",  estadio: "Dallas"           },
  { id: "M87",  a: "1° Grupo J", b: "2° Grupo H",          fecha: "Vie 3 jul",  estadio: "Miami"            },
  { id: "M88",  a: "1° Grupo K", b: "3° mejor D·E·I·J·L",  fecha: "Vie 3 jul",  estadio: "Kansas City"      },
];

const RONDA_FIXTURES = {
  r32: DIECISEISAVOS,
  r16: [
    { id: "M89",  a: "W73", b: "W75", fecha: "Sáb 4 jul",   estadio: "Houston"         },
    { id: "M90",  a: "W74", b: "W77", fecha: "Sáb 4 jul",   estadio: "Filadelfia"       },
    { id: "M91",  a: "W76", b: "W78", fecha: "Dom 5 jul",   estadio: "Nueva York"       },
    { id: "M92",  a: "W79", b: "W80", fecha: "Dom 5 jul",   estadio: "Ciudad de México" },
    { id: "M93",  a: "W83", b: "W84", fecha: "Lun 6 jul",   estadio: "Dallas"           },
    { id: "M94",  a: "W81", b: "W82", fecha: "Lun 6 jul",   estadio: "Seattle"          },
    { id: "M95",  a: "W86", b: "W88", fecha: "Mar 7 jul",   estadio: "Atlanta"          },
    { id: "M96",  a: "W85", b: "W87", fecha: "Mar 7 jul",   estadio: "Vancouver"        },
  ],
  qf: [
    { id: "M97",  a: "W89", b: "W90", fecha: "Jue 9 jul",   estadio: "Boston"           },
    { id: "M98",  a: "W93", b: "W94", fecha: "Vie 10 jul",  estadio: "Los Ángeles"      },
    { id: "M99",  a: "W91", b: "W92", fecha: "Sáb 11 jul",  estadio: "Miami"            },
    { id: "M100", a: "W95", b: "W96", fecha: "Sáb 11 jul",  estadio: "Kansas City"      },
  ],
  sf: [
    { id: "M101", a: "W97",  b: "W98",  fecha: "Mar 14 jul", estadio: "Dallas"           },
    { id: "M102", a: "W99",  b: "W100", fecha: "Mié 15 jul", estadio: "Atlanta"          },
  ],
  tp: [
    { id: "M103", a: "RU101", b: "RU102", label: "3er Puesto", fecha: "Sáb 18 jul", estadio: "Miami" },
  ],
  f: [
    { id: "M104", a: "W101", b: "W102",   label: "Gran Final", fecha: "Dom 19 jul", estadio: "Nueva York" },
  ],
};

const SECCIONES = [
  { key: "grupos", label: "Fase de Grupos"   },
  { key: "r32",   label: "16avos de Final"  },
  { key: "r16",   label: "Octavos de Final" },
  { key: "qf",    label: "Cuartos de Final" },
  { key: "sf",    label: "Semifinales"      },
  { key: "tp",    label: "3er Puesto"       },
  { key: "f",     label: "Gran Final"       },
];

// ── Calcular tabla de posiciones de un grupo ──────────────
function calcularTablaGrupo(groupId, resultados) {
  const teams = GROUPS_DATA[groupId]?.teams ?? [];
  const matches = WC2026_MATCHES.filter(
    (m) => m.grupo?.replace("Grupo ", "").trim() === groupId
  );

  const stats = {};
  teams.forEach((t) => {
    stats[t.nombre] = { ...t, pts: 0, gf: 0, ga: 0, gd: 0, pj: 0, pg: 0, pe: 0, pp: 0 };
  });

  matches.forEach((m) => {
    const r = resultados[String(m.id)];
    if (!r) return;
    const h = m.local?.nombre, a = m.visitante?.nombre;
    if (!h || !a || !stats[h] || !stats[a]) return;
    const rh = Number(r.goles_local), ra = Number(r.goles_vis);
    stats[h].pj++; stats[h].gf += rh; stats[h].ga += ra; stats[h].gd += rh - ra;
    stats[a].pj++; stats[a].gf += ra; stats[a].ga += rh; stats[a].gd += ra - rh;
    if (rh > ra) { stats[h].pts += 3; stats[h].pg++; stats[a].pp++; }
    else if (rh === ra) { stats[h].pts += 1; stats[a].pts += 1; stats[h].pe++; stats[a].pe++; }
    else { stats[a].pts += 3; stats[a].pg++; stats[h].pp++; }
  });

  return Object.values(stats)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.nombre.localeCompare(b.nombre));
}

// ── Componente: tabla de un grupo ────────────────────────
const POS_COLORS = [
  { bg: "#003080", color: "#f5c200" },
  { bg: "#005aba", color: "white"   },
  { bg: "#f5c200", color: "#003080" },
  { bg: "#e0e0e0", color: "#757575" },
];

function TablaGrupo({ groupId, tabla }) {
  if (!tabla || tabla.length === 0) return null;
  const hayResultados = tabla.some((t) => t.pj > 0);

  return (
    <div style={{ background: "white", borderRadius: "10px", border: "1px solid var(--ch-border)", overflow: "hidden" }}>
      <div style={{ background: "#005aba", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          width: "22px", height: "22px", borderRadius: "4px",
          background: "rgba(245,194,0,0.2)", border: "1px solid rgba(245,194,0,0.5)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontFamily: "'Boldonse', cursive", color: "#f5c200",
        }}>
          {groupId}
        </span>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "800", fontSize: "13px", color: "white", textTransform: "uppercase" }}>
          Grupo {groupId}
        </span>
      </div>

      <div style={{ padding: "0 10px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "22px 1fr 32px 32px 32px 32px 32px 36px", gap: "4px", padding: "6px 0 4px", borderBottom: "1.5px solid #e8ecf5" }}>
          {["", "Equipo", "PJ", "PG", "PE", "PP", "GD", "Pts"].map((h, i) => (
            <span key={i} style={{ fontSize: "9px", fontWeight: "700", color: "#8097c0", textAlign: "center", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {tabla.map((t, idx) => {
          const col = POS_COLORS[idx] ?? POS_COLORS[3];
          return (
            <div key={t.nombre} style={{ display: "grid", gridTemplateColumns: "22px 1fr 32px 32px 32px 32px 32px 36px", gap: "4px", padding: "5px 0", borderBottom: idx < tabla.length - 1 ? "1px solid #f0f3fa" : "none", alignItems: "center" }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "3px", background: col.bg, color: col.color, fontSize: "9px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {idx + 1}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                <Flag nombre={t.nombre} bandera={t.bandera} />
                <span style={{ fontSize: "11px", fontWeight: "500", color: "#003080", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nombre}</span>
              </div>
              {[t.pj, t.pg, t.pe, t.pp, t.gd > 0 ? `+${t.gd}` : t.gd, t.pts].map((v, i) => (
                <span key={i} style={{ fontSize: i === 5 ? "13px" : "11px", fontWeight: i === 5 ? "700" : "400", textAlign: "center", color: i === 5 ? "#005aba" : "#5c7080" }}>{hayResultados ? v : (i === 5 ? 0 : "—")}</span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente: partidos de un grupo ─────────────────────
function PartidosGrupo({ groupId, resultados }) {
  const matches = WC2026_MATCHES.filter(
    (m) => m.grupo?.replace("Grupo ", "").trim() === groupId
  );

  return (
    <div style={{ background: "white", borderRadius: "10px", border: "1px solid var(--ch-border)", overflow: "hidden" }}>
      <div style={{ background: "#003080", padding: "8px 14px" }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "800", fontSize: "12px", color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>
          Partidos — Grupo {groupId}
        </span>
      </div>
      <div style={{ padding: "0 10px 8px" }}>
        {matches.map((m) => {
          const r = resultados[String(m.id)];
          const jugado = !!r;
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid #f0f3fa" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "11px", color: "#003080", fontWeight: "500", textAlign: "right" }}>{m.local?.nombre}</span>
                <Flag nombre={m.local?.nombre} bandera={m.local?.bandera} />
              </div>
              <div style={{
                minWidth: "58px", textAlign: "center",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700", fontSize: "15px",
                color: jugado ? "#003080" : "#b0bec5",
                background: jugado ? "#f0f4ff" : "#fafafa",
                borderRadius: "6px", padding: "3px 8px",
                border: `1.5px solid ${jugado ? "#d0d9ec" : "#e8ecf5"}`,
              }}>
                {jugado ? `${r.goles_local} – ${r.goles_vis}` : "vs"}
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                <Flag nombre={m.visitante?.nombre} bandera={m.visitante?.bandera} />
                <span style={{ fontSize: "11px", color: "#003080", fontWeight: "500" }}>{m.visitante?.nombre}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mensaje "Pendiente" para fases sin bracket ─────────────
function PendienteMsg() {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", background: "#f8f9fd", borderRadius: "14px", border: "1.5px dashed #c5d5f0" }}>
      <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "15px", color: "#003080", marginBottom: "8px" }}>
        Pendiente de clasificaciones
      </div>
      <div style={{ fontSize: "12px", color: "#8097c0", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
        Esta fase se actualizará cuando el administrador cargue los equipos clasificados.
      </div>
    </div>
  );
}

// ── Tarjeta de partido eliminatorio ──────────────────────
function PartidoElimCard({ match, teamA, teamB, resultado }) {
  const jugado = !!resultado;
  const showA  = teamA || match.a;
  const showB  = teamB || match.b;

  return (
    <div style={{
      background: "white", borderRadius: "10px",
      border: "1px solid var(--ch-border)", overflow: "hidden",
      boxShadow: "0 1px 8px rgba(0,48,128,0.07)",
    }}>
      {/* Header */}
      <div style={{
        background: "#003080", padding: "6px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px",
          fontWeight: "700", color: "rgba(255,255,255,0.65)",
          letterSpacing: "0.5px", textTransform: "uppercase",
        }}>
          {match.label || match.id}
        </span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif" }}>
          {match.fecha}{match.estadio ? ` · ${match.estadio}` : ""}
        </span>
      </div>

      {/* Equipos + marcador */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px" }}>
        {/* Equipo A */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", minWidth: 0 }}>
          <span style={{ fontSize: "11px", fontWeight: teamA ? "700" : "500", color: teamA ? "#003080" : "#8097c0", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {showA}
          </span>
          {teamA
            ? <Flag nombre={teamA} bandera="" />
            : <div style={{ width: "20px", height: "14px", borderRadius: "2px", background: "#e8ecf5", flexShrink: 0 }} />
          }
        </div>

        {/* Marcador */}
        <div style={{
          minWidth: "58px", textAlign: "center", flexShrink: 0,
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700", fontSize: "15px",
          color: jugado ? "#003080" : "#b0bec5",
          background: jugado ? "#f0f4ff" : "#fafafa",
          borderRadius: "6px", padding: "3px 8px",
          border: `1.5px solid ${jugado ? "#d0d9ec" : "#e8ecf5"}`,
        }}>
          {jugado ? `${resultado.goles_local} – ${resultado.goles_vis}` : "vs"}
        </div>

        {/* Equipo B */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-start", minWidth: 0 }}>
          {teamB
            ? <Flag nombre={teamB} bandera="" />
            : <div style={{ width: "20px", height: "14px", borderRadius: "2px", background: "#e8ecf5", flexShrink: 0 }} />
          }
          <span style={{ fontSize: "11px", fontWeight: teamB ? "700" : "500", color: teamB ? "#003080" : "#8097c0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {showB}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Vista de fase eliminatoria ────────────────────────────
function VistaFaseElim({ phase, bracket, resultados }) {
  const fixtures = RONDA_FIXTURES[phase] ?? [];

  // Si no hay bracket aún, mostrar pendiente
  const bracketEmpty = !bracket || Object.keys(bracket).length === 0;

  function getTeams(matchIndex) {
    if (bracketEmpty) return [null, null];
    if (phase === "r32") {
      const all = [...(bracket?.L?.r32 ?? []), ...(bracket?.R?.r32 ?? [])];
      return [all[matchIndex * 2] || null, all[matchIndex * 2 + 1] || null];
    }
    if (phase === "tp") {
      // Para 3er puesto usamos las posiciones de semifinal perdedores
      const all = [...(bracket?.L?.sf ?? []), ...(bracket?.R?.sf ?? [])];
      return [all[matchIndex * 2] || null, all[matchIndex * 2 + 1] || null];
    }
    if (phase === "f") {
      const all = [...(bracket?.L?.f ?? []), ...(bracket?.R?.f ?? [])];
      if (all.length) return [all[0] || null, all[1] || null];
      // fallback: ganadores de semis
      const sf = [...(bracket?.L?.sf ?? []), ...(bracket?.R?.sf ?? [])];
      return [sf[0] || null, sf[1] || null];
    }
    const lSlots = bracket?.L?.[phase] ?? [];
    const rSlots = bracket?.R?.[phase] ?? [];
    const all = [...lSlots, ...rSlots];
    return [all[matchIndex * 2] || null, all[matchIndex * 2 + 1] || null];
  }

  // Para fases finales, si bracket está vacío, mostrar pendiente
  if (bracketEmpty && (phase === "r16" || phase === "qf" || phase === "sf" || phase === "tp" || phase === "f")) {
    return <PendienteMsg />;
  }

  const cols =
    phase === "r32" || phase === "r16"
      ? "repeat(auto-fill, minmax(290px, 1fr))"
      : phase === "qf"
      ? "repeat(auto-fill, minmax(290px, 1fr))"
      : "repeat(auto-fill, minmax(290px, 1fr))";

  // Ganador / campeón
  const campeon  = bracket?.campeon  ?? null;
  const tercero  = bracket?.tercero  ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: "12px" }}>
        {fixtures.map((m, i) => {
          const [teamA, teamB] = getTeams(i);
          return (
            <PartidoElimCard
              key={m.id}
              match={m}
              teamA={teamA}
              teamB={teamB}
              resultado={resultados[m.id] ?? null}
            />
          );
        })}
      </div>

      {/* Resultado oficial del 3er puesto */}
      {phase === "tp" && tercero && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "linear-gradient(135deg,#fff8e1,#fffde7)",
          border: "1.5px solid #f5c200", borderRadius: "12px",
          padding: "14px 20px", maxWidth: "340px", margin: "0 auto",
        }}>
          <span style={{ fontSize: "22px" }}>🥉</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "900", fontSize: "10px", color: "#7a5200", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
              3er Puesto
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <Flag nombre={tercero} bandera="" />
              <span style={{ fontFamily: "'Boldonse', cursive", fontSize: "15px", color: "#003080" }}>{tercero}</span>
            </div>
          </div>
        </div>
      )}

      {/* Campeón */}
      {phase === "f" && campeon && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "linear-gradient(135deg,#fff8e1,#fffde7)",
          border: "2px solid #f5c200", borderRadius: "14px",
          padding: "16px 24px", maxWidth: "340px", margin: "0 auto",
          boxShadow: "0 4px 16px rgba(245,194,0,0.25)",
        }}>
          <span style={{ fontSize: "28px" }}>🏆</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "900", fontSize: "10px", color: "#7a5200", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
              Campeón del Mundo
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <Flag nombre={campeon} bandera="" />
              <span style={{ fontFamily: "'Boldonse', cursive", fontSize: "16px", color: "#003080" }}>{campeon}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────
export default function ResultadosGruposPage() {
  const [resultados, setResultados]   = useState({});
  const [bracket, setBracket]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activePhase, setActivePhase] = useState("grupos");
  const [activeGroup, setActiveGroup] = useState(GROUP_IDS[0]);

  useEffect(() => {
    Promise.all([
      adminApi.obtenerResultados().then((d) => d.resultados ?? {}),
      adminApi.obtenerBracket().then((d) => d.bracket ?? {}),
    ])
      .then(([res, brk]) => {
        setResultados(res);
        setBracket(brk);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tabla = useMemo(
    () => calcularTablaGrupo(activeGroup, resultados),
    [activeGroup, resultados]
  );

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
        <div style={{ width: "5px", height: "42px", background: "linear-gradient(180deg,#f5c200,#005aba)", borderRadius: "3px" }} />
        <div>
          <h1 style={{ fontFamily: "'Boldonse', cursive", fontSize: "26px", color: "#003080", margin: 0, textTransform: "uppercase" }}>
            Resultados
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#8097c0", fontFamily: "'Inter', sans-serif" }}>
            FIFA World Cup 2026 · Resultados Oficiales
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#8097c0" }}>Cargando resultados…</div>
      ) : (
        <>
          {/* ── Selector de fase ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "24px" }}>
            {SECCIONES.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setActivePhase(key)}
                style={{
                  padding: "7px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700", fontSize: "13px",
                  background: activePhase === key ? "#005aba" : "#f0f4ff",
                  color: activePhase === key ? "white" : "#005aba",
                  transition: "all 0.12s",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── FASE DE GRUPOS ── */}
          {activePhase === "grupos" && (
            <>
              {/* Selector de grupo A–L */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                {GROUP_IDS.map((id) => (
                  <button key={id} type="button" onClick={() => setActiveGroup(id)}
                    style={{
                      padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700", fontSize: "13px",
                      background: activeGroup === id ? "#003080" : "#f0f4ff",
                      color: activeGroup === id ? "#f5c200" : "#003080",
                      transition: "all 0.12s",
                    }}>
                    Grupo {id}
                  </button>
                ))}
              </div>

              {/* Grid: tabla + partidos */}
              <div className="resultados-grid">
                <TablaGrupo groupId={activeGroup} tabla={tabla} />
                <PartidosGrupo groupId={activeGroup} resultados={resultados} />
              </div>

              {/* Leyenda */}
              <div style={{ display: "flex", gap: "16px", marginTop: "20px", flexWrap: "wrap" }}>
                {[["#003080","1° Clasificado"], ["#005aba","2° Clasificado"], ["#f5c200","Candidato Mejor 3°"], ["#e0e0e0","Eliminado"]].map(([bg, label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "3px", background: bg }} />
                    <span style={{ fontSize: "11px", color: "#8097c0", fontFamily: "'Inter', sans-serif" }}>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── FASES ELIMINATORIAS ── */}
          {activePhase !== "grupos" && (
            <VistaFaseElim
              phase={activePhase}
              bracket={bracket}
              resultados={resultados}
            />
          )}
        </>
      )}
    </div>
  );
}
