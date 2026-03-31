import { useMemo } from "react";
import GroupCard from "./GroupCard";
import { GROUP_IDS } from "../data/groups";

export default function GroupGrid({ groupsData, allGroupPredictions, onPredictionChange, readOnly = false }) {
  // Contar cuántos grupos tienen un 3° lugar elegido (máximo 8)
  const thirdCount = useMemo(() =>
    GROUP_IDS.filter((id) => allGroupPredictions[id]?.[2] !== null).length,
    [allGroupPredictions]
  );

  return (
    <section>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{
          width: "4px", height: "32px",
          background: "#f5c200",
          borderRadius: "2px", flexShrink: 0,
        }} />
        <h2 style={{
          fontFamily: "'Boldonse', cursive",
          fontSize: "22px", color: "#003080",
          margin: 0, textTransform: "uppercase",
        }}>
          Fase de Grupos
        </h2>
      </div>

      {/* Grid 6 × 2 — responsive via CSS class */}
      <div className="grupos-sim-grid">
        {GROUP_IDS.map((id) => {
          const group = groupsData[id];
          return (
            <GroupCard
              key={id}
              title={group.title}
              letra={group.letra}
              teams={group.teams}
              predictions={allGroupPredictions[id]}
              onPredictionChange={(posIdx, teamIdx) => onPredictionChange(id, posIdx, teamIdx)}
              thirdCount={thirdCount}
              readOnly={readOnly}
            />
          );
        })}
      </div>
    </section>
  );
}
