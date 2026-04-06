import { useState, useMemo, useEffect } from "react";
import { GROUP_IDS } from "../data/groups";
import { getFlagUrl } from "../data/flags.js";
import { computeStandings } from "../utils/standings.js";
import { admin as adminApi, partidosConfig as partidosConfigApi } from "../services/api.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toHonduras(horaET) {
  if (!horaET) return horaET;
  const m = horaET.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return horaET;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const period = m[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  h = (h - 2 + 24) % 24;
  const newPeriod = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${min} ${newPeriod}`;
}

// ─── Bandera ──────────────────────────────────────────────────────────────────

function FlagImg({ nombre, bandera, size = 20 }) {
  const [imgError, setImgError] = useState(false);
  const url = (nombre && !imgError) ? getFlagUrl(nombre, size) : null;
  if (url) {
    return (
      <img
        src={url} alt={nombre || ""}
        style={{ width: `${Math.round(size * 1.5)}px`, height: `${size}px`, objectFit: "cover", borderRadius: "2px", flexShrink: 0, display: "block" }}
        onError={() => setImgError(true)}
      />
    );
  }
  return <span style={{ fontSize: `${size * 0.75}px`, lineHeight: 1, flexShrink: 0 }}>{bandera || "🏳️"}</span>;
}

// ─── Input de goles ───────────────────────────────────────────────────────────

function GoalInput({ value, onChange, readOnly = false }) {
  return (
    <input
      type="number" min="0" max="20"
      value={value ?? ""}
      onChange={(e) => {
        if (readOnly) return;
        const raw = e.target.value;
        onChange(raw === "" ? null : Math.max(0, parseInt(raw) || 0));
      }}
      readOnly={readOnly}
      placeholder="–"
      style={{
        width: "30px", height: "26px", textAlign: "center",
        border: "1.5px solid var(--ch-border)", borderRadius: "5px",
        fontSize: "13px", fontWeight: "700",
        fontFamily: "'Barlow Condensed', sans-serif",
        color: "var(--ch-navy)", outline: "none",
        background: readOnly ? "#f0f3fa" : (value !== null && value !== undefined) ? "#eef4ff" : "white",
        padding: 0, flexShrink: 0,
        WebkitAppearance: "none", MozAppearance: "textfield",
        cursor: readOnly ? "default" : "text",
        opacity: readOnly ? 0.75 : 1,
      }}
    />
  );
}

// ─── Tabla de posiciones predicha ─────────────────────────────────────────────

function GroupStandings({ standings }) {
  const hasData = standings.some((t) => t.played > 0);
  if (!hasData) return null;
  const POS = [
    { bg: "#003080", color: "#f5c200" },
    { bg: "#005aba", color: "white" },
    { bg: "#e6a817", color: "#3a2000" },
    { bg: "#e0e4ef", color: "#6878a0" },
  ];
  return (
    <div style={{ background: "#f8f9fd", borderTop: "1px solid var(--ch-border)", padding: "10px 16px 12px" }}>
      <div style={{ fontSize: "8px", fontWeight: "900", color: "var(--ch-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "'Barlow Condensed', sans-serif", marginBottom: "7px" }}>
        Clasificación predicha
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {standings.map((team, idx) => {
          const pos = POS[idx] ?? POS[3];
          return (
            <div key={team.nombre} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "3px 0" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: pos.bg, color: pos.color, fontSize: "9px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif" }}>
                {idx + 1}
              </span>
              <FlagImg nombre={team.nombre} size={16} />
              <span style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: "700", color: "var(--ch-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {team.nombre}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", color: "var(--ch-text-muted)", letterSpacing: "0.3px", flexShrink: 0, minWidth: "100px", textAlign: "right" }}>
                {team.played}PJ · {team.pts}pts · {team.gd >= 0 ? "+" : ""}{team.gd}GD
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ¿El partido ya comenzó? (hora ET, mundial = EDT UTC-4) ─────────────────

function matchHasStarted(match) {
  try {
    if (!match.fecha || !match.hora) return false;
    // hora viene como "3:00 PM ET" → quitar sufijo ET
    const timeStr = match.hora.replace(/\s*ET\s*$/i, "").trim();
    const dt = new Date(`${match.fecha} ${timeStr} EDT`);
    if (isNaN(dt.getTime())) return false;
    return Date.now() >= dt.getTime();
  } catch {
    return false;
  }
}

// ─── Cálculo de puntos por partido ───────────────────────────────────────────

function calcPuntos(prediction, official) {
  if (!official) return null;
  const predH = prediction?.home, predA = prediction?.away;
  if (predH == null || predA == null) return null;
  const offH = Number(official.goles_local), offA = Number(official.goles_vis);
  if (predH === offH && predA === offA) return 3;
  const predDir = predH > predA ? "H" : predH < predA ? "A" : "D";
  const offDir  = offH  > offA  ? "H" : offH  < offA  ? "A" : "D";
  return predDir === offDir ? 1 : 0;
}

// ─── Fila de partido ──────────────────────────────────────────────────────────

function MatchRow({ match, index, prediction, onPredictionChange, readOnly = false, officialResult = null, adminClosed = false }) {
  const finished = match.estado === "FINISHED";
  const isEven   = index % 2 === 0;
  const bg       = isEven ? "white" : "#f9fafd";
  const hasPred  = prediction?.home != null && prediction?.away != null;
  const pts      = (officialResult && hasPred) ? calcPuntos(prediction, officialResult) : null;

  // Bloqueo individual: resultado oficial, partido iniciado, o cerrado por admin
  const isMatchLocked = readOnly || !!officialResult || matchHasStarted(match) || adminClosed;

  return (
    <div style={{ borderBottom: "1px solid var(--ch-border)" }}>
    <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", gap: "6px", background: bg }}>
      <div className="match-col-fecha">
        {match.fecha}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", minWidth: 0, overflow: "hidden" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: "700", color: "var(--ch-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {match.local?.nombre}
        </span>
        <FlagImg nombre={match.local?.nombre} bandera={match.local?.bandera} size={18} />
        {!finished && <GoalInput value={prediction?.home} onChange={(v) => onPredictionChange(match.id, { home: v, away: prediction?.away ?? null })} readOnly={isMatchLocked} />}
      </div>
      <div style={{ flexShrink: 0, width: "54px", textAlign: "center" }}>
        {finished && match.resultado ? (
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: "700", color: "var(--ch-navy)", letterSpacing: "1px" }}>
            {match.resultado.home}–{match.resultado.away}
          </span>
        ) : (
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "10px", fontWeight: "900", color: "var(--ch-blue)", letterSpacing: "0.5px" }}>{toHonduras(match.hora)}</span>
            <span style={{ fontSize: "7px", fontWeight: "700", color: "var(--ch-border)", letterSpacing: "2px", textTransform: "uppercase" }}>HND</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-start", minWidth: 0, overflow: "hidden" }}>
        {!finished && <GoalInput value={prediction?.away} onChange={(v) => onPredictionChange(match.id, { home: prediction?.home ?? null, away: v })} readOnly={isMatchLocked} />}
        <FlagImg nombre={match.visitante?.nombre} bandera={match.visitante?.bandera} size={18} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: "700", color: "var(--ch-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {match.visitante?.nombre}
        </span>
      </div>
      <div className="match-col-estadio">
        {match.estadio}
      </div>
      {/* Indicador de cierre por admin */}
      {adminClosed && !officialResult && !finished && (
        <span title="El admin cerró las predicciones para este partido" style={{
          fontSize: "10px", color: "#c62828", fontWeight: "700",
          fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.3px",
          padding: "0 6px", flexShrink: 0,
        }}>🔒</span>
      )}
    </div>
    {/* ─── Fila de comparación resultado oficial ─── */}
    {officialResult && (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 12px 8px", background: bg, gap: "8px",
      }}>
        {/* Izquierda: marcador oficial */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700",
            fontSize: "10px", color: "#8097c0", textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            Oficial:
          </span>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "800",
            fontSize: "14px", color: "#003080",
            background: "#e8f0ff", padding: "1px 9px", borderRadius: "5px",
            letterSpacing: "0.5px",
          }}>
            {officialResult.goles_local} – {officialResult.goles_vis}
          </span>
        </div>
        {/* Derecha: badge de puntos */}
        {hasPred ? (
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "800",
            fontSize: "11px", letterSpacing: "0.3px", padding: "2px 10px",
            borderRadius: "10px", flexShrink: 0,
            color:      pts === 3 ? "#1b7c2e" : pts === 1 ? "#005aba" : "#c0392b",
            background: pts === 3 ? "#e6f4ea" : pts === 1 ? "#e3f0ff" : "#fdecea",
          }}>
            {pts === 3 ? "✅ +3 pts" : pts === 1 ? "✅ +1 pt" : "❌ 0 pts"}
          </span>
        ) : (
          <span style={{ fontSize: "10px", color: "#b0bec5", fontStyle: "italic", fontFamily: "'Inter', sans-serif" }}>
            Sin pronóstico
          </span>
        )}
      </div>
    )}
    </div>
  );
}

// ─── Barra de guardado ────────────────────────────────────────────────────────

function SaveBar({ currentUser, savedOk, saveError, onSave, onLogin, onDismissSaved, readOnly, onModify }) {
  if (readOnly && savedOk) {
    return (
      <div style={{ position: "sticky", bottom: 0, zIndex: 50, background: "#e8f5e9", borderTop: "2px solid #a5d6a7", padding: "10px 28px", display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px" }}>✅</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#2e7d32", fontWeight: "700" }}>
          ¡Predicciones guardadas! Ya estás participando en La Jugada Ganadora Chorotega.
        </span>
        <button type="button" onClick={onModify} style={{ background: "#2e7d32", color: "white", border: "none", borderRadius: "7px", padding: "7px 18px", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700", fontSize: "12px", letterSpacing: "0.5px" }}>
          ✏️ Modificar predicción
        </button>
      </div>
    );
  }
  if (savedOk) {
    return (
      <div style={{ position: "sticky", bottom: 0, zIndex: 50, background: "#e8f5e9", borderTop: "2px solid #a5d6a7", padding: "10px 28px", display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
        <span>✅</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#2e7d32", fontWeight: "700" }}>¡Predicciones guardadas exitosamente!</span>
        <button type="button" onClick={onDismissSaved} style={{ background: "none", border: "none", cursor: "pointer", color: "#2e7d32", fontSize: "12px", fontFamily: "'Inter', sans-serif", textDecoration: "underline" }}>OK</button>
      </div>
    );
  }
  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 50, background: "var(--ch-navy)", borderTop: "3px solid var(--ch-yellow)", padding: "12px 28px", display: "flex", alignItems: "center", gap: "14px", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
          {currentUser ? `Sesión: ${currentUser.nombre}` : "Ingresá para guardar tus predicciones"}
        </span>
        {saveError && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#ffcdd2" }}>⚠️ {saveError}</span>}
      </div>
      <button type="button" onClick={currentUser ? onSave : onLogin} style={{ background: "var(--ch-yellow)", color: "var(--ch-navy)", border: "none", borderRadius: "8px", padding: "9px 22px", fontFamily: "'Boldonse', cursive", fontSize: "13px", cursor: "pointer", letterSpacing: "0.5px", flexShrink: 0 }}>
        {currentUser ? "Guardar predicciones" : "Ingresar para guardar"}
      </button>
    </div>
  );
}

// ─── Vista de ronda eliminatoria ──────────────────────────────────────────────

function RondaView({ rondaKey, bracket, scorePredictions, onScoreChange, readOnly }) {
  if (!bracket) return <PendienteMsg />;

  if (rondaKey === "r32") return (
    <R32View bracket={bracket} scorePredictions={scorePredictions} onScoreChange={onScoreChange} readOnly={readOnly} />
  );

  const fixtures = RONDA_FIXTURES[rondaKey] ?? [];
  const lSlots   = bracket?.L?.[rondaKey] ?? [];
  const rSlots   = bracket?.R?.[rondaKey] ?? [];
  const allSlots = [...lSlots, ...rSlots];

  const cols =
    rondaKey === "r16" ? "repeat(auto-fill, minmax(300px, 1fr))" :
    rondaKey === "qf"  ? "repeat(auto-fill, minmax(300px, 1fr))" :
                         "repeat(auto-fill, minmax(300px, 1fr))";

  if (rondaKey === "tp" || rondaKey === "f") {
    const adminF = rondaKey === "f" ? [...(bracket?.L?.f ?? []), ...(bracket?.R?.f ?? [])] : [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", maxWidth: "520px", margin: "0 auto" }}>
        {fixtures.map((m, i) => (
          <StaticCard
            key={m.id} match={m}
            adminA={adminF[i * 2] || null} adminB={adminF[i * 2 + 1] || null}
            prediction={scorePredictions?.[m.id]}
            onPredictionChange={onScoreChange}
            readOnly={readOnly}
          />
        ))}
        {rondaKey === "tp" && bracket?.tercero && (
          <div style={{ background: "#f8f9fd", border: "1.5px solid #c5d5f0", borderRadius: "14px", padding: "20px 28px", textAlign: "center", minWidth: "200px" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "900", fontSize: "11px", color: "#5c7080", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>3er Puesto</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <FlagImg nombre={bracket.tercero} size={22} />
              <span style={{ fontFamily: "'Boldonse', cursive", fontSize: "16px", color: "#003080" }}>{bracket.tercero}</span>
            </div>
          </div>
        )}
        {rondaKey === "f" && bracket?.campeon && (
          <div style={{ background: "linear-gradient(135deg,#fff8e1,#fffde7)", border: "2px solid #f5c200", borderRadius: "14px", padding: "20px 28px", textAlign: "center", minWidth: "200px" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "900", fontSize: "11px", color: "#7a5200", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Campeon</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <FlagImg nombre={bracket.campeon} size={22} />
              <span style={{ fontFamily: "'Boldonse', cursive", fontSize: "16px", color: "#003080" }}>{bracket.campeon}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: "12px" }}>
      {fixtures.map((m, i) => (
        <StaticCard
          key={m.id} match={m}
          adminA={allSlots[i * 2] || null} adminB={allSlots[i * 2 + 1] || null}
          prediction={scorePredictions?.[m.id]}
          onPredictionChange={onScoreChange}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function PendienteMsg() {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8f9fd", borderRadius: "12px", border: "1.5px dashed #c5d5f0" }}>
      <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "15px", color: "#003080", marginBottom: "6px" }}>Pendiente de clasificaciones</div>
      <div style={{ fontSize: "12px", color: "#8097c0", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
        Esta fase se actualizará cuando el administrador cargue los equipos clasificados.
      </div>
    </div>
  );
}

// ─── Fixture oficial 16avos de Final (FIFA WC 2026) ──────────────────────────

const DIECISEISAVOS = [
  { id: "M73", a: "2° Grupo A", b: "2° Grupo B",          fecha: "Dom 28 jun", hora: "13:00", estadio: "Los Ángeles"     },
  { id: "M74", a: "1° Grupo C", b: "2° Grupo F",          fecha: "Lun 29 jun", hora: "11:00", estadio: "Houston"          },
  { id: "M75", a: "1° Grupo E", b: "3° mejor A·B·C·D·F",  fecha: "Lun 29 jun", hora: "14:30", estadio: "Boston"           },
  { id: "M76", a: "1° Grupo F", b: "2° Grupo C",          fecha: "Lun 29 jun", hora: "19:00", estadio: "Monterrey"        },
  { id: "M77", a: "2° Grupo E", b: "2° Grupo I",          fecha: "Mar 30 jun", hora: "11:00", estadio: "Dallas"           },
  { id: "M78", a: "1° Grupo I", b: "3° mejor C·D·F·G·H",  fecha: "Mar 30 jun", hora: "15:00", estadio: "Nueva York"       },
  { id: "M79", a: "1° Grupo A", b: "3° mejor C·E·F·H·I",  fecha: "Mar 30 jun", hora: "19:00", estadio: "Ciudad de México" },
  { id: "M80", a: "1° Grupo L", b: "3° mejor E·H·J·K",    fecha: "Mié 1 jul",  hora: "10:00", estadio: "Atlanta"          },
  { id: "M81", a: "1° Grupo G", b: "3° mejor A·E·H·I·J",  fecha: "Mié 1 jul",  hora: "14:00", estadio: "Seattle"          },
  { id: "M82", a: "1° Grupo D", b: "3° mejor B·E·F·I·J",  fecha: "Mié 1 jul",  hora: "18:00", estadio: "San Francisco"    },
  { id: "M83", a: "1° Grupo H", b: "2° Grupo J",          fecha: "Jue 2 jul",  hora: "13:00", estadio: "Los Ángeles"      },
  { id: "M84", a: "2° Grupo K", b: "2° Grupo L",          fecha: "Jue 2 jul",  hora: "17:00", estadio: "Toronto"          },
  { id: "M85", a: "1° Grupo B", b: "3° mejor E·F·G·I·J",  fecha: "Jue 2 jul",  hora: "21:00", estadio: "Kansas City"      },
  { id: "M86", a: "2° Grupo D", b: "2° Grupo G",          fecha: "Vie 3 jul",  hora: "12:00", estadio: "Dallas"           },
  { id: "M87", a: "1° Grupo J", b: "2° Grupo H",          fecha: "Vie 3 jul",  hora: "16:00", estadio: "Miami"            },
  { id: "M88", a: "1° Grupo K", b: "3° mejor D·E·I·J·L",  fecha: "Vie 3 jul",  hora: "19:30", estadio: "Kansas City"      },
];

function SlotLabel({ label, adminTeam }) {
  if (adminTeam) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", background: "#f0f7ff", borderRadius: "8px", border: "1px solid #c5d8f7" }}>
        <FlagImg nombre={adminTeam} size={18} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "800", fontSize: "14px", color: "#003080", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {adminTeam}
        </span>
      </div>
    );
  }
  const isWinner = /^(W|RU)\d/.test(label);
  const is3rd    = label.startsWith("3°");
  if (isWinner) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#f5f7fc", borderRadius: "8px", border: "1px dashed #c5d5f0" }}>
        <svg width="13" height="15" viewBox="0 0 13 15" fill="none" style={{ flexShrink: 0 }}>
          <path d="M6.5 0.5L12 3.5V8C12 11.5 9.5 14 6.5 14.5C3.5 14 1 11.5 1 8V3.5L6.5 0.5Z" fill="#d4e2f7" stroke="#7aaae0" strokeWidth="1"/>
        </svg>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "800", fontSize: "15px", color: "#005aba", letterSpacing: "0.5px" }}>
          {label}
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", background: "#f5f7fc", borderRadius: "8px", border: "1px dashed #c5d5f0" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "2px", flexShrink: 0, background: is3rd ? "#e6a817" : "#005aba" }} />
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700", fontSize: is3rd ? "10px" : "13px", color: "#4a6080", lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Fixture estático rondas eliminatorias (W+número oficial FIFA) ───────────

const RONDA_FIXTURES = {
  r32: DIECISEISAVOS,
  r16: [
    { id: "M89",  a: "W73", b: "W75", fecha: "Sáb 4 jul",   hora: "11:00", estadio: "Houston"          },
    { id: "M90",  a: "W74", b: "W77", fecha: "Sáb 4 jul",   hora: "15:00", estadio: "Filadelfia"        },
    { id: "M91",  a: "W76", b: "W78", fecha: "Dom 5 jul",   hora: "14:00", estadio: "Nueva York"        },
    { id: "M92",  a: "W79", b: "W80", fecha: "Dom 5 jul",   hora: "18:00", estadio: "Ciudad de México"  },
    { id: "M93",  a: "W83", b: "W84", fecha: "Lun 6 jul",   hora: "13:00", estadio: "Dallas"            },
    { id: "M94",  a: "W81", b: "W82", fecha: "Lun 6 jul",   hora: "18:00", estadio: "Seattle"           },
    { id: "M95",  a: "W86", b: "W88", fecha: "Mar 7 jul",   hora: "10:00", estadio: "Atlanta"           },
    { id: "M96",  a: "W85", b: "W87", fecha: "Mar 7 jul",   hora: "14:00", estadio: "Vancouver"         },
  ],
  qf: [
    { id: "M97",  a: "W89", b: "W90", fecha: "Jue 9 jul",   hora: "14:00", estadio: "Boston"            },
    { id: "M98",  a: "W93", b: "W94", fecha: "Vie 10 jul",  hora: "13:00", estadio: "Los Ángeles"       },
    { id: "M99",  a: "W91", b: "W92", fecha: "Sáb 11 jul",  hora: "15:00", estadio: "Miami"             },
    { id: "M100", a: "W95", b: "W96", fecha: "Sáb 11 jul",  hora: "19:00", estadio: "Kansas City"       },
  ],
  sf: [
    { id: "M101", a: "W97",  b: "W98",  fecha: "Mar 14 jul", hora: "13:00", estadio: "Dallas"           },
    { id: "M102", a: "W99",  b: "W100", fecha: "Mié 15 jul", hora: "13:00", estadio: "Atlanta"          },
  ],
  tp: [
    { id: "M103", a: "RU101", b: "RU102", label: "3er Puesto", fecha: "Sáb 18 jul", hora: "15:00", estadio: "Miami"      },
  ],
  f: [
    { id: "M104", a: "W101",  b: "W102",  label: "Gran Final", fecha: "Dom 19 jul", hora: "13:00", estadio: "Nueva York" },
  ],
};

function StaticCard({ match, adminA, adminB, prediction, onPredictionChange, readOnly = false }) {
  const hasTeams     = adminA || adminB;
  const hasPredValues = prediction?.home != null || prediction?.away != null;
  // Mostrar inputs si hay equipos definidos O si ya hay valores guardados
  const showInputs = hasTeams || hasPredValues;
  // Solo permitir edición si hay equipos y no es readOnly
  const canEdit = !readOnly && hasTeams;
  const predH = prediction?.home ?? null;
  const predA = prediction?.away ?? null;
  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #dce7f7", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,48,128,0.06)" }}>
      {/* Header: match id + fecha */}
      <div style={{ background: "#eef2fa", borderBottom: "1px solid #dce7f7", padding: "5px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "9px", fontWeight: "700", color: "#8097c0", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'Barlow Condensed', sans-serif" }}>
          {match.label || match.id}
        </span>
        {match.fecha && (
          <span style={{ fontSize: "9px", color: "#a8b8d8", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}>
            {match.fecha}
          </span>
        )}
      </div>
      {/* Equipos + inputs de predicción */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* Fila equipo A */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SlotLabel label={match.a} adminTeam={adminA} />
          </div>
          {showInputs && (
            <GoalInput
              value={predH}
              onChange={(v) => canEdit && onPredictionChange?.(match.id, { home: v, away: predA })}
              readOnly={!canEdit}
            />
          )}
        </div>
        {/* Separador VS */}
        <div style={{ textAlign: "center", fontSize: "9px", fontWeight: "900", color: "#c5d5f0", letterSpacing: "2px", fontFamily: "'Barlow Condensed', sans-serif" }}>VS</div>
        {/* Fila equipo B */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SlotLabel label={match.b} adminTeam={adminB} />
          </div>
          {showInputs && (
            <GoalInput
              value={predA}
              onChange={(v) => canEdit && onPredictionChange?.(match.id, { home: predH, away: v })}
              readOnly={!canEdit}
            />
          )}
        </div>
      </div>
      {/* Footer: hora + estadio */}
      {(match.hora || match.estadio) && (
        <div style={{ background: "#f8f9fd", borderTop: "1px solid #eef2fa", padding: "5px 14px", display: "flex", gap: "6px", alignItems: "center" }}>
          {match.hora && (
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#005aba", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.3px" }}>
              {match.hora} <span style={{ fontWeight: "400", color: "#8097c0" }}>HND</span>
            </span>
          )}
          {match.hora && match.estadio && <span style={{ color: "#c5d5f0", fontSize: "10px" }}>·</span>}
          {match.estadio && (
            <span style={{ fontSize: "10px", color: "#6878a0", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}>
              {match.estadio}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function R32View({ bracket, scorePredictions, onScoreChange, readOnly }) {
  const lSlots = bracket?.L?.r32 ?? [];
  const rSlots = bracket?.R?.r32 ?? [];
  const allSlots = [...lSlots, ...rSlots];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
      {DIECISEISAVOS.map((m, i) => (
        <StaticCard
          key={m.id} match={m}
          adminA={allSlots[i * 2] || null} adminB={allSlots[i * 2 + 1] || null}
          prediction={scorePredictions?.[m.id]}
          onPredictionChange={onScoreChange}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

// ─── Constantes de secciones ──────────────────────────────────────────────────

const COL_HD = { fontSize: "8px", fontWeight: "900", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "'Inter', sans-serif" };

const SECCIONES = [
  { key: "grupos", label: "Fase de Grupos"   },
  { key: "r32",   label: "16avos de Final"  },
  { key: "r16",   label: "Octavos de Final" },
  { key: "qf",    label: "Cuartos de Final" },
  { key: "sf",    label: "Semifinales"      },
  { key: "tp",    label: "3er Puesto"       },
  { key: "f",     label: "Gran Final"       },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CalendarioPage({
  matches = [],
  onBack,
  scorePredictions = {},
  onScoreChange,
  onSave,
  currentUser,
  onLogin,
  savedOk,
  saveError,
  onDismissSaved,
  readOnly = false,
  onModify,
}) {
  const [activeTab, setActiveTab]           = useState("grupos");
  const [activeGroupFilter, setActiveGroupFilter] = useState(GROUP_IDS[0]);
  const [bracket, setBracket]               = useState(null);
  const [loadingBracket, setLoadingBracket] = useState(true);
  const [oficialResultados, setOficialResultados] = useState({});
  // config de partidos cerrados por admin: { [partidoId]: false }
  const [partidosConfigMap, setPartidosConfigMap] = useState({});

  // Cargar bracket oficial (una sola vez)
  useEffect(() => {
    adminApi.obtenerBracket()
      .then((d) => setBracket(d.bracket ?? {}))
      .catch(() => setBracket({}))
      .finally(() => setLoadingBracket(false));
  }, []);

  // Cargar resultados oficiales y config de partidos cerrados
  useEffect(() => {
    adminApi.obtenerResultados()
      .then((d) => setOficialResultados(d.resultados ?? {}))
      .catch(() => {});
    partidosConfigApi.obtener()
      .then((d) => setPartidosConfigMap(d.config ?? {}))
      .catch(() => {});
  }, []);

  const byGroup = useMemo(() => {
    const map = {};
    GROUP_IDS.forEach((id) => { map[id] = []; });
    matches.forEach((m) => {
      const letter = m.grupo?.replace("Grupo ", "").trim();
      if (letter && map[letter]) map[letter].push(m);
    });
    return map;
  }, [matches]);

  return (
    <div style={{ background: "var(--ch-bg)", minHeight: "100vh", paddingBottom: "80px" }}>

      {/* ── Sub-header ── */}
      <div style={{ background: "var(--ch-navy)", borderBottom: "3px solid var(--ch-yellow)", padding: "16px 28px 0" }} className="page-padding">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Título + back */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <button type="button" onClick={onBack} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "6px", color: "white", padding: "6px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              ← Inicio
            </button>
            <div>
              <h1 style={{ fontFamily: "'Boldonse', cursive", fontSize: "22px", color: "white", margin: 0, lineHeight: 1 }}>
                Predicciones — FIFA World Cup 2026™
              </h1>
            </div>
          </div>

          {/* ── Tabs de sección ── */}
          <div className="tab-strip">
            {SECCIONES.map(({ key, label }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{
                    background: isActive ? "white" : "rgba(255,255,255,0.08)",
                    color: isActive ? "#003080" : "rgba(255,255,255,0.65)",
                    border: "none", borderRadius: "8px 8px 0 0",
                    padding: "9px 16px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: isActive ? "600" : "400", fontSize: "13px",
                    cursor: "pointer", whiteSpace: "nowrap",
                    letterSpacing: "0.2px",
                    transition: "all 0.15s",
                    borderBottom: isActive ? "3px solid #f5c200" : "3px solid transparent",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 28px 20px" }} className="page-padding">

        {/* ── FASE DE GRUPOS ── */}
        {activeTab === "grupos" && (
          matches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ch-text-muted)" }}>Cargando partidos…</div>
          ) : (
            <>
              {/* Sub-tabs de grupo: A - L */}
              <div className="group-sub-tabs">
                {GROUP_IDS.map((id) => {
                  const isActive = activeGroupFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveGroupFilter(id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: isActive ? "2px solid #003080" : "2px solid #d0d9ec",
                        cursor: "pointer",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: "800",
                        fontSize: "13px",
                        background: isActive ? "#003080" : "white",
                        color: isActive ? "#f5c200" : "#003080",
                        transition: "all 0.12s",
                        flexShrink: 0,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {id}
                    </button>
                  );
                })}
              </div>

              {/* Partidos del grupo seleccionado */}
              {(() => {
                const groupMatches = byGroup[activeGroupFilter] || [];
                if (groupMatches.length === 0) return (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--ch-text-muted)", fontSize: "13px" }}>
                    Sin partidos registrados para el Grupo {activeGroupFilter}.
                  </div>
                );
                const standings = computeStandings(groupMatches, scorePredictions);
                return (
                  <section style={{ marginBottom: "32px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0" }}>
                      <div style={{ background: "var(--ch-blue)", color: "white", fontFamily: "'Boldonse', cursive", fontSize: "13px", padding: "5px 14px", borderRadius: "6px 6px 0 0" }}>
                        Grupo {activeGroupFilter}
                      </div>
                      <div style={{ flex: 1, height: "1px", background: "var(--ch-border)" }} />
                    </div>
                    <div style={{ border: "1px solid var(--ch-border)", borderRadius: "0 8px 8px 8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(10,36,100,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "var(--ch-navy)" }}>
                        <div className="match-col-fecha" style={{ ...COL_HD }}>Fecha</div>
                        <div style={{ flex: 1, textAlign: "right", ...COL_HD }}>Local</div>
                        <div style={{ width: "54px", textAlign: "center", ...COL_HD }}>HND</div>
                        <div style={{ flex: 1, ...COL_HD }}>Visitante</div>
                        <div className="match-col-estadio" style={{ ...COL_HD }}>Estadio</div>
                      </div>
                      {groupMatches.map((match, i) => (
                        <MatchRow
                          key={match.id}
                          match={match}
                          index={i}
                          prediction={scorePredictions[match.id]}
                          onPredictionChange={onScoreChange}
                          readOnly={readOnly}
                          officialResult={oficialResultados[String(match.id)] ?? null}
                          adminClosed={partidosConfigMap[String(match.id)] === false}
                        />
                      ))}
                      <GroupStandings standings={standings} />
                    </div>
                  </section>
                );
              })()}
            </>
          )
        )}

        {/* ── RONDAS ELIMINATORIAS ── */}
        {activeTab !== "grupos" && (
          <div>
            {loadingBracket ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#8097c0", fontSize: "13px" }}>Cargando fixture…</div>
            ) : (
              <RondaView
                rondaKey={activeTab}
                bracket={bracket}
                scorePredictions={scorePredictions}
                onScoreChange={onScoreChange}
                readOnly={readOnly}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Barra de guardado sticky (grupos y eliminatorias con equipos definidos) ── */}
      <SaveBar
        currentUser={currentUser}
        savedOk={savedOk}
        saveError={saveError}
        onSave={onSave}
        onLogin={onLogin}
        onDismissSaved={onDismissSaved}
        readOnly={readOnly}
        onModify={onModify}
      />
    </div>
  );
}
