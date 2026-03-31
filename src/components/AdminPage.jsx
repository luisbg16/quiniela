import { useState, useEffect, useCallback } from "react";
import { admin as adminApi } from "../services/api.js";
import { WC2026_MATCHES } from "../data/wc2026matches.js";
import { GROUPS_DATA, GROUP_IDS } from "../data/groups.js";

// ══════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════

function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number" min="0" max="99"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      disabled={disabled}
      style={{
        width: "44px", height: "34px", textAlign: "center",
        fontSize: "16px", fontWeight: "700",
        border: "2px solid #d0d9ec", borderRadius: "6px",
        fontFamily: "'Barlow Condensed', sans-serif",
        color: "#003080", outline: "none",
      }}
    />
  );
}

function StatusBadge({ saved }) {
  if (!saved) return null;
  return (
    <span style={{
      fontSize: "10px", color: "#2e7d32", fontWeight: "700",
      background: "#e8f5e9", borderRadius: "4px", padding: "2px 6px",
    }}>✓ Guardado</span>
  );
}

// ══════════════════════════════════════════════════════════
// SECCIÓN: RESULTADOS DE GRUPOS
// ══════════════════════════════════════════════════════════

function SeccionResultadosGrupos({ resultadosOficiales, onSave }) {
  const [local, setLocal] = useState({});     // { [matchId]: { h, a } }
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");

  // Inicializar desde los resultados ya guardados
  useEffect(() => {
    const init = {};
    Object.entries(resultadosOficiales).forEach(([id, r]) => {
      init[id] = { h: r.goles_local, a: r.goles_vis };
    });
    setLocal(init);
    setSaved(Object.fromEntries(Object.keys(resultadosOficiales).map((id) => [id, true])));
  }, [resultadosOficiales]);

  const handleChange = (matchId, side, val) => {
    setLocal((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [side]: val } }));
    setSaved((prev) => ({ ...prev, [matchId]: false }));
  };

  const handleSave = async (match) => {
    const id = String(match.id);
    const { h, a } = local[id] ?? {};
    if (h == null || a == null) { setError("Ingresá ambos goles"); return; }
    setError("");
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await adminApi.guardarResultado({ partidoId: id, golesLocal: h, golesVis: a, fase: "grupos" });
      setSaved((prev) => ({ ...prev, [id]: true }));
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div>
      <h3 style={styles.sectionTitle}>Resultados — Fase de Grupos</h3>
      {error && <p style={styles.errorMsg}>{error}</p>}

      {GROUP_IDS.map((groupId) => {
        const matches = WC2026_MATCHES.filter(
          (m) => m.grupo?.replace("Grupo ", "").trim() === groupId
        );
        if (matches.length === 0) return null;
        return (
          <div key={groupId} style={{ marginBottom: "24px" }}>
            <div style={styles.groupHeader}>Grupo {groupId}</div>
            {matches.map((m) => {
              const id = String(m.id);
              const row = local[id] ?? { h: null, a: null };
              return (
                <div key={id} style={styles.matchRow}>
                  <span style={styles.teamName}>{m.local?.nombre}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ScoreInput value={row.h} onChange={(v) => handleChange(id, "h", v)} disabled={loading[id]} />
                    <span style={{ fontWeight: "900", color: "#8097c0" }}>–</span>
                    <ScoreInput value={row.a} onChange={(v) => handleChange(id, "a", v)} disabled={loading[id]} />
                  </div>
                  <span style={styles.teamName}>{m.visitante?.nombre}</span>
                  <button
                    type="button"
                    onClick={() => handleSave(m)}
                    disabled={loading[id]}
                    style={styles.saveBtn}
                  >
                    {loading[id] ? "..." : "Guardar"}
                  </button>
                  <StatusBadge saved={saved[id]} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SECCIÓN: BRACKET OFICIAL (equipos clasificados)
// ══════════════════════════════════════════════════════════

function TeamSelect({ value, onChange, allTeams }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        padding: "4px 8px", borderRadius: "6px",
        border: "1.5px solid #d0d9ec", fontSize: "12px",
        fontFamily: "'Inter', sans-serif", color: "#003080",
        minWidth: "150px", width: "100%",
      }}
    >
      <option value="">— Por definir —</option>
      {allTeams.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}

// Todos los equipos del torneo (para los selects)
const ALL_TEAMS = Object.values(GROUPS_DATA)
  .flatMap((g) => g.teams.map((t) => t.nombre))
  .filter(Boolean)
  .sort();

// Mapa Grupo → equipos (para filtrar selects en 16avos)
const TEAMS_BY_GROUP = Object.fromEntries(
  Object.entries(GROUPS_DATA).map(([key, g]) => [
    key,
    g.teams.map((t) => t.nombre).filter(Boolean),
  ])
);

/**
 * Dado un label como "1° Grupo A", "2° Grupo C", "3° mejor A·B·C·D·F", etc.
 * devuelve la lista de equipos válidos.
 * - "N° Grupo X"  → solo equipos del Grupo X
 * - "3° mejor …"  → todos los equipos (cualquier tercero puede calificar)
 * - "WXX" / otro  → todos los equipos
 */
function teamsForLabel(label) {
  if (!label) return ALL_TEAMS;
  // Detectar "X° Grupo Y"
  const m = label.match(/Grupo\s+([A-L])\b/i);
  if (m) {
    const letra = m[1].toUpperCase();
    return TEAMS_BY_GROUP[letra] ?? ALL_TEAMS;
  }
  // "3° mejor …" o cualquier W+número → todos
  return ALL_TEAMS;
}

// Tabs internas del bracket
const BRACKET_ADMIN_TABS = [
  { key: "r32", label: "16avos de Final"  },
  { key: "r16", label: "Octavos de Final" },
  { key: "qf",  label: "Cuartos de Final" },
  { key: "sf",  label: "Semifinales"      },
  { key: "tp",  label: "3er Puesto"       },
  { key: "f",   label: "Gran Final"       },
];

// Pares de partidos por ronda — con índices de slot para L/R
const ADMIN_PAIRS = {
  r32: {
    L: [
      { mid: "M73", sA: 0, sB: 1, lA: "2° Grupo A",           lB: "2° Grupo B",           fecha: "Dom 28 jun", estadio: "Los Ángeles" },
      { mid: "M74", sA: 2, sB: 3, lA: "1° Grupo C",           lB: "2° Grupo F",           fecha: "Lun 29 jun", estadio: "Houston" },
      { mid: "M75", sA: 4, sB: 5, lA: "1° Grupo E",           lB: "3° mejor A·B·C·D·F",   fecha: "Lun 29 jun", estadio: "Boston" },
      { mid: "M76", sA: 6, sB: 7, lA: "1° Grupo F",           lB: "2° Grupo C",           fecha: "Lun 29 jun", estadio: "Monterrey" },
    ],
    R: [
      { mid: "M77", sA: 0, sB: 1, lA: "2° Grupo E",           lB: "2° Grupo I",           fecha: "Mar 30 jun", estadio: "Dallas" },
      { mid: "M78", sA: 2, sB: 3, lA: "1° Grupo I",           lB: "3° mejor C·D·F·G·H",   fecha: "Mar 30 jun", estadio: "Nueva York" },
      { mid: "M79", sA: 4, sB: 5, lA: "1° Grupo A",           lB: "3° mejor C·E·F·H·I",   fecha: "Mar 30 jun", estadio: "Ciudad de México" },
      { mid: "M80", sA: 6, sB: 7, lA: "1° Grupo L",           lB: "3° mejor E·H·J·K",     fecha: "Mié 1 jul",  estadio: "Atlanta" },
    ],
    noteL: "M81–M84 (Grupos G–L) se completan en la siguiente fase.",
    noteR: "M85–M88 (Grupos G–L) se completan en la siguiente fase.",
  },
  r16: {
    L: [
      { mid: "M89", sA: 0, sB: 1, lA: "W73", lB: "W75", fecha: "Sáb 4 jul", estadio: "Houston" },
      { mid: "M90", sA: 2, sB: 3, lA: "W74", lB: "W77", fecha: "Sáb 4 jul", estadio: "Filadelfia" },
    ],
    R: [
      { mid: "M91", sA: 0, sB: 1, lA: "W76", lB: "W78", fecha: "Dom 5 jul", estadio: "Nueva York" },
      { mid: "M92", sA: 2, sB: 3, lA: "W79", lB: "W80", fecha: "Dom 5 jul", estadio: "Ciudad de México" },
    ],
    note: "M93–M96 (Dom–Mar 6–7 jul) se completan en la siguiente fase.",
  },
  qf: {
    L: [{ mid: "M97", sA: 0, sB: 1, lA: "W89", lB: "W90", fecha: "Jue 9 jul",  estadio: "Boston" }],
    R: [{ mid: "M98", sA: 0, sB: 1, lA: "W93", lB: "W94", fecha: "Vie 10 jul", estadio: "Los Ángeles" }],
    note: "M99–M100 (Sáb 11 jul) se completan en la siguiente fase.",
  },
};

// Tarjeta de partido admin con header de metadata
function AdminMatchCard({ pair, valA, valB, onChangeA, onChangeB }) {
  const teamsA = teamsForLabel(pair.lA);
  const teamsB = teamsForLabel(pair.lB);
  return (
    <div style={{
      background: "white", border: "1px solid #dce7f7",
      borderRadius: "10px", overflow: "hidden", marginBottom: "10px",
    }}>
      {/* Header */}
      <div style={{
        background: "#eef2fa", borderBottom: "1px solid #dce7f7",
        padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{
          fontSize: "9px", fontWeight: "700", color: "#8097c0",
          textTransform: "uppercase", letterSpacing: "1.2px",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>{pair.mid}</span>
        <span style={{ fontSize: "9px", color: "#a8b8d8", fontFamily: "'Inter', sans-serif" }}>
          {pair.fecha} · {pair.estadio}
        </span>
      </div>
      {/* Slots */}
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "flex-end", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "130px" }}>
          <div style={{ fontSize: "9px", color: "#8097c0", marginBottom: "3px", fontFamily: "'Inter', sans-serif" }}>{pair.lA}</div>
          <TeamSelect value={valA} onChange={onChangeA} allTeams={teamsA} />
        </div>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "900",
          color: "#c5d5f0", fontSize: "11px", paddingBottom: "4px",
        }}>VS</span>
        <div style={{ flex: 1, minWidth: "130px" }}>
          <div style={{ fontSize: "9px", color: "#8097c0", marginBottom: "3px", fontFamily: "'Inter', sans-serif" }}>{pair.lB}</div>
          <TeamSelect value={valB} onChange={onChangeB} allTeams={teamsB} />
        </div>
      </div>
    </div>
  );
}

function SeccionBracketOficial({ bracketOficial, onSave }) {
  const [datos, setDatos] = useState(() => ({
    L: { r32: Array(8).fill(null), r16: Array(4).fill(null), qf: Array(2).fill(null), sf: Array(1).fill(null), f: Array(1).fill(null) },
    R: { r32: Array(8).fill(null), r16: Array(4).fill(null), qf: Array(2).fill(null), sf: Array(1).fill(null), f: Array(1).fill(null) },
    campeon: null,
    tercero: null,
  }));
  const [bracketTab, setBracketTab] = useState("r32");
  const [saving, setSaving]   = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (bracketOficial && Object.keys(bracketOficial).length > 0) {
      setDatos((prev) => ({ ...prev, ...bracketOficial }));
    }
  }, [bracketOficial]);

  const setSlot = (side, round, idx, val) => {
    setDatos((prev) => ({
      ...prev,
      [side]: { ...prev[side], [round]: prev[side][round].map((v, i) => (i === idx ? val : v)) },
    }));
    setSavedOk(false);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSavedOk(false);
    try {
      await adminApi.guardarBracket(datos);
      setSavedOk(true);
      onSave(datos);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Renderiza las tarjetas de pares para r32 / r16 / qf
  const renderPairs = (rKey) => {
    const { L, R, note, noteL, noteR } = ADMIN_PAIRS[rKey];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Lado izquierdo */}
        <div>
          <div style={styles.groupHeader}>Lado Izquierdo — Grupos A–F</div>
          {L.map((pair) => (
            <AdminMatchCard
              key={pair.mid} pair={pair}
              valA={datos.L?.[rKey]?.[pair.sA]}
              valB={datos.L?.[rKey]?.[pair.sB]}
              onChangeA={(v) => setSlot("L", rKey, pair.sA, v)}
              onChangeB={(v) => setSlot("L", rKey, pair.sB, v)}
            />
          ))}
          {noteL && <p style={{ fontSize: "10px", color: "#a8b8d8", marginTop: "6px" }}>{noteL}</p>}
        </div>
        {/* Lado derecho */}
        <div>
          <div style={styles.groupHeader}>Lado Derecho — Grupos G–L</div>
          {R.map((pair) => (
            <AdminMatchCard
              key={pair.mid} pair={pair}
              valA={datos.R?.[rKey]?.[pair.sA]}
              valB={datos.R?.[rKey]?.[pair.sB]}
              onChangeA={(v) => setSlot("R", rKey, pair.sA, v)}
              onChangeB={(v) => setSlot("R", rKey, pair.sB, v)}
            />
          ))}
          {noteR && <p style={{ fontSize: "10px", color: "#a8b8d8", marginTop: "6px" }}>{noteR}</p>}
        </div>
        {note && (
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontSize: "10px", color: "#a8b8d8", margin: 0 }}>{note}</p>
          </div>
        )}
      </div>
    );
  };

  // Render de un slot individual con label y select
  const renderSlot = (side, round, idx, label) => (
    <div key={`${side}-${round}-${idx}`} style={{ flex: 1, minWidth: "160px" }}>
      <div style={{ fontSize: "9px", color: "#8097c0", marginBottom: "4px", fontFamily: "'Inter', sans-serif" }}>{label}</div>
      <TeamSelect
        value={datos[side]?.[round]?.[idx]}
        onChange={(v) => setSlot(side, round, idx, v)}
        allTeams={ALL_TEAMS}
      />
    </div>
  );

  const renderTabContent = () => {
    // 16avos, Octavos, Cuartos: usar ADMIN_PAIRS
    if (["r32", "r16", "qf"].includes(bracketTab)) return renderPairs(bracketTab);

    // Semifinales: M101 (L.sf[0] vs R.sf[0]) + M102 pendiente
    if (bracketTab === "sf") return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div>
          <div style={styles.groupHeader}>Semifinal 1</div>
          <AdminMatchCard
            pair={{ mid: "M101", lA: "W97", lB: "W98", fecha: "Mar 14 jul", estadio: "Dallas" }}
            valA={datos.L?.sf?.[0]} valB={datos.R?.sf?.[0]}
            onChangeA={(v) => setSlot("L", "sf", 0, v)}
            onChangeB={(v) => setSlot("R", "sf", 0, v)}
          />
        </div>
        <div>
          <div style={styles.groupHeader}>Semifinal 2</div>
          <AdminMatchCard
            pair={{ mid: "M102", lA: "W99", lB: "W100", fecha: "Mié 15 jul", estadio: "Nueva York" }}
            valA={datos.L?.f?.[0]} valB={datos.R?.f?.[0]}
            onChangeA={(v) => setSlot("L", "f", 0, v)}
            onChangeB={(v) => setSlot("R", "f", 0, v)}
          />
        </div>
      </div>
    );

    // 3er Puesto: M103 + tercero
    if (bracketTab === "tp") return (
      <div style={{ maxWidth: "420px" }}>
        <div style={styles.groupHeader}>Tercer Puesto — M103</div>
        <div style={{
          background: "white", border: "1px solid #dce7f7", borderRadius: "10px",
          overflow: "hidden", marginBottom: "16px",
        }}>
          <div style={{ background: "#eef2fa", borderBottom: "1px solid #dce7f7", padding: "6px 12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "9px", fontWeight: "700", color: "#8097c0", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'Barlow Condensed', sans-serif" }}>M103</span>
            <span style={{ fontSize: "9px", color: "#a8b8d8", fontFamily: "'Inter', sans-serif" }}>Sáb 18 jul · Miami</span>
          </div>
          <div style={{ padding: "10px 12px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {renderSlot("L", "sf", 0, "RU101 — Perdedor Semi 1")}
            {renderSlot("R", "sf", 0, "RU102 — Perdedor Semi 2")}
          </div>
        </div>
        <div style={{ marginTop: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#005aba", textTransform: "uppercase", marginBottom: "6px" }}>Ganador — 3er Puesto</div>
          <TeamSelect value={datos.tercero} onChange={(v) => { setDatos((p) => ({ ...p, tercero: v })); setSavedOk(false); }} allTeams={ALL_TEAMS} />
        </div>
      </div>
    );

    // Gran Final: M104 + campeón
    if (bracketTab === "f") return (
      <div style={{ maxWidth: "420px" }}>
        <div style={styles.groupHeader}>Gran Final — M104</div>
        <div style={{
          background: "white", border: "1px solid #dce7f7", borderRadius: "10px",
          overflow: "hidden", marginBottom: "16px",
        }}>
          <div style={{ background: "#eef2fa", borderBottom: "1px solid #dce7f7", padding: "6px 12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "9px", fontWeight: "700", color: "#8097c0", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'Barlow Condensed', sans-serif" }}>M104</span>
            <span style={{ fontSize: "9px", color: "#a8b8d8", fontFamily: "'Inter', sans-serif" }}>Dom 19 jul · Nueva York</span>
          </div>
          <div style={{ padding: "10px 12px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {renderSlot("L", "f", 0, "W101 — Ganador Semi 1")}
            {renderSlot("R", "f", 0, "W102 — Ganador Semi 2")}
          </div>
        </div>
        <div style={{ marginTop: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#f5c200", textTransform: "uppercase", marginBottom: "6px" }}>Campeón Mundial</div>
          <TeamSelect value={datos.campeon} onChange={(v) => { setDatos((p) => ({ ...p, campeon: v })); setSavedOk(false); }} allTeams={ALL_TEAMS} />
        </div>
      </div>
    );

    return null;
  };

  return (
    <div>
      <h3 style={styles.sectionTitle}>Bracket Oficial — Equipos Clasificados</h3>
      <p style={{ fontSize: "12px", color: "#8097c0", marginBottom: "20px" }}>
        Completá los equipos que juegan cada ronda conforme vayan clasificando. Esto actualiza el fixture visible para todos.
      </p>
      {error && <p style={styles.errorMsg}>{error}</p>}

      {/* Tabs internas del bracket */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "20px", borderBottom: "2px solid #e8ecf5", flexWrap: "wrap" }}>
        {BRACKET_ADMIN_TABS.map(({ key, label }) => {
          const isActive = bracketTab === key;
          return (
            <button
              key={key} type="button" onClick={() => setBracketTab(key)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "8px 14px",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: isActive ? "700" : "400",
                fontSize: "13px", letterSpacing: "0.3px",
                color: isActive ? "#005aba" : "#8097c0",
                borderBottom: `3px solid ${isActive ? "#005aba" : "transparent"}`,
                marginBottom: "-2px",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Contenido de la tab activa */}
      {renderTabContent()}

      {/* Guardar */}
      <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={handleSave} disabled={saving}
          style={{ ...styles.saveBtn, padding: "10px 24px", fontSize: "13px" }}>
          {saving ? "Guardando..." : "Guardar Bracket Oficial"}
        </button>
        {savedOk && <span style={{ fontSize: "12px", color: "#2e7d32", fontWeight: "700" }}>Bracket guardado correctamente</span>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SECCIÓN: USUARIOS
// ══════════════════════════════════════════════════════════

const PAGE_SIZE = 20;

function Paginador({ page, total, pageSize, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  // insertar "..." donde haya saltos
  const withEllipsis = nums.reduce((acc, p, i) => {
    if (i > 0 && p - nums[i - 1] > 1) acc.push("...");
    acc.push(p);
    return acc;
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "14px", justifyContent: "center", flexWrap: "wrap" }}>
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} style={styles.pageBtn}>‹</button>
      {withEllipsis.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} style={{ fontSize: "11px", color: "#8097c0", padding: "0 2px" }}>…</span>
        ) : (
          <button key={p} type="button" onClick={() => onPage(p)}
            style={{ ...styles.pageBtn, background: p === page ? "#005aba" : "white", color: p === page ? "white" : "#005aba", fontWeight: p === page ? "700" : "400" }}>
            {p}
          </button>
        )
      )}
      <button type="button" onClick={() => onPage(page + 1)} disabled={page === totalPages} style={styles.pageBtn}>›</button>
      <span style={{ fontSize: "11px", color: "#8097c0", marginLeft: "8px" }}>{total} registros</span>
    </div>
  );
}

function SeccionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState({});
  const [page, setPage]         = useState(1);

  const cargar = useCallback(async () => {
    try {
      const data = await adminApi.obtenerUsuarios();
      setUsuarios(data.usuarios ?? []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleAfiliado = async (u) => {
    setToggling((prev) => ({ ...prev, [u.id]: true }));
    try {
      await adminApi.setAfiliado({ usuarioId: u.id, esAfiliado: !u.es_afiliado });
      setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, es_afiliado: !u.es_afiliado } : x));
    } catch { /* silencioso */ }
    finally { setToggling((prev) => ({ ...prev, [u.id]: false })); }
  };

  if (loading) return <p style={{ color: "#8097c0", fontSize: "13px" }}>Cargando usuarios…</p>;

  const start   = (page - 1) * PAGE_SIZE;
  const visible = usuarios.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <h3 style={styles.sectionTitle}>Usuarios Registrados ({usuarios.length})</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#f0f4ff" }}>
              {["#", "Nombre", "Email", "N° Afiliado", "Afiliado", "Admin", "Puntos", "Registro"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f0f3fa" }}>
                <td style={{ ...styles.td, color: "#8097c0", fontWeight: "700", minWidth: "32px" }}>{start + i + 1}</td>
                <td style={styles.td}>{u.nombre} {u.apellido}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{u.numero_asociado || "—"}</td>
                <td style={styles.td}>
                  <button
                    type="button"
                    onClick={() => toggleAfiliado(u)}
                    disabled={toggling[u.id]}
                    style={{
                      padding: "3px 10px", borderRadius: "12px", border: "none", cursor: "pointer",
                      fontSize: "11px", fontWeight: "700",
                      background: u.es_afiliado ? "#e8f5e9" : "#f5f5f5",
                      color: u.es_afiliado ? "#2e7d32" : "#757575",
                    }}
                  >
                    {u.es_afiliado ? "✓ Afiliado" : "No afiliado"}
                  </button>
                </td>
                <td style={styles.td}>{u.es_admin ? "✓" : "—"}</td>
                <td style={{ ...styles.td, fontWeight: "700", color: "#005aba" }}>{u.puntaje ?? 0}</td>
                <td style={styles.td}>{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString("es-HN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginador page={page} total={usuarios.length} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════

const TABS = [
  { key: "resultados", label: "Resultados" },
  { key: "bracket",    label: "Bracket"    },
  { key: "usuarios",   label: "Usuarios"   },
];

export default function AdminPage({ onBack }) {
  const [tab, setTab] = useState("resultados");
  const [resultadosOficiales, setResultadosOficiales] = useState({});
  const [bracketOficial, setBracketOficial] = useState({});
  const [calculando, setCalculando] = useState(false);
  const [calcMsg, setCalcMsg] = useState(null);

  // Cargar datos al montar
  useEffect(() => {
    adminApi.obtenerResultados()
      .then((d) => setResultadosOficiales(d.resultados ?? {}))
      .catch(() => {});
    adminApi.obtenerBracket()
      .then((d) => setBracketOficial(d.bracket ?? {}))
      .catch(() => {});
  }, []);

  const handleCalcularPuntos = async () => {
    setCalculando(true); setCalcMsg("");
    try {
      const r = await adminApi.calcularPuntos();
      setCalcMsg({ ok: true, text: r.mensaje });
    } catch (e) {
      setCalcMsg({ ok: false, text: e.message });
    } finally {
      setCalculando(false);
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <button type="button" onClick={onBack} style={styles.backBtn}>← Volver</button>
        <div>
          <h1 style={{ fontFamily: "'Boldonse', cursive", fontSize: "26px", color: "#003080", margin: 0, textTransform: "uppercase" }}>
            Panel Administrador
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#8097c0", fontFamily: "'Inter', sans-serif" }}>
            Cargá resultados, actualizá el bracket y calculá puntos
          </p>
        </div>
      </div>

      {/* Botón calcular puntos */}
      <div style={{ background: "#fff8e1", border: "1.5px solid #f5c200", borderRadius: "10px", padding: "14px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: "700", fontSize: "13px", color: "#003080" }}>Calcular Puntos</div>
          <div style={{ fontSize: "11px", color: "#8097c0" }}>Recalcula los puntos de todas las quinielas con los resultados actuales</div>
        </div>
        <button type="button" onClick={handleCalcularPuntos} disabled={calculando}
          style={{ ...styles.saveBtn, padding: "10px 20px", background: "#005aba", color: "white", marginLeft: "auto" }}>
          {calculando ? "Calculando…" : "Calcular ahora"}
        </button>
        {calcMsg && <span style={{ fontSize: "12px", fontWeight: "600", color: calcMsg.ok ? "#2e7d32" : "#c62828" }}>{calcMsg.text}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "2px solid #e8ecf5" }}>
        {TABS.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 18px", fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: "700", fontSize: "14px", letterSpacing: "0.3px",
              color: tab === key ? "#005aba" : "#8097c0",
              borderBottom: `3px solid ${tab === key ? "#005aba" : "transparent"}`,
              marginBottom: "-2px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid var(--ch-border)", boxShadow: "0 2px 10px rgba(10,36,100,0.06)" }}>
        {tab === "resultados" && (
          <SeccionResultadosGrupos
            resultadosOficiales={resultadosOficiales}
            onSave={() => adminApi.obtenerResultados().then((d) => setResultadosOficiales(d.resultados ?? {})).catch(() => {})}
          />
        )}
        {tab === "bracket" && (
          <SeccionBracketOficial
            bracketOficial={bracketOficial}
            onSave={(d) => setBracketOficial(d)}
          />
        )}
        {tab === "usuarios" && <SeccionUsuarios />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ESTILOS COMPARTIDOS
// ══════════════════════════════════════════════════════════

const styles = {
  sectionTitle: {
    fontFamily: "'Boldonse', cursive", fontSize: "18px", color: "#003080",
    margin: "0 0 16px", textTransform: "uppercase",
  },
  groupHeader: {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px",
    fontWeight: "800", color: "white", background: "#005aba",
    padding: "5px 12px", borderRadius: "6px", marginBottom: "10px",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  matchRow: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "8px 10px", borderBottom: "1px solid #f0f3fa",
    flexWrap: "wrap",
  },
  teamName: {
    fontFamily: "'Inter', sans-serif", fontSize: "12px",
    fontWeight: "600", color: "#003080", minWidth: "120px",
    flex: 1,
  },
  saveBtn: {
    background: "#005aba", color: "white", border: "none",
    borderRadius: "7px", padding: "6px 14px", cursor: "pointer",
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700",
    fontSize: "12px", letterSpacing: "0.3px",
  },
  backBtn: {
    background: "none", border: "1.5px solid #d0d9ec", borderRadius: "8px",
    padding: "7px 14px", cursor: "pointer", fontSize: "12px",
    fontFamily: "'Inter', sans-serif", color: "#8097c0", fontWeight: "600",
  },
  errorMsg: {
    fontSize: "12px", color: "#c62828", background: "#fff3f3",
    borderRadius: "6px", padding: "8px 12px", marginBottom: "12px",
  },
  th: {
    textAlign: "left", padding: "8px 12px", fontSize: "11px",
    fontWeight: "700", color: "#005aba", textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "8px 12px", fontSize: "12px", color: "#003080",
    fontFamily: "'Inter', sans-serif",
  },
  pageBtn: {
    minWidth: "30px", height: "30px", padding: "0 8px",
    border: "1.5px solid #d0d9ec", borderRadius: "6px",
    background: "white", color: "#005aba", cursor: "pointer",
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px",
    fontWeight: "400",
  },
};
