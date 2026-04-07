import { useState, useEffect, useCallback, useRef } from "react";
import { quiniela as quinielaApi, auth, loadTokenFromStorage, touchActivity, INACTIVITY_MS } from "./services/api.js";
import Navbar from "./components/Navbar";
import ResultsBar from "./components/ResultsBar";
import Hero from "./components/Hero";
import AuthModal from "./components/AuthModal";
import CalendarioPage from "./components/CalendarioPage";
import CondicionesPage from "./components/CondicionesPage";
import AdminPage from "./components/AdminPage";
import TablaPage from "./components/TablaPage";
import ResultadosGruposPage from "./components/ResultadosGruposPage";
import SimulacionPage from "./components/SimulacionPage";
import WelcomePopup from "./components/WelcomePopup";
import Footer from "./components/Footer";
import { GROUPS_DATA, GROUP_IDS } from "./data/groups";
import { fetchWorldCupGroups, fetchWorldCupMatches } from "./services/worldCupApi";
import { getFlagUrl } from "./data/flags.js";

const PLACEHOLDER_MATCHES = [];

// ── Routing basado en hash ────────────────────────────────────────────────────
// Soporta URLs tipo /#predicciones, /#resultados, etc.
// No requiere configuración de servidor y funciona en Vercel/Netlify/GitHub Pages.
const VALID_PAGES = new Set(["home", "predicciones", "simulacion", "resultados", "tabla", "condiciones", "admin"]);

function getPageFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, "").trim();
  return VALID_PAGES.has(hash) ? hash : "home";
}

