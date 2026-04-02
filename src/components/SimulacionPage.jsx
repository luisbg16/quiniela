import { useState, useCallback, useEffect } from "react";
import GroupCard from "./GroupCard";
import Bracket from "./Bracket";
import { GROUPS_DATA, GROUP_IDS, createInitialPredictions } from "../data/groups";

const EMPTY = (n) => Array(n).fill(null);

const SIM_TABS = [
  { key: "grupos", label: "⚽ Grupos" },
  { key: "llaves", label: "🏆 Llaves" },
];

export default function SimulacionPage({ groupsData }) {
  const [simPredictions, setSimPredictions] = useState(createInitialPredictions);
  const [lPicks, setLP] = useState({ r32: EMPTY(8), r16: EMPTY(4), qf: EMPTY(2), sf: EMPTY(1) });
  const [rPicks, setRP] = useState({ r32: EMPTY(8), r16: EMPTY(4), qf: EMPTY(2), sf: EMPTY(1) });
  const [finalPick, setFinalPick] = useState(null);
  const [thirdPick, setThirdPick] = useState(null);
  const [simTab, setSimTab] = useState("grupos");
  const [activeGroup, setActiveGroup] = useState(GROUP_IDS[0]);

  const data = groupsData ?? GROUPS_DATA;

  const handlePredictionChange = useCallback((groupId, posIdx, teamIdx) => {
    setSimPredictions((prev) => {
      const group = { ...prev[groupId] };
      if (group[posIdx] === teamIdx) {
        group[posIdx] = null;
        return { ...prev, [groupId]: group };
      }
      [0, 1, 2].forEach((p) => {
        if (p !== posIdx && group[p] === teamIdx) group[p] = null;
      });
      group[posIdx] = teamIdx;
      return { ...prev, [groupId]: group };
    });
  }, []);

  const handleReset = () => {
    setSimPredictions(createInitialPredictions());
    setLP({ r32: EMPTY(8), r16: EMPTY(4), qf: EMPTY(2), sf: EMPTY(1) });
    setRP({ r32: EMPTY(8), r16: EMPTY(4), qf: EMPTY(2), sf: EMPTY(1) });
    setFinalPick(null);
    setThirdPick(null);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Estilos de impresión
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "sim-print-styles";
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #simulacion-root, #simulacion-root * { visibility: visible !important; }
        #simulacion-root { position: absolute; left: 0; top: 0; width: 100%; }
        .sim-no-print { display: none !important; }
        @page { margin: 1cm; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById("sim-print-styles");
      if (el) el.remove();
    };
  }, []);

  const completedGroups = GROUP_IDS.filter(
    (id) => simPredictions[id]?.[0] != null && simPredictions[id]?.[1] != null
  ).length;

  const currentGroup = data[activeGroup];

  return (
    <div id="simulacion-root" style={{ maxWidth: "1440px", margin: "0 auto", padding: "24px 20px 48px" }}>

      {/* ── Tarjeta disclaimer ── */}
      <div style={{
        background: "linear-gradient(135deg, #fff8e1, #fffde7)",
        border: "1.5px solid #f5c200",
        borderRadius: "12px",
        padding: "14px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}>
        <span style={{ fontSize: "22px", flexShrink: 0 }}>🎮</span>
        <div>
          <div style={{
            fontFamily: "'Boldonse', cursive",
            fontSize: "13px",
            color: "#7a5200",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "4px",
          }}>
            Modo Simulación — Solo para explorar
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#5a4000",
            lineHeight: 1.55,
          }}>
            Aquí podés predecir tu campeón del mundo de forma interactiva. <strong>Esta sección no forma parte de La Jugada Ganadora Chorotega</strong> y no afecta tu puntaje ni tu participación en el sorteo.
          </div>
        </div>
      </div>

      {/* ── Encabezado + tab strip ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "4px", height: "32px", background: "linear-gradient(180deg,#f5c200,#005aba)", borderRadius: "3px" }} />
          <h1 style={{ fontFamily: "'Boldonse', cursive", fontSize: "18px", color: "#003080", margin: 0, textTransform: "uppercase" }}>
            Simulación del Mundial
          </h1>
        </div>

        {/* Tab strip Grupos / Llaves */}
        <div style={{ display: "flex", gap: "4px", background: "#eef1f8", borderRadius: "10px", padding: "4px" }}>
          {SIM_TABS.map(({ key, label }) => {
            const isActive = simTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSimTab(key)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: "700",
                  fontSize: "14px",
                  background: isActive ? "#003080" : "transparent",
                  color: isActive ? "#f5c200" : "#005aba",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB: GRUPOS ── */}
      {simTab === "grupos" && (
        <>
          {/* Sub-tabs de grupo A-L */}
          <div className="group-sub-tabs" style={{ marginBottom: "20px" }}>
            {GROUP_IDS.map((id) => {
              const isActive = activeGroup === id;
              const done0 = simPredictions[id]?.[0] != null;
              const done1 = simPredictions[id]?.[1] != null;
              const complete = done0 && done1;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveGroup(id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: isActive
                      ? "2px solid #003080"
                      : complete
                        ? "2px solid #a5d6a7"
                        : "2px solid #d0d9ec",
                    cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: "800",
                    fontSize: "13px",
                    background: isActive ? "#003080" : complete ? "#e8f5e9" : "white",
                    color: isActive ? "#f5c200" : complete ? "#2e7d32" : "#003080",
                    transition: "all 0.12s",
                    flexShrink: 0,
                    letterSpacing: "0.5px",
                    position: "relative",
                  }}
                >
                  {id}
                  {complete && !isActive && (
                    <span style={{ position: "absolute", top: "-5px", right: "-5px", fontSize: "8px" }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* GroupCard del grupo activo */}
          {currentGroup && (
            <div style={{ maxWidth: "320px" }}>
              <GroupCard
                title={currentGroup.title}
                letra={currentGroup.letra}
                teams={currentGroup.teams}
                predictions={simPredictions[activeGroup]}
                onPredictionChange={(posIdx, teamIdx) => handlePredictionChange(activeGroup, posIdx, teamIdx)}
                thirdCount={GROUP_IDS.filter((id) => simPredictions[id]?.[2] !== null).length}
                readOnly={false}
              />
            </div>
          )}

          {/* Progreso */}
          <div style={{
            marginTop: "20px",
            background: completedGroups === 12 ? "#e8f5e9" : "#eef7ff",
            border: `1px solid ${completedGroups === 12 ? "#a5d6a7" : "#b3d4f7"}`,
            borderRadius: "8px", padding: "10px 16px",
            fontSize: "13px",
            color: completedGroups === 12 ? "#2e7d32" : "#1565c0",
            fontFamily: "'Inter', sans-serif",
          }}>
            {completedGroups === 12
              ? "✅ Todos los grupos completados. ¡Ve a la pestaña Llaves!"
              : <>Completá 1° y 2° de cada grupo para desbloquear los 16avos. Grupos listos: <strong>{completedGroups}/12</strong></>
            }
          </div>
        </>
      )}

      {/* ── TAB: LLAVES ── */}
      {simTab === "llaves" && (
        <>
          {completedGroups < 12 && (
            <div style={{
              background: "#eef7ff", border: "1px solid #b3d4f7",
              borderRadius: "8px", padding: "10px 16px", marginBottom: "20px",
              fontSize: "13px", color: "#1565c0", fontFamily: "'Inter', sans-serif",
            }}>
              Completá 1° y 2° de cada grupo en la pestaña <strong>Grupos</strong> para desbloquear las llaves.
              Grupos listos: <strong>{completedGroups}/12</strong>
            </div>
          )}

          <Bracket
            allGroupPredictions={simPredictions}
            groupsData={data}
            lPicks={lPicks}   setLP={setLP}
            rPicks={rPicks}   setRP={setRP}
            finalPick={finalPick} setFinalPick={setFinalPick}
            thirdPick={thirdPick} setThirdPick={setThirdPick}
            readOnly={false}
          />
        </>
      )}

      {/* ── Barra de acciones abajo ── */}
      <div className="sim-no-print" style={{
        marginTop: "36px",
        paddingTop: "20px",
        borderTop: "1px solid var(--ch-border)",
        display: "flex",
        gap: "10px",
        justifyContent: "flex-end",
        flexWrap: "wrap",
      }}>
        <button
          type="button"
          onClick={handleReset}
          style={{
            background: "rgba(245,194,0,0.15)", border: "1.5px solid #f5c200",
            borderRadius: "8px", padding: "8px 18px", cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700",
            fontSize: "13px", color: "#7a5200",
          }}
        >
          ↺ Reiniciar simulación
        </button>
        <button
          type="button"
          onClick={handleExportPDF}
          style={{
            background: "#003080", border: "none",
            borderRadius: "8px", padding: "8px 18px", cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: "700",
            fontSize: "13px", color: "white",
          }}
        >
          ↓ Descargar PDF
        </button>
      </div>
    </div>
  );
}
