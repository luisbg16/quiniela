import { getFlagUrl } from "../data/flags.js";

const POS_COLORS = ["#005aba", "#1a73e8", "#8097c0"];

const DEFAULT_TEAMS = [
  { nombre: "Participante 1", bandera: "🏳️", logo: null },
  { nombre: "Participante 2", bandera: "🏳️", logo: null },
  { nombre: "Participante 3", bandera: "🏳️", logo: null },
  { nombre: "Participante 4", bandera: "🏳️", logo: null },
];

function TeamFlag({ team }) {
  const flagUrl = getFlagUrl(team.nombre);
  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={team.nombre}
        style={{ width: "20px", height: "14px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  if (team.logo) {
    return (
      <img
        src={team.logo}
        alt={team.nombre}
        style={{ width: "16px", height: "16px", objectFit: "contain", flexShrink: 0 }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return <span style={{ fontSize: "13px", flexShrink: 0, lineHeight: 1 }}>{team.bandera}</span>;
}

export default function GroupCard({
  title,
  letra = "A",
  teams = DEFAULT_TEAMS,
  predictions = { 0: null, 1: null, 2: null },
  onPredictionChange,
  thirdCount = 0,      // cuántos terceros ya elegidos en TOTAL (a través de todos los grupos)
  readOnly = false,    // true: sólo visualización, sin edición
}) {
  const isSelected = (posIdx, teamIdx) => predictions[posIdx] === teamIdx;

  const handleClick = (posIdx, teamIdx) => {
    if (readOnly) return; // bloqueado en modo sólo lectura
    // Para 3° lugar (posIdx === 2): bloquear si ya hay 8 terceros elegidos
    // y este grupo aún no tiene ninguno seleccionado
    if (posIdx === 2) {
      const thisGroupHasThird = predictions[2] !== null;
      if (!thisGroupHasThird && thirdCount >= 8) return; // límite alcanzado
    }
    if (onPredictionChange) onPredictionChange(posIdx, teamIdx);
  };

  const thirdFull = thirdCount >= 8 && predictions[2] === null;

  return (
    <article
      className="group-card"
      style={{
        background: "white",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 1px 8px rgba(0,48,128,0.08)",
        border: "1px solid var(--ch-border)",
      }}
    >
      {/* Header */}
      <div style={{
        background: "#005aba",
        padding: "8px 10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{
            width: "22px", height: "22px",
            borderRadius: "4px",
            background: "rgba(245,194,0,0.2)",
            border: "1px solid rgba(245,194,0,0.5)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px",
            fontFamily: "'Boldonse', cursive",
            color: "#f5c200",
            flexShrink: 0,
          }}>
            {letra}
          </span>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "13px", fontWeight: "800",
            color: "white", textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            {title}
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {["1°", "2°", "3°"].map((p) => (
            <div key={p} style={{ width: "22px", textAlign: "center", fontSize: "9px", fontWeight: "700", color: "rgba(255,255,255,0.65)" }}>
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Filas de equipos */}
      <div style={{ padding: "6px 10px 8px" }}>
        {teams.map((team, teamIdx) => (
          <div
            key={teamIdx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: teamIdx < teams.length - 1 ? "1px solid #f0f3fa" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
              <TeamFlag team={team} />
              <span style={{
                fontSize: "11px", fontWeight: "500",
                color: "#003080",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {team.nombre}
              </span>
            </div>

            <div style={{ display: "flex", gap: "4px", flexShrink: 0, marginLeft: "4px" }}>
              {[0, 1, 2].map((posIdx) => {
                const selected = isSelected(posIdx, teamIdx);
                // Botón de 3° deshabilitado si ya hay 8 y este grupo no tiene ninguno
                const disabled = posIdx === 2 && thirdFull && !selected;
                return (
                  <button
                    key={posIdx}
                    type="button"
                    onClick={() => !disabled && !readOnly && handleClick(posIdx, teamIdx)}
                    title={readOnly ? "Presioná 'Modificar predicción' para editar" : `${["1°", "2°", "3°"][posIdx]} lugar`}
                    style={{
                      width: "22px", height: "22px",
                      borderRadius: "50%",
                      border: selected
                        ? `2px solid ${POS_COLORS[posIdx]}`
                        : (disabled || readOnly) ? "2px solid #e8ecf5" : "2px solid #d0d9ec",
                      background: selected ? POS_COLORS[posIdx] : "white",
                      cursor: (disabled || readOnly) ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0,
                      transition: "all 0.12s",
                      flexShrink: 0,
                      opacity: disabled ? 0.35 : 1,
                    }}
                  >
                    {selected && (
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
