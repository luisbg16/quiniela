import { useState } from "react";
import { GROUPS_DATA, GROUP_IDS, LEFT_BRACKET_GROUPS, RIGHT_BRACKET_GROUPS } from "../data/groups";
import { getFlagUrl } from "../data/flags.js";

// ══════════════════════════════════════════════════════════════
// HELPERS DE DATOS (sin cambios en la lógica)
// ══════════════════════════════════════════════════════════════

function buildR32Slots(bracketGroups, getSlotName, thirdTeams = []) {
  const g = bracketGroups;
  const s = (gId, posIdx) => ({
    name: getSlotName(gId, posIdx), group: gId, pos: posIdx, isBest3rd: false,
  });
  const b3 = (i) => ({
    name: thirdTeams[i] ?? null, group: null, pos: null, isBest3rd: true,
  });
  return [
    s(g[0], 0), s(g[1], 1),
    s(g[2], 0), s(g[3], 1),
    s(g[4], 0), s(g[5], 1),
    b3(0),      b3(1),
    s(g[1], 0), s(g[0], 1),
    s(g[3], 0), s(g[2], 1),
    s(g[5], 0), s(g[4], 1),
    b3(2),      b3(3),
  ];
}

function toMatches(slots) {
  const out = [];
  for (let i = 0; i < slots.length; i += 2) out.push({ slotA: slots[i], slotB: slots[i + 1] });
  return out;
}

function pickWinner(match, pick) {
  if (!match || pick === null || pick === undefined) return { name: null, group: null, isBest3rd: false };
  return pick === 0 ? match.slotA : match.slotB;
}

function pickLoser(match, pick) {
  if (!match || pick === null || pick === undefined) return { name: null, group: null, isBest3rd: false };
  return pick === 0 ? match.slotB : match.slotA;
}

