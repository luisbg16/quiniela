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
  { bg: "#003080", color: "#f5c200" },  // 1°
  { bg: "#005aba", color: "white" },    // 2°
  { bg: "#f5c200", color: "#003080" },  // 3° (mejor tercero)
  { bg: "#e0e0e0", color: "#757575" },  // 4°
];

function TablaGrupo({ groupId, tabla }) {
  if (!tabla || tabla.length === 0) return null;
  const hayResultados = tabla.some((t) => t.pj > 0);

  return (
    <div style={{ background: "white", borderRadius: "10px", border: "1px solid var(--ch-border)", overflow: "hidden" }}>
      {/* Header */}
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

      {/* Tabla */}
      <div style={{ padding: "0 10px 8px" }}>
        {/* Cabecera */}
        <div style={{ display: "grid", gridTemplateColumns: "22px 1fr 32px 32px 32px 32px 32px 36px", gap: "4px", padding: "6px 0 4px", borderBottom: "1.5px solid #e8ecf5" }}>
          {["", "Equipo", "PJ", "PG", "PE", "PP", "GD", "Pts"].map((h, i) => (
            <span key={i} style={{ fontSize: "9px", fontWeight: "700", color: "#8097c0", textAlign: "center", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {/* Filas */}
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

// ── Componente principal ─────────────────────────────────
export default function ResultadosGruposPage() {
  const [resultados, setResultados] = useState({});
  const [loading, setLoading]       = useState(true);
  const [activeGroup, setActiveGroup] = useState(GROUP_IDS[0]);

  useEffect(() => {
    adminApi.obtenerResultados()
      .then((d) => setResultados(d.resultados ?? {}))
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
            Resultados de Grupos
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#8097c0", fontFamily: "'Inter', sans-serif" }}>
            FIFA World Cup 2026 · Fase de Grupos
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#8097c0" }}>Cargando resultados…</div>
      ) : (
        <>
          {/* Selector de grupo */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "24px" }}>
            {GROUP_IDS.map((id) => (
              <button key={id} type="button" onClick={() => setActiveGroup(id)}
                style={{
                  padding: "7px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700", fontSize: "13px",
                  background: activeGroup === id ? "#005aba" : "#f0f4ff",
                  color: activeGroup === id ? "white" : "#005aba",
                  transition: "all 0.12s",
                }}>
                Grupo {id}
              </button>
            ))}
          </div>

          {/* Grid: tabla + partidos — 2 cols en desktop, 1 col en móvil */}
          <div className="resultados-grid">
            <TablaGrupo groupId={activeGroup} tabla={tabla} />
            <PartidosGrupo groupId={activeGroup} resultados={resultados} />
          </div>

          {/* Referencia de colores */}
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
    </div>
  );
}
