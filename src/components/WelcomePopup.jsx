import logoNavBar from "../assets/logo_nav_bar.png";

const POINTS = [
  { label: "Resultado correcto (V/E/D)", pts: "1 pt",   color: "#1565c0" },
  { label: "Marcador exacto",            pts: "+2 pts", color: "#2e7d32" },
  { label: "Máximo por partido",         pts: "3 pts",  color: "#e65100" },
];

export default function WelcomePopup({ onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,30,80,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "white", borderRadius: "20px",
        width: "100%", maxWidth: "520px",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,30,80,0.35)",
        animation: "popIn 0.25s ease-out",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #003080, #005aba)",
          borderRadius: "20px 20px 0 0",
          padding: "28px 28px 22px",
          textAlign: "center",
        }}>
          <img src={logoNavBar} alt="Chorotega" style={{ height: "44px", objectFit: "contain", marginBottom: "12px" }} />
          <h2 style={{
            fontFamily: "'Boldonse', cursive", fontSize: "20px",
            color: "#f5c200", margin: 0, textTransform: "uppercase", letterSpacing: "1px",
          }}>
            ¡La Jugada Ganadora Chorotega!
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.75)", margin: "6px 0 0" }}>
            FIFA World Cup 2026 · Cooperativa Chorotega
          </p>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: "24px 28px 28px" }}>

          {/* Sistema de puntos */}
          <div style={{
            background: "#f0f7ff", borderRadius: "12px",
            padding: "14px 18px", marginBottom: "20px",
            border: "1.5px solid #b3d4f7",
          }}>
            <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "13px", color: "#003080", marginBottom: "10px", textTransform: "uppercase" }}>
              🎯 Sistema de Puntos
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              {POINTS.map(({ label, pts, color }) => (
                <div key={label} style={{
                  background: "white", borderRadius: "10px",
                  padding: "10px 14px", textAlign: "center",
                  border: `1.5px solid ${color}22`, flex: "1 1 130px",
                  boxShadow: "0 2px 8px rgba(0,30,80,0.06)",
                }}>
                  <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "20px", color }}>{pts}</div>
                  <div style={{ fontSize: "11px", color: "#5c7080", fontFamily: "'Inter', sans-serif", marginTop: "3px", lineHeight: 1.3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones resumidas */}
          <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "13px", color: "#003080", marginBottom: "12px", textTransform: "uppercase" }}>
            ¿Cómo participar?
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "22px" }}>
            {[
              ["⚽", "Andá a Predicciones y completá los marcadores de los partidos de grupos."],
              ["💾", "Guardá tu quiniela con el botón Guardar y Participar (necesitás estar registrado)."],
              ["🏆", "Ganá puntos por cada resultado correcto. Seguí tu posición en la Tabla."],
            ].map(([icon, text]) => (
              <div key={text} style={{
                display: "flex", gap: "12px", alignItems: "flex-start",
                background: "#f8faff", borderRadius: "10px",
                padding: "11px 14px", border: "1px solid #e8ecf5",
              }}>
                <span style={{ fontSize: "20px", flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: "12px", color: "#3a4f6c", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%", padding: "13px",
              background: "linear-gradient(135deg, #003080, #005aba)",
              color: "white", border: "none", borderRadius: "10px",
              fontFamily: "'Boldonse', cursive", fontSize: "15px",
              textTransform: "uppercase", letterSpacing: "1px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,90,186,0.35)",
            }}
          >
            ¡Empezar a predecir! 🚀
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
