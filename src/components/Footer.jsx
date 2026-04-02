import logoNavBar from "../assets/logo_nav_bar.png";

export default function Footer() {
  return (
    <footer style={{ marginTop: "72px", background: "var(--ch-navy)", color: "white", borderTop: "3px solid var(--ch-blue)" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "44px 28px 28px" }}>

        {/* Cuerpo — className maneja el grid responsive vía index.css */}
        <div className="footer-grid">

          {/* Columna 1 — Brand */}
          <div>
            <div style={{ marginBottom: "14px" }}>
              <img src={logoNavBar} alt="Cooperativa Chorotega · Mundial 2026"
                style={{ height: "40px", width: "auto", objectFit: "contain" }} />
            </div>
            <div style={{ fontSize: "11px", fontWeight: "800", color: "rgba(245,194,0,0.85)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif" }}>
              La Jugada Ganadora Chorotega
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.48)", lineHeight: 1.6, maxWidth: "260px", margin: 0 }}>
              Predice los resultados del Mundial 2026 y compite por premios increíbles con tu cooperativa.
            </p>
          </div>

          {/* Columna 2 — Navegación */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.38)",
              textTransform: "uppercase", letterSpacing: "2px", marginBottom: "18px" }}>
              Navegación
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Calendario de Partidos", "Mis Predicciones", "Condiciones del Concurso", "Preguntas Frecuentes"].map((link) => (
                <button key={link} type="button" style={{
                  background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: "600",
                  textAlign: "left", padding: 0, cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.5px", transition: "color 0.15s",
                }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--ch-yellow)")}
                  onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.6)")}>
                  → {link}
                </button>
              ))}
            </div>
          </div>

          {/* Columna 3 — Info del torneo */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.38)",
              textTransform: "uppercase", letterSpacing: "2px", marginBottom: "18px" }}>
              Información
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {[
                { label: "Torneo", value: "FIFA World Cup 2026™" },
                { label: "Grupos", value: "12 grupos · 48 equipos" },
                { label: "Sede",   value: "USA, México y Canadá" },
                { label: "Inicio", value: "11 de junio, 2026" },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: "9px", fontWeight: "900", color: "rgba(255,255,255,0.33)",
                    textTransform: "uppercase", letterSpacing: "1px" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "rgba(255,255,255,0.72)", marginTop: "1px" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: "600",
            textTransform: "uppercase", letterSpacing: "0.8px" }}>
            © 2026 Cooperativas Chorotega · Todos los derechos reservados
          </div>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
            {["Privacidad", "Términos", "Contacto"].map((item) => (
              <button key={item} type="button" style={{
                background: "transparent", border: "none",
                color: "rgba(255,255,255,0.3)", fontSize: "11px", fontWeight: "700",
                textTransform: "uppercase", letterSpacing: "0.8px", cursor: "pointer", padding: 0,
                transition: "color 0.15s",
              }}
                onMouseEnter={(e) => (e.target.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.3)")}>
                {item}
              </button>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