export default function App() {
  const [groupsData,  setGroupsData]  = useState(GROUPS_DATA);
  const [matchesData, setMatchesData] = useState(PLACEHOLDER_MATCHES);

  // Página activa derivada del hash de la URL
  const [activePage, setActivePage] = useState(getPageFromHash);

  const [currentUser,   setCurrentUser]   = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedOk,       setSavedOk]       = useState(false);
  const [saveError,     setSaveError]     = useState("");

  // Predicciones de marcadores { [matchId]: { home, away } }
  const [scorePredictions, setScorePredictions] = useState({});

  // Modo sólo lectura: true cuando hay quiniela guardada cargada
  const [readOnly, setReadOnly] = useState(false);

  // Popup de bienvenida — solo la primera visita (se guarda en localStorage)
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !localStorage.getItem("ch_visited"); } catch { return true; }
  });

  // Abrir modal automáticamente si la URL tiene #reset?token=xxxx
  useEffect(() => {
    if (window.location.hash.startsWith("#reset")) {
      setShowAuthModal(true);
    }
  }, []);

  // ── Escuchar cambios de hash (botones atrás/adelante del navegador) ──────────
  const ignoreHashChange = useRef(false);
  useEffect(() => {
    const onHashChange = () => {
      if (ignoreHashChange.current) { ignoreHashChange.current = false; return; }
      const page = getPageFromHash();
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // ── Restaurar sesión al recargar + auto-logout por inactividad ───────────────
  useEffect(() => {
    // 1. Intentar recuperar token guardado
    const savedToken = loadTokenFromStorage();
    if (savedToken) {
      // Token válido y dentro del período de inactividad → recuperar perfil
      auth.me()
        .then((data) => {
          setCurrentUser(data.usuario);
          loadSavedQuiniela();
        })
        .catch(() => {
          // Token inválido o expirado en el servidor → limpiar
          auth.logout();
          setCurrentUser(null);
        });
    }

    // 2. Detectar actividad del usuario para resetear el timer
    const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const onActivity = () => touchActivity();
    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    // 3. Verificar inactividad cada minuto
    const interval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem("ch_last_activity") || "0", 10);
      if (lastActivity && (Date.now() - lastActivity) >= INACTIVITY_MS) {
        // Sesión expirada por inactividad
        auth.logout();
        setCurrentUser(null);
        setScorePredictions({});
        setSavedOk(false);
        setSaveError("");
        setReadOnly(false);
      }
    }, 60_000); // revisar cada 60 segundos

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— Cargar datos del Mundial ———
  useEffect(() => {
    Promise.allSettled([
      fetchWorldCupGroups(),
      fetchWorldCupMatches(),
    ]).then(([groupsResult, matchesResult]) => {
      if (groupsResult.status === "fulfilled") setGroupsData(groupsResult.value);
      else console.warn("[Quiniela] Error grupos:", groupsResult.reason?.message);
      if (matchesResult.status === "fulfilled" && matchesResult.value.length > 0) {
        setMatchesData(matchesResult.value);
      }
    });
  }, []);

  // ——— Cargar quiniela guardada (solo marcadores) ———
  const loadSavedQuiniela = useCallback(async () => {
    try {
      const data = await quinielaApi.obtener();
      const p = data?.quiniela?.predicciones;
      if (!p) return;
      if (p.scores) setScorePredictions(p.scores);
      setReadOnly(true);
      setSavedOk(true);
    } catch {
      // Sin quiniela guardada — normal en primer ingreso
    }
  }, []);

  // ——— Guardar quiniela ———
  const handleSave = useCallback(async () => {
    if (!currentUser) { setShowAuthModal(true); return; }
    setSaveError("");
    try {
      await quinielaApi.guardar({ scores: scorePredictions });
      setSavedOk(true);
      setReadOnly(true);
    } catch (e) {
      setSaveError(e.message || "Error al guardar. Intentá de nuevo.");
    }
  }, [currentUser, scorePredictions]);

  const handleScoreChange = useCallback((matchId, scores) => {
    setScorePredictions((prev) => ({ ...prev, [matchId]: scores }));
  }, []);

  const handleNavigate = useCallback((page) => {
    const target = VALID_PAGES.has(page) ? page : "home";
    // Actualizar hash sin disparar el listener (ya estamos manejando el estado)
    ignoreHashChange.current = true;
    window.location.hash = target === "home" ? "" : target;
    setActivePage(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCloseWelcome = () => {
    try { localStorage.setItem("ch_visited", "1"); } catch { /* incognito */ }
    setShowWelcome(false);
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    setScorePredictions({});
    setSavedOk(false);
    setSaveError("");
    setReadOnly(false);
    handleNavigate("home");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ch-bg)", color: "var(--ch-text)" }}>
      {/* ——— POPUP DE BIENVENIDA ——— */}
      {showWelcome && <WelcomePopup onClose={handleCloseWelcome} />}

      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogin={() => setShowAuthModal(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* ——— PREDICCIONES (marcadores que cuentan para la quiniela) ——— */}
      {activePage === "predicciones" && (
        <CalendarioPage
          matches={matchesData}
          onBack={() => handleNavigate("home")}
          scorePredictions={scorePredictions}
          onScoreChange={handleScoreChange}
          onSave={handleSave}
          currentUser={currentUser}
          onLogin={() => setShowAuthModal(true)}
          savedOk={savedOk}
          saveError={saveError}
          onDismissSaved={() => setSavedOk(false)}
          readOnly={readOnly}
          onModify={() => { setReadOnly(false); setSavedOk(false); setSaveError(""); }}

        />
      )}

      {/* ——— SIMULACIÓN ——— */}
      {activePage === "simulacion" && (
        <SimulacionPage groupsData={groupsData} />
      )}

      {/* ——— RESULTADOS DE GRUPOS ——— */}
      {activePage === "resultados" && (
        <ResultadosGruposPage />
      )}

      {/* ——— TABLA DE POSICIONES ——— */}
      {activePage === "tabla" && (
        <TablaPage isAdmin={!!currentUser?.esAdmin} />
      )}

      {/* ——— CONDICIONES ——— */}
      {activePage === "condiciones" && (
        <CondicionesPage onBack={() => handleNavigate("home")} />
      )}

      {/* ——— ADMIN ——— */}
      {activePage === "admin" && currentUser?.esAdmin && (
        <AdminPage />
      )}

      {/* ——— HOME ——— */}
      {activePage === "home" && (
        <>
          <ResultsBar matches={matchesData} />
          <Hero />

          <main style={{ maxWidth: "1440px", margin: "0 auto", padding: "36px 28px 48px" }} className="page-padding">

            {/* CTA para participar */}
            <div className="home-cta">
              <div>
                <div style={{ fontFamily: "'Boldonse', cursive", fontSize: "20px", color: "#f5c200", textTransform: "uppercase" }}>
                  ¡Participa en La Jugada Ganadora Chorotega!
                </div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", fontFamily: "'Inter', sans-serif", marginTop: "6px" }}>
                  Predice los marcadores de la Copa Mundial de la FIFA 2026 y y gana puntos por cada acierto.
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate("predicciones")}
                className="home-cta-btn"
              >
                Ir a Predicciones →
              </button>
            </div>

            {/* Grupos del Mundial */}
            <HomeGroupsGrid groupsData={groupsData} />

          </main>

          <Footer />
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
          loadSavedQuiniela();
        }}
      />
    </div>
  );
}

// ——— Grilla de grupos solo lectura ———
function HomeGroupsGrid({ groupsData }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ width: "4px", height: "32px", background: "#f5c200", borderRadius: "2px", flexShrink: 0 }} />
        <h2 style={{ fontFamily: "'Boldonse', cursive", fontSize: "22px", color: "#003080", margin: 0, textTransform: "uppercase" }}>
          Fase de Grupos
        </h2>
      </div>

      <div className="grupos-home-inner">
        {GROUP_IDS.map((id) => {
          const group = groupsData[id] ?? GROUPS_DATA[id];
          if (!group) return null;
          return (
            <div key={id} style={{
              background: "white", borderRadius: "12px",
              border: "1px solid var(--ch-border)",
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(10,36,100,0.06)",
            }}>
              {/* Cabecera del grupo */}
              <div style={{
                background: "#003080", color: "#f5c200",
                padding: "8px 14px",
                fontFamily: "'Boldonse', cursive", fontSize: "13px",
                textTransform: "uppercase", letterSpacing: "1px",
              }}>
                {group.title ?? `Grupo ${id}`}
              </div>
              {/* Equipos */}
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {(group.teams ?? []).map((team) => (
                  <div key={team.nombre} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "4px 6px", borderRadius: "6px",
                  }}>
                    <img
                      src={getFlagUrl(team.nombre, 15)}
                      alt={team.nombre}
                      style={{ width: "22px", height: "15px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <span style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: "700", fontSize: "13px", color: "#003080",
                    }}>
                      {team.nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
