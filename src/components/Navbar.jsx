import { useState } from "react";
import logoNavBar from "../assets/logo_nav_bar.png";

// ── Icono hamburguesa ──────────────────────────────────────────────
function HamburgerIcon({ open }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
      {open ? (
        // X de cierre
        <>
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </>
      ) : (
        // Tres rayas
        <>
          <line x1="3" y1="7"  x2="21" y2="7"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </>
      )}
    </svg>
  );
}

export default function Navbar({ onLogin, onNavigate, activePage, currentUser, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { key: "resultados",   label: "Resultados" },
    { key: "predicciones", label: "Predicciones" },
    { key: "simulacion",   label: "Simulación" },
    { key: "tabla",        label: "Tabla" },
    { key: "condiciones",  label: "Condiciones" },
  ];

  const showAdmin = currentUser?.esAdmin === true;

  const handleNav = (page) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <header style={{
      background: "#005aba", color: "white",
      boxShadow: "0 2px 12px rgba(0,48,128,0.25)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: "1440px", margin: "0 auto", padding: "0 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center", height: "68px",
        position: "relative",
      }}>

        {/* Logo */}
        <button type="button" onClick={() => handleNav("home")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <img src={logoNavBar} alt="Cooperativa Chorotega · Mundial 2026"
            style={{ height: "44px", width: "auto", objectFit: "contain", display: "block" }} />
        </button>

        {/* ── Navegación desktop ── */}
        <nav className="nav-desktop">
          {navItems.map(({ key, label }) => (
            <button key={key} type="button" className="nav-link"
              onClick={() => handleNav(key)}
              style={{
                borderBottom: activePage === key
                  ? "2px solid rgba(255,255,255,0.85)"
                  : "2px solid transparent",
              }}>
              {label}
            </button>
          ))}

          {showAdmin && (
            <button type="button" className="nav-link"
              onClick={() => handleNav("admin")}
              style={{
                background: activePage === "admin" ? "rgba(245,194,0,0.2)" : "rgba(255,255,255,0.08)",
                borderRadius: "6px", marginLeft: "4px",
                border: `1.5px solid ${activePage === "admin" ? "rgba(245,194,0,0.7)" : "rgba(255,255,255,0.2)"}`,
                color: "#f5c200",
              }}>
              Admin
            </button>
          )}

          <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.25)", margin: "0 8px" }} />

          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  border: "2px solid rgba(255,255,255,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: "700",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: "white", flexShrink: 0,
                }}>
                  {currentUser.nombre?.charAt(0).toUpperCase()}
                </div>
                <span style={{
                  fontSize: "13px", fontWeight: "700",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: "white", letterSpacing: "0.3px",
                  maxWidth: "140px", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {currentUser.nombre}
                </span>
              </div>
              <button type="button" onClick={onLogout} style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "6px", color: "rgba(255,255,255,0.8)",
                padding: "4px 10px", cursor: "pointer",
                fontSize: "11px", fontWeight: "700",
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.3px",
              }}>
                Salir
              </button>
            </div>
          ) : (
            <button type="button" className="btn-login" onClick={onLogin}>
              Ingresar
            </button>
          )}
        </nav>

        {/* ── Botón hamburguesa (solo móvil) ── */}
        <button
          type="button"
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          <HamburgerIcon open={menuOpen} />
        </button>
      </div>

      {/* ── Menú desplegable móvil ── */}
      <nav className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {/* Sección principal de nav */}
        {navItems.map(({ key, label }) => (
          <button key={key} type="button" className="nav-link"
            onClick={() => handleNav(key)}
            style={{
              background: activePage === key ? "rgba(255,255,255,0.1)" : "transparent",
              borderLeft: activePage === key ? "3px solid #f5c200" : "3px solid transparent",
              paddingLeft: "21px",
            }}>
            {label}
          </button>
        ))}

        {showAdmin && (
          <button type="button" className="nav-link"
            onClick={() => handleNav("admin")}
            style={{ color: "#f5c200", paddingLeft: "24px" }}>
            ⚙ Admin
          </button>
        )}

        {/* Divisor */}
        <div className="mobile-divider" />

        {/* Usuario / Login */}
        {currentUser ? (
          <div className="mobile-user-bar">
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", fontWeight: "700",
              fontFamily: "'Barlow Condensed', sans-serif",
              color: "white", flexShrink: 0,
            }}>
              {currentUser.nombre?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "white",
                fontFamily: "'Barlow Condensed', sans-serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.nombre} {currentUser.apellido}
              </div>
              {currentUser.esAfiliado && (
                <div style={{ fontSize: "10px", color: "#a5d6a7", fontWeight: "700",
                  fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.5px" }}>
                  ✓ Afiliado activo
                </div>
              )}
            </div>
            <button type="button" onClick={() => { onLogout(); setMenuOpen(false); }}
              style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "6px", color: "rgba(255,255,255,0.8)",
                padding: "6px 14px", cursor: "pointer",
                fontSize: "12px", fontWeight: "700",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
              Salir
            </button>
          </div>
        ) : (
          <div style={{ padding: "8px 24px" }}>
            <button type="button" className="btn-login"
              onClick={() => { onLogin(); setMenuOpen(false); }}
              style={{ width: "100%", padding: "12px", fontSize: "15px", borderRadius: "8px" }}>
              Ingresar / Registrarse
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
