/**
 * ================================================================
 * SERVICIO API — MUNDIAL FIFA 2026
 *
 * FUENTE PRIMARIA (sin configuración):
 *   Datos locales reales del sorteo oficial (diciembre 2024)
 *   → Grupos, equipos y calendario de los 72 partidos de fase de grupos
 *
 * FUENTE SECUNDARIA (opcional, requiere API key):
 *   football-data.org  Tier 1 — GRATIS
 *   → Escudos de equipos y marcadores en vivo una vez inicie el torneo
 *   1. Crear cuenta en https://www.football-data.org/client/register
 *   2. Crear .env.local en la raíz del proyecto:
 *        VITE_WC_API_KEY=tu_api_key_aqui
 *
 * ================================================================
 */

import { GROUPS_DATA } from "../data/groups";
import { WC2026_MATCHES } from "../data/wc2026matches";

// ——— football-data.org (opcional) ———
const FOOTBALLDATA_BASE = "https://api.football-data.org/v4";
const WC_CODE = "WC";

function getFDHeaders() {
  const key = import.meta.env.VITE_WC_API_KEY;
  if (!key) throw new Error("VITE_WC_API_KEY no configurada");
  return { "X-Auth-Token": key };
}

function parseFDGroupLetter(groupStr) {
  if (!groupStr) return null;
  const clean = groupStr.replace(/GROUP_|Group /gi, "").trim();
  return clean.length <= 2 ? clean.toUpperCase() : null;
}

function mapFDStandings(standings) {
  const groups = {};
  standings
    .filter((s) => s.stage === "GROUP_STAGE" && s.type === "TOTAL")
    .forEach((s) => {
      const letter = parseFDGroupLetter(s.group);
      if (!letter) return;
      groups[letter] = s.table.map((row) => ({
        apiId: row.team.id,
        logo: row.team.crest || null,
      }));
    });
  return groups;
}

// ================================================================
// API PÚBLICA
// ================================================================

/**
 * Retorna los grupos del WC 2026 con equipos reales.
 * Opcionalmente enriquece con escudos de football-data.org.
 */
export async function fetchWorldCupGroups() {
  // Clonar datos locales para no mutar el original
  const groups = {};
  Object.entries(GROUPS_DATA).forEach(([letter, g]) => {
    groups[letter] = {
      ...g,
      teams: g.teams.map((t) => ({ ...t })),
    };
  });

  // Enriquecer con escudos si hay API key
  if (hasApiKey()) {
    try {
      const res = await fetch(
        `${FOOTBALLDATA_BASE}/competitions/${WC_CODE}/standings?season=2026`,
        { headers: getFDHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        const fdGroups = mapFDStandings(data.standings || []);
        Object.entries(fdGroups).forEach(([letter, fdTeams]) => {
          if (groups[letter]) {
            groups[letter].teams = groups[letter].teams.map((t, i) => ({
              ...t,
              logo: fdTeams[i]?.logo || null,
              apiId: fdTeams[i]?.apiId || null,
            }));
          }
        });
      }
    } catch {
      // Silencioso — continúa con datos base
    }
  }

  return groups;
}

/**
 * Retorna todos los partidos de la fase de grupos.
 * Opcionalmente enriquece con escudos de football-data.org.
 */
export async function fetchWorldCupMatches() {
  // Clonar lista local
  let matches = WC2026_MATCHES.map((m) => ({ ...m }));

  // Enriquecer con escudos si hay API key
  if (hasApiKey()) {
    try {
      const res = await fetch(
        `${FOOTBALLDATA_BASE}/competitions/${WC_CODE}/matches?season=2026&stage=GROUP_STAGE`,
        { headers: getFDHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        const fdMatches = (data.matches || []).filter(
          (m) => m.homeTeam?.name && m.awayTeam?.name
        );
        matches = matches.map((m, i) => {
          const fd = fdMatches[i];
          if (!fd) return m;
          return {
            ...m,
            local:     { ...m.local,     logo: fd.homeTeam?.crest || null },
            visitante: { ...m.visitante, logo: fd.awayTeam?.crest || null },
            estadio:   fd.venue || m.estadio,
            estado:    fd.status || m.estado,
            resultado: fd.score?.fullTime
              ? { home: fd.score.fullTime.home, away: fd.score.fullTime.away }
              : null,
          };
        });
      }
    } catch {
      // Silencioso
    }
  }

  return matches;
}

/**
 * Verifica si la API key de football-data.org está configurada.
 */
export function hasApiKey() {
  return Boolean(import.meta.env.VITE_WC_API_KEY);
}
