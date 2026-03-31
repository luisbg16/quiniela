/**
 * Calcula la tabla de posiciones de un grupo a partir de
 * los marcadores predichos por el usuario.
 *
 * @param {Array}  groupMatches     – Partidos del grupo (del WC2026_MATCHES)
 * @param {Object} scorePredictions – { [matchId]: { home, away } }
 * @returns {Array} – [{ nombre, pts, gf, ga, gd, played }, ...] ordenado por pts→gd→gf
 */
export function computeStandings(groupMatches, scorePredictions) {
  const stats = {};

  // Inicializar todos los equipos del grupo
  groupMatches.forEach((m) => {
    [m.local?.nombre, m.visitante?.nombre].forEach((n) => {
      if (n && !stats[n]) stats[n] = { pts: 0, gf: 0, ga: 0, gd: 0, played: 0 };
    });
  });

  // Acumular resultados de partidos con predicción
  groupMatches.forEach((m) => {
    const pred = scorePredictions[m.id];
    const h    = m.local?.nombre;
    const a    = m.visitante?.nombre;

    if (
      !pred ||
      pred.home === null || pred.home === undefined ||
      pred.away === null || pred.away === undefined ||
      !h || !a || !stats[h] || !stats[a]
    ) return;

    const hg = Number(pred.home);
    const ag = Number(pred.away);

    stats[h].played++; stats[h].gf += hg; stats[h].ga += ag; stats[h].gd += (hg - ag);
    stats[a].played++; stats[a].gf += ag; stats[a].ga += hg; stats[a].gd += (ag - hg);

    if      (hg > ag)  stats[h].pts += 3;
    else if (hg === ag) { stats[h].pts += 1; stats[a].pts += 1; }
    else               stats[a].pts += 3;
  });

  return Object.entries(stats)
    .map(([nombre, s]) => ({ nombre, ...s }))
    .sort((a, b) =>
      b.pts - a.pts ||
      b.gd  - a.gd  ||
      b.gf  - a.gf  ||
      a.nombre.localeCompare(b.nombre),   // desempate alfabético determinístico
    );
}