function advance(matches, picks) {
  const out = [];
  for (let i = 0; i < matches.length; i += 2) {
    out.push({
      slotA: pickWinner(matches[i],     picks[i]),
      slotB: pickWinner(matches[i + 1], picks[i + 1]),
    });
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
// TABS DE RONDA
// ══════════════════════════════════════════════════════════════

const BRACKET_TABS = [
  { key: "r32", label: "16avos"     },
  { key: "r16", label: "Octavos"    },
  { key: "qf",  label: "Cuartos"   },
  { key: "sf",  label: "Semis"      },
  { key: "tp",  label: "3er Puesto" },
  { key: "f",   label: "Final"      },
];

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTES VISUALES
// ══════════════════════════════════════════════════════════════

function TeamFlag({ name }) {
  const url = name ? getFlagUrl(name, 20) : null;
  if (!url) return null;
  return (
    <img
      src={url} alt={name}
      style={{ width: "20px", height: "14px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
      onError={(e) => { e.target.style.display = "none"; }}
    />
  );
}

/** Botón de equipo dentro de una tarjeta de partido */
function TeamBtn({ slot, selected, onClick, isFinal = false, readOnly = false }) {
  const hasName = !!(slot?.name);
  const isPending = !hasName;

  const bg       = selected ? (isFinal ? "var(--ch-navy)" : "#eef4ff") : "white";
  const border   = selected ? (isFinal ? "#f5c200" : "var(--ch-blue)") : "var(--ch-border)";
  const textColor = selected
    ? (isFinal ? "#f5c200" : "var(--ch-navy)")
    : (isPending ? "#b0bec5" : "var(--ch-navy)");

  return (
    <button
      type="button"
      onClick={hasName && !readOnly ? onClick : undefined}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        width: "100%", padding: "10px 12px",
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: "8px",
        cursor: hasName && !readOnly ? "pointer" : "default",
        transition: "all 0.12s",
        boxShadow: selected ? "0 2px 8px rgba(0,48,128,0.12)" : "none",
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {/* Radio dot */}
      <div style={{
        width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? "var(--ch-blue)" : "var(--ch-border)"}`,
        background: selected ? "var(--ch-blue)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s",
      }}>
        {selected && <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "white" }} />}
      </div>
      {hasName && <TeamFlag name={slot.name} />}
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: "700", fontSize: "13px",
        color: textColor,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        flex: 1, textAlign: "left",
      }}>
        {slot?.isBest3rd
          ? (slot?.name || "Mejor 3°")
          : (slot?.name || "Por definir")}
      </span>
      {selected && (
        <span style={{
          fontSize: "9px", fontWeight: "700", letterSpacing: "0.5px",
          color: "var(--ch-blue)", background: "#ddeeff",
          padding: "2px 6px", borderRadius: "4px", flexShrink: 0,
        }}>
          ✓
        </span>
      )}
    </button>
  );
}

/** Tarjeta de partido para la vista en tabs */
function MatchCard({ match, pick, onPick, isFinal = false, subtitle = "", readOnly = false }) {
  return (
    <div style={{
      background: isFinal
        ? "linear-gradient(135deg, var(--ch-navy), #0047a8)"
        : "white",
      borderRadius: "14px",
      border: isFinal ? "2px solid #f5c200" : "1px solid #dce7f7",
      overflow: "hidden",
      boxShadow: isFinal
        ? "0 8px 28px rgba(0,48,128,0.28)"
        : "0 2px 8px rgba(0,48,128,0.06)",
    }}>
      {subtitle && (
        <div style={{
          background: isFinal ? "rgba(245,194,0,0.12)" : "#eef2fa",
          borderBottom: isFinal ? "1px solid rgba(245,194,0,0.3)" : "1px solid #dce7f7",
          padding: "5px 14px",
          fontSize: "9px", fontWeight: "700",
          color: isFinal ? "#f5c200" : "#8097c0",
          textTransform: "uppercase", letterSpacing: "1.2px",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          {subtitle}
        </div>
      )}
      <div style={{ padding: "12px" }}>
        <TeamBtn slot={match.slotA} selected={pick === 0} onClick={() => onPick(0)} isFinal={isFinal} readOnly={readOnly} />
        <div style={{
          textAlign: "center", fontSize: "8px", fontWeight: "900",
          color: isFinal ? "rgba(255,255,255,0.2)" : "var(--ch-border)",
          letterSpacing: "2px", padding: "4px 0",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          VS
        </div>
        <TeamBtn slot={match.slotB} selected={pick === 1} onClick={() => onPick(1)} isFinal={isFinal} readOnly={readOnly} />
      </div>
    </div>
  );
}

/** Rejilla adaptable de partidos */
function RoundGrid({ matches, picks, onPick, isFinal = false, subtitles = [], readOnly = false }) {
  const count = matches.length;
  const cols = count >= 8 ? "repeat(auto-fill, minmax(220px, 1fr))"
             : count >= 4 ? "repeat(auto-fill, minmax(240px, 1fr))"
             : count >= 2 ? "repeat(auto-fill, minmax(280px, 1fr))"
             : "repeat(1, minmax(280px, 1fr))";

  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: "14px" }}>
      {matches.map((match, i) => (
        <MatchCard
          key={i}
          match={match}
          pick={picks[i] ?? null}
          onPick={(v) => onPick(i, v)}
          isFinal={isFinal}
          subtitle={subtitles[i] || ""}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════

export default function Bracket({
  allGroupPredictions, groupsData,
  lPicks, setLP, rPicks, setRP,
  finalPick, setFinalPick, thirdPick, setThirdPick,
  readOnly = false,
}) {
  const [activeTab, setActiveTab] = useState("r32");
  const activeGroups = groupsData || GROUPS_DATA;

  const getSlotName = (gId, posIdx) => {
    const pred = allGroupPredictions[gId];
    if (!pred || pred[posIdx] === null || pred[posIdx] === undefined) return null;
    return activeGroups[gId]?.teams[pred[posIdx]]?.nombre ?? null;
  };

  // Mejores 3° seleccionados
  const allThirds = GROUP_IDS
    .filter((id) => {
      const v = allGroupPredictions[id]?.[2];
      return v !== null && v !== undefined;
    })
    .map((id) => activeGroups[id]?.teams[allGroupPredictions[id][2]]?.nombre ?? null)
    .filter(Boolean);

  const leftThirds  = allThirds.slice(0, 4);
  const rightThirds = allThirds.slice(4, 8);

  // R32: 8 partidos por lado (16avos)
  const leftR32  = toMatches(buildR32Slots(LEFT_BRACKET_GROUPS,  getSlotName, leftThirds));
  const rightR32 = toMatches(buildR32Slots(RIGHT_BRACKET_GROUPS, getSlotName, rightThirds));

  const EMPTY = (n) => Array(n).fill(null);

  // Rondas derivadas
  const leftR16  = advance(leftR32,  lPicks.r32);
  const leftQF   = advance(leftR16,  lPicks.r16);
  const leftSF   = advance(leftQF,   lPicks.qf);

  const rightR16 = advance(rightR32, rPicks.r32);
  const rightQF  = advance(rightR16, rPicks.r16);
  const rightSF  = advance(rightQF,  rPicks.qf);

  const finalMatch = {
    slotA: pickWinner(leftSF[0],  lPicks.sf[0]),
    slotB: pickWinner(rightSF[0], rPicks.sf[0]),
  };
  const thirdMatch = {
    slotA: pickLoser(leftSF[0],  lPicks.sf[0]),
    slotB: pickLoser(rightSF[0], rPicks.sf[0]),
  };

  // Handlers con limpieza downstream
  const pickLeft = (round, idx, val) => {
    setLP((prev) => {
      const next = { ...prev, [round]: prev[round].map((v, i) => i === idx ? val : v) };
      if (round === "r32") {
        next.r16 = EMPTY(4); next.qf = EMPTY(2); next.sf = EMPTY(1);
        setFinalPick(null); setThirdPick(null);
      } else if (round === "r16") {
        const qfIdx = Math.floor(idx / 2);
        next.qf = prev.qf.map((v, i) => i === qfIdx ? null : v);
        next.sf = EMPTY(1);
        setFinalPick(null); setThirdPick(null);
      } else if (round === "qf") {
        next.sf = EMPTY(1);
        setFinalPick(null); setThirdPick(null);
      } else if (round === "sf") {
        setFinalPick(null); setThirdPick(null);
      }
      return next;
    });
  };

  const pickRight = (round, idx, val) => {
    setRP((prev) => {
      const next = { ...prev, [round]: prev[round].map((v, i) => i === idx ? val : v) };
      if (round === "r32") {
        next.r16 = EMPTY(4); next.qf = EMPTY(2); next.sf = EMPTY(1);
        setFinalPick(null); setThirdPick(null);
      } else if (round === "r16") {
        const qfIdx = Math.floor(idx / 2);
        next.qf = prev.qf.map((v, i) => i === qfIdx ? null : v);
        next.sf = EMPTY(1);
        setFinalPick(null); setThirdPick(null);
      } else if (round === "qf") {
        next.sf = EMPTY(1);
        setFinalPick(null); setThirdPick(null);
      } else if (round === "sf") {
        setFinalPick(null); setThirdPick(null);
      }
      return next;
    });
  };

  // Combinar partidos L+R por ronda para la vista tabulada
  const allR32  = [...leftR32,  ...rightR32];
  const allR32picks = (i) => i < 8 ? (lPicks.r32[i] ?? null) : (rPicks.r32[i - 8] ?? null);
  const onPickR32 = (i, v) => i < 8 ? pickLeft("r32", i, v) : pickRight("r32", i - 8, v);

  const allR16  = [...leftR16,  ...rightR16];
  const allR16picks = (i) => i < 4 ? (lPicks.r16[i] ?? null) : (rPicks.r16[i - 4] ?? null);
  const onPickR16 = (i, v) => i < 4 ? pickLeft("r16", i, v) : pickRight("r16", i - 4, v);

  const allQF  = [...leftQF,  ...rightQF];
  const allQFpicks = (i) => i < 2 ? (lPicks.qf[i] ?? null) : (rPicks.qf[i - 2] ?? null);
  const onPickQF = (i, v) => i < 2 ? pickLeft("qf", i, v) : pickRight("qf", i - 2, v);

  const allSF  = [leftSF[0], rightSF[0]];
  const allSFpicks = (i) => i === 0 ? (lPicks.sf[0] ?? null) : (rPicks.sf[0] ?? null);
  const onPickSF = (i, v) => i === 0 ? pickLeft("sf", 0, v) : pickRight("sf", 0, v);

  // Labels de partidos R32 (A-F izq, G-L der)
  const r32Labels = [
    "Partido 1", "Partido 2", "Partido 3", "Partido 4",
    "Partido 5", "Partido 6", "Partido 7", "Partido 8",
    "Partido 9", "Partido 10", "Partido 11", "Partido 12",
    "Partido 13", "Partido 14", "Partido 15", "Partido 16",
  ];

  return (
    <div>
      {/* ── Tab strip de rondas ── */}
      <div className="tab-strip" style={{ marginBottom: "24px", paddingBottom: "2px" }}>
        {BRACKET_TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: isActive ? "2px solid #003080" : "2px solid #dce7f7",
                cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: "800",
                fontSize: "13px",
                background: isActive ? "#003080" : "white",
                color: isActive ? "#f5c200" : "#005aba",
                transition: "all 0.12s",
                flexShrink: 0,
                whiteSpace: "nowrap",
                letterSpacing: "0.3px",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Contenido de ronda ── */}

      {activeTab === "r32" && (
        <RoundGrid
          matches={allR32}
          picks={Array.from({ length: 16 }, (_, i) => allR32picks(i))}
          onPick={onPickR32}
          subtitles={r32Labels}
          readOnly={readOnly}
        />
      )}

      {activeTab === "r16" && (
        <RoundGrid
          matches={allR16}
          picks={Array.from({ length: 8 }, (_, i) => allR16picks(i))}
          onPick={onPickR16}
          subtitles={Array.from({ length: 8 }, (_, i) => `Octavos P${i + 1}`)}
          readOnly={readOnly}
        />
      )}

      {activeTab === "qf" && (
        <RoundGrid
          matches={allQF}
          picks={Array.from({ length: 4 }, (_, i) => allQFpicks(i))}
          onPick={onPickQF}
          subtitles={Array.from({ length: 4 }, (_, i) => `Cuartos P${i + 1}`)}
          readOnly={readOnly}
        />
      )}

      {activeTab === "sf" && (
        <RoundGrid
          matches={allSF}
          picks={Array.from({ length: 2 }, (_, i) => allSFpicks(i))}
          onPick={onPickSF}
          subtitles={["Semifinal 1", "Semifinal 2"]}
          readOnly={readOnly}
        />
      )}

      {activeTab === "tp" && (
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <MatchCard
            match={thirdMatch}
            pick={thirdPick}
            onPick={setThirdPick}
            isFinal={false}
            subtitle="🥉 3er Puesto"
            readOnly={readOnly}
          />
        </div>
      )}

      {activeTab === "f" && (
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <MatchCard
            match={finalMatch}
            pick={finalPick}
            onPick={setFinalPick}
            isFinal={true}
            subtitle="🏆 Gran Final"
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
}
