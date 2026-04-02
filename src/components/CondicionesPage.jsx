import logoColor from "../assets/logo_color.png";

export default function CondicionesPage({ onBack }) {
  return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      {/* Sub-header */}
      <div style={{
        background: "var(--ch-navy)",
        borderBottom: "3px solid var(--ch-yellow)",
        padding: "20px 28px",
      }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                background: "rgba(255,255,255,0.12)", border: "none",
                borderRadius: "6px", color: "white",
                padding: "6px 14px", cursor: "pointer",
                fontSize: "12px", fontWeight: "700",
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}
            >
              ← Inicio
            </button>
            <div>
              <h1 style={{
                fontFamily: "'Boldonse', cursive",
                fontSize: "22px", color: "white",
                margin: 0, lineHeight: 1,
              }}>
                Términos y Condiciones
              </h1>
              <p style={{
                color: "rgba(255,255,255,0.55)", fontSize: "12px",
                margin: "4px 0 0", fontFamily: "'Inter', sans-serif",
              }}>
                La Jugada Ganadora Chorotega · FIFA World Cup 2026™
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 28px 80px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <img
            src={logoColor}
            alt="Cooperativa Chorotega"
            style={{ height: "72px", width: "auto", objectFit: "contain" }}
          />
        </div>

        <Section title="1. Participación">
          Podrán participar todos los usuarios afiliados o no afiliados, incluyendo los colaboradores de la
          Cooperativa de Ahorro y Crédito Chorotega, que se registren en La Jugada Ganadora Chorotega.
          La participación es personal e intransferible; solo se permitirá un usuario por número de identidad.
        </Section>

        <Section title="2. Registro">
          Para registrarse, el usuario deberá completar su perfil con la siguiente información: número de
          identidad, nombre completo, correo electrónico y número de teléfono. El registro es gratuito y
          estará disponible durante todo el período de vigencia de la promoción.
        </Section>

        <Section title="3. Dinámica">
          La promoción consiste en pronosticar los resultados de los partidos del Mundial 2026 mediante La
          Jugada Ganadora Chorotega. Los pronósticos de la fase de grupos estarán habilitados desde el
          7 de abril de 2026. Para los partidos de la fase eliminatoria, cada encuentro se habilitará
          24 horas antes de su inicio. En todos los casos, los pronósticos se cerrarán 5 minutos antes
          del pitazo inicial. No se permitirán cambios de resultados una vez cerrado el período de
          pronóstico de cada partido.
        </Section>

        <Section title="4. Sistema de puntuación">
          Los puntos se asignarán de la siguiente manera por cada partido:
          <ul style={{ margin: "10px 0 0 16px", padding: 0, lineHeight: 2 }}>
            <li><strong>Acierto de resultado</strong> (ganador o empate): <strong>1 punto</strong></li>
            <li><strong>Acierto de marcador exacto</strong>: <strong>+2 puntos adicionales</strong> (total 3 pts)</li>
            <li><strong>Sin acierto</strong>: 0 puntos</li>
          </ul>
        </Section>

        <Section title="5. Elegibilidad para el sorteo">
          Participarán en el sorteo del premio únicamente los usuarios que cumplan con todas las condiciones
          siguientes:
          <ul style={{ margin: "10px 0 0 16px", padding: 0, lineHeight: 2 }}>
            <li>Ser afiliado activo de la Cooperativa Chorotega.</li>
            <li>Haber completado al menos el <strong>80% de los pronósticos</strong> durante la vigencia del concurso.</li>
            <li>Haber alcanzado el mínimo de <strong>60 puntos</strong> acumulados.</li>
          </ul>
        </Section>

        <Section title="6. Afiliación">
          Los participantes no afiliados que deseen optar al sorteo deberán formalizar su afiliación a la
          Cooperativa durante el período de vigencia de la promoción (7 de abril al 19 de julio de 2026).
          La condición de afiliado debe estar activa al momento del cierre del concurso para ser
          considerado elegible.
        </Section>

        <Section title="7. Selección del ganador">
          Se seleccionarán los participantes que acumulen el mínimo de 60 puntos y cumplan los requisitos
          de elegibilidad. Entre ellos, con la base de datos, se realizará un sorteo aleatorio de forma
          electrónica para elegir al ganador del premio. La decisión del sorteo es definitiva e inapelable.
        </Section>

        <Section title="8. Premios">
          Se sortearán los siguientes premios entre los participantes elegibles:
          <ul style={{ margin: "10px 0 0 16px", padding: 0, lineHeight: 2 }}>
            <li><strong>1.er lugar:</strong> Sofá reclinable</li>
            <li><strong>2.do lugar:</strong> Smart TV 70&quot; Samsung</li>
            <li><strong>3.er lugar:</strong> Camiseta oficial y balón del Mundial 2026</li>
          </ul>
          Los premios no son negociables ni canjeables por dinero en efectivo y tampoco son transferibles
          a terceras personas. La Cooperativa se reserva el derecho de modificar los premios según la
          cantidad de participantes registrados, comunicando cualquier cambio por canales oficiales.
        </Section>

        <Section title="9. Vigencia">
          La promoción será válida durante todo el período del Mundial 2026, desde el{" "}
          <strong>martes 7 de abril</strong> hasta el <strong>domingo 19 de julio de 2026</strong>.
          Las predicciones deberán registrarse dentro de este período.
        </Section>

        <Section title="10. Restricciones y descalificación">
          El incumplimiento de cualquiera de las reglas establecidas implicará la descalificación
          automática del participante. La Cooperativa podrá descalificar a cualquier usuario que intente
          manipular el sistema, registre datos falsos o incurra en conductas que atenten contra la
          integridad del concurso.
        </Section>

        <Section title="11. Privacidad y uso de datos">
          Los datos personales suministrados durante el registro serán tratados de conformidad con la
          normativa aplicable en materia de protección de datos vigente en Honduras. La información será
          utilizada exclusivamente para la gestión del concurso y la comunicación de resultados.
          La Cooperativa no compartirá los datos con terceros ajenos al desarrollo de la promoción.
        </Section>

        <Section title="12. Aceptación de condiciones">
          La participación en la promoción implica la aceptación total de estos términos y condiciones.
          La Cooperativa se reserva el derecho de modificarlos en cualquier momento, comunicando los
          cambios a través de sus canales oficiales. Cualquier consulta deberá dirigirse a{" "}
          <a
            href="mailto:comunicacionvisualchorotega@gmail.com"
            style={{ color: "var(--ch-blue)", fontWeight: "600" }}
          >
            comunicacionvisualchorotega@gmail.com
          </a>
          .
        </Section>

        {/* Pie */}
        <div style={{
          marginTop: "48px", paddingTop: "24px",
          borderTop: "1px solid var(--ch-border)",
          textAlign: "center",
          fontSize: "11px", color: "var(--ch-text-muted)",
          fontFamily: "'Inter', sans-serif", lineHeight: 1.8,
        }}>
          <p style={{ margin: "0 0 4px" }}>
            <strong style={{ color: "var(--ch-navy)" }}>Cooperativa de Ahorro y Crédito Chorotega</strong>
          </p>
          <p style={{ margin: 0 }}>
            Vigencia: 7 abril – 19 julio 2026 · Sujeto a modificaciones sin previo aviso
          </p>
        </div>
      </div>
    </div>
  );
}

/* ——————————————————————————————————————————
   Componente auxiliar: sección con título
——————————————————————————————————————————— */
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "16px", fontWeight: "800",
        color: "var(--ch-navy)", textTransform: "uppercase",
        letterSpacing: "0.6px", margin: "0 0 8px",
      }}>
        {title}
      </h2>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "14px", color: "#3a4a6b",
        lineHeight: 1.75, margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}
