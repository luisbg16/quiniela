// ============================================================
// COMPONENTE LOGO — Chorotega + FIFA World Cup 2026
//
// Para reemplazar con logos reales:
//   1. Coloca los archivos en src/assets/
//      - logo-chorotega.png  (o .svg)
//      - logo-fifa26.png     (o .svg)
//   2. Descomenta las líneas <img> y elimina los SVGs inline
// ============================================================

// import logoChorotega from "../assets/logo-chorotega.png";
// import logoFifa26 from "../assets/logo-fifa26.png";

function ChorotegaGear({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dientes del engranaje */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M26 2h12l2 6 5-2 6 6-2 5 6 2v12l-6 2 2 5-6 6-5-2-2 6H26l-2-6-5 2-6-6 2-5-6-2V19l6-2-2-5 6-6 5 2 2-6z"
        fill="#f5c200"
      />
      {/* Círculo interior */}
      <circle cx="32" cy="31" r="12" fill="#005aba" />
      {/* M */}
      <text x="32" y="36" textAnchor="middle" fontSize="12" fontWeight="900" fill="#f5c200" fontFamily="Arial, sans-serif">M</text>
    </svg>
  );
}

function Fifa26Badge({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size,
      background: "white",
      borderRadius: "50%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      flexShrink: 0,
      border: "2px solid rgba(255,255,255,0.35)",
    }}>
      {/* Descomentar cuando tengas el logo oficial: */}
      {/* <img src={logoFifa26} alt="FIFA 26" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> */}
      <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "11px", color: "#003080", lineHeight: 1 }}>26</div>
      <div style={{ fontSize: "6px", fontWeight: "900", color: "#005aba", letterSpacing: "0.5px" }}>FIFA</div>
    </div>
  );
}

export default function Logo({ variant = "full", darkBg = true }) {
  const textColor = darkBg ? "white" : "#003080";
  const subColor  = darkBg ? "rgba(255,255,255,0.6)" : "#6878a0";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Descomentar cuando tengas el logo real: */}
        {/* <img src={logoChorotega} alt="Chorotega" style={{ height: "40px", width: "auto" }} /> */}
        <ChorotegaGear size={40} />

        {variant === "full" && (
          <div>
            <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "19px", color: textColor, lineHeight: 1.1 }}>
              Chorotega
            </div>
            <div style={{ fontSize: "8px", fontWeight: "600", color: subColor, textTransform: "uppercase", letterSpacing: "1.6px", fontFamily: "'Inter', sans-serif" }}>
              Cooperativa de Ahorro y Crédito
            </div>
          </div>
        )}
      </div>

      {variant === "full" && (
        <div style={{ width: "1px", height: "30px", background: darkBg ? "rgba(255,255,255,0.25)" : "rgba(0,48,128,0.2)" }} />
      )}

      <Fifa26Badge size={36} />
    </div>
  );
}
