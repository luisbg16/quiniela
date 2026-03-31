/**
 * Datos reales del sorteo oficial FIFA World Cup 2026
 * Realizado el 5 de diciembre de 2024 en Miami, Florida
 *
 * Equipos marcados "Por definir" = ganadores de repechajes
 * UEFA / intercontinentales (marzo 2026).
 */

export const GROUP_IDS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export const GROUPS_DATA = {
  A: {
    id: "A", title: "Grupo A", letra: "A",
    teams: [
      { nombre: "México",        bandera: "🇲🇽", logo: null },
      { nombre: "Corea del Sur", bandera: "🇰🇷", logo: null },
      { nombre: "Sudáfrica",     bandera: "🇿🇦", logo: null },
      { nombre: "DEN/MKD/CZE/IRL",   bandera: "🏳️",  logo: null },
    ],
  },
  B: {
    id: "B", title: "Grupo B", letra: "B",
    teams: [
      { nombre: "Canadá",      bandera: "🇨🇦", logo: null },
      { nombre: "Suiza",       bandera: "🇨🇭", logo: null },
      { nombre: "Qatar",       bandera: "🇶🇦", logo: null },
      { nombre: "ITA/NIR/WAL/BIH", bandera: "🏳️",  logo: null },
    ],
  },
  C: {
    id: "C", title: "Grupo C", letra: "C",
    teams: [
      { nombre: "Brasil",    bandera: "🇧🇷",   logo: null },
      { nombre: "Marruecos", bandera: "🇲🇦",   logo: null },
      { nombre: "Escocia",   bandera: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", logo: null },
      { nombre: "Haití",     bandera: "🇭🇹",   logo: null },
    ],
  },
  D: {
    id: "D", title: "Grupo D", letra: "D",
    teams: [
      { nombre: "USA",         bandera: "🇺🇸", logo: null },
      { nombre: "Paraguay",    bandera: "🇵🇾", logo: null },
      { nombre: "Australia",   bandera: "🇦🇺", logo: null },
      { nombre: "TUR/ROU/SVK/KOS", bandera: "🏳️",  logo: null },
    ],
  },
  E: {
    id: "E", title: "Grupo E", letra: "E",
    teams: [
      { nombre: "Alemania",        bandera: "🇩🇪", logo: null },
      { nombre: "Ecuador",         bandera: "🇪🇨", logo: null },
      { nombre: "Costa de Marfil", bandera: "🇨🇮", logo: null },
      { nombre: "Curazao",         bandera: "🇨🇼", logo: null },
    ],
  },
  F: {
    id: "F", title: "Grupo F", letra: "F",
    teams: [
      { nombre: "Países Bajos", bandera: "🇳🇱", logo: null },
      { nombre: "Japón",        bandera: "🇯🇵", logo: null },
      { nombre: "Túnez",        bandera: "🇹🇳", logo: null },
      { nombre: "UKR/SWE/POL/ALB",  bandera: "🏳️",  logo: null },
    ],
  },
  G: {
    id: "G", title: "Grupo G", letra: "G",
    teams: [
      { nombre: "Bélgica",       bandera: "🇧🇪", logo: null },
      { nombre: "Egipto",        bandera: "🇪🇬", logo: null },
      { nombre: "Irán",          bandera: "🇮🇷", logo: null },
      { nombre: "Nueva Zelanda", bandera: "🇳🇿", logo: null },
    ],
  },
  H: {
    id: "H", title: "Grupo H", letra: "H",
    teams: [
      { nombre: "España",         bandera: "🇪🇸", logo: null },
      { nombre: "Arabia Saudita", bandera: "🇸🇦", logo: null },
      { nombre: "Uruguay",        bandera: "🇺🇾", logo: null },
      { nombre: "Cabo Verde",     bandera: "🇨🇻", logo: null },
    ],
  },
  I: {
    id: "I", title: "Grupo I", letra: "I",
    teams: [
      { nombre: "Francia",     bandera: "🇫🇷", logo: null },
      { nombre: "Senegal",     bandera: "🇸🇳", logo: null },
      { nombre: "Noruega",     bandera: "🇳🇴", logo: null },
      { nombre: "BOL/SUR/IRQ", bandera: "🏳️",  logo: null },
    ],
  },
  J: {
    id: "J", title: "Grupo J", letra: "J",
    teams: [
      { nombre: "Argentina", bandera: "🇦🇷", logo: null },
      { nombre: "Argelia",   bandera: "🇩🇿", logo: null },
      { nombre: "Austria",   bandera: "🇦🇹", logo: null },
      { nombre: "Jordania",  bandera: "🇯🇴", logo: null },
    ],
  },
  K: {
    id: "K", title: "Grupo K", letra: "K",
    teams: [
      { nombre: "Colombia",    bandera: "🇨🇴", logo: null },
      { nombre: "Portugal",    bandera: "🇵🇹", logo: null },
      { nombre: "Uzbekistán",  bandera: "🇺🇿", logo: null },
      { nombre: "NCL/JAM/CODr", bandera: "🏳️",  logo: null },
    ],
  },
  L: {
    id: "L", title: "Grupo L", letra: "L",
    teams: [
      { nombre: "Inglaterra", bandera: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: null },
      { nombre: "Croacia",    bandera: "🇭🇷",   logo: null },
      { nombre: "Panamá",     bandera: "🇵🇦",   logo: null },
      { nombre: "Ghana",      bandera: "🇬🇭",   logo: null },
    ],
  },
};

export const createInitialPredictions = () =>
  Object.fromEntries(GROUP_IDS.map((id) => [id, { 0: null, 1: null, 2: null }]));

export const getQualifierName = (predictions, groupId, positionIdx) => {
  const pred = predictions[groupId];
  if (!pred || pred[positionIdx] === null || pred[positionIdx] === undefined) return null;
  const team = GROUPS_DATA[groupId].teams[pred[positionIdx]];
  return team ? team.nombre : null;
};
export const LEFT_BRACKET_GROUPS  = ["A","B","C","D","E","F"];
export const RIGHT_BRACKET_GROUPS = ["G","H","I","J","K","L"];
