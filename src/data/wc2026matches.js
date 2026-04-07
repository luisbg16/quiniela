/**
 * Calendario FIFA World Cup 2026 — Fase de grupos
 * Fuente: FIFA / NBC Sports / MLS Soccer (calendario oficial actualizado)
 * Horas en ET (Eastern Time, zona de Costa Rica = ET - 1h)
 *
 * Grupos completos — todos los equipos confirmados (abril 2026).
 */

const m = (id, grupo, fecha, hora, local, banLocal, visitante, banVisitante, estadio) => ({
  id,
  grupo,
  fecha,
  hora,
  local:     { nombre: local,     bandera: banLocal,     logo: null },
  visitante: { nombre: visitante, bandera: banVisitante, logo: null },
  estadio,
  estado: "SCHEDULED",
  resultado: null,
});

// =====================================================================
// MATCHDAY 1
// =====================================================================
const MATCHDAY_1 = [
  // Jun 11
  m(1,  "Grupo A", "Jun 11, 2026", "3:00 PM ET",  "México",        "🇲🇽",   "Sudáfrica",     "🇿🇦",   "Estadio Azteca, Ciudad de México"),
  m(2,  "Grupo A", "Jun 11, 2026", "10:00 PM ET", "Corea del Sur", "🇰🇷",   "Chequia",   "🇨🇿",    "Estadio Akron, Zapopan"),

  // Jun 12
  m(3,  "Grupo B", "Jun 12, 2026", "3:00 PM ET",  "Canadá",        "🇨🇦",   "Bosnia y Herzegovina",   "🇧🇦",    "BMO Field, Toronto"),
  m(4,  "Grupo D", "Jun 12, 2026", "9:00 PM ET",  "USA",           "🇺🇸",   "Paraguay",      "🇵🇾",   "SoFi Stadium, Los Ángeles"),

  // Jun 13
  m(5,  "Grupo B", "Jun 13, 2026", "3:00 PM ET",  "Qatar",         "🇶🇦",   "Suiza",         "🇨🇭",   "Levi's Stadium, Santa Clara"),
  m(6,  "Grupo C", "Jun 13, 2026", "6:00 PM ET",  "Brasil",        "🇧🇷",   "Marruecos",     "🇲🇦",   "MetLife Stadium, Nueva Jersey"),
  m(7,  "Grupo C", "Jun 13, 2026", "9:00 PM ET",  "Haití",         "🇭🇹",   "Escocia",       "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Gillette Stadium, Boston"),

  // Jun 14
  m(8,  "Grupo E", "Jun 14, 2026", "3:00 PM ET",  "Alemania",      "🇩🇪",   "Curazao",       "🇨🇼",   "Arrowhead Stadium, Kansas City"),
  m(9,  "Grupo F", "Jun 14, 2026", "6:00 PM ET",  "Países Bajos",  "🇳🇱",   "Japón",         "🇯🇵",   "AT&T Stadium, Dallas"),
  m(10, "Grupo D", "Jun 14, 2026", "9:00 PM ET",  "Australia",     "🇦🇺",   "Türkiye",   "🇹🇷",    "Lincoln Financial Field, Filadelfia"),

  // Jun 15
  m(11, "Grupo G", "Jun 15, 2026", "3:00 PM ET",  "Irán",          "🇮🇷",   "Nueva Zelanda", "🇳🇿",   "Levi's Stadium, Santa Clara"),
  m(12, "Grupo H", "Jun 15, 2026", "6:00 PM ET",  "España",        "🇪🇸",   "Cabo Verde",    "🇨🇻",   "Rose Bowl, Los Ángeles"),
  m(13, "Grupo E", "Jun 15, 2026", "9:00 PM ET",  "Ecuador",       "🇪🇨",   "Costa de Marfil","🇨🇮",  "SoFi Stadium, Los Ángeles"),

  // Jun 16
  m(14, "Grupo F", "Jun 16, 2026", "12:00 PM ET", "Túnez",         "🇹🇳",   "Suecia",   "🇸🇪",    "Hard Rock Stadium, Miami"),
  m(15, "Grupo G", "Jun 16, 2026", "3:00 PM ET",  "Bélgica",       "🇧🇪",   "Egipto",        "🇪🇬",   "NRG Stadium, Houston"),
  m(16, "Grupo J", "Jun 16, 2026", "6:00 PM ET",  "Argentina",     "🇦🇷",   "Argelia",       "🇩🇿",   "MetLife Stadium, Nueva Jersey"),
  m(17, "Grupo H", "Jun 16, 2026", "9:00 PM ET",  "Arabia Saudita","🇸🇦",   "Uruguay",       "🇺🇾",   "Arrowhead Stadium, Kansas City"),

  // Jun 17
  m(18, "Grupo I", "Jun 17, 2026", "12:00 PM ET", "Francia",       "🇫🇷",   "Senegal",       "🇸🇳",   "Lincoln Financial Field, Filadelfia"),
  m(19, "Grupo K", "Jun 17, 2026", "1:00 PM ET",  "Portugal",      "🇵🇹",   "RD Congo",   "🇨🇩",    "NRG Stadium, Houston"),
  m(20, "Grupo L", "Jun 17, 2026", "4:00 PM ET",  "Inglaterra",    "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia",       "🇭🇷",   "AT&T Stadium, Dallas"),
  m(21, "Grupo J", "Jun 17, 2026", "6:00 PM ET",  "Austria",       "🇦🇹",   "Jordania",      "🇯🇴",   "Rose Bowl, Los Ángeles"),
  m(22, "Grupo L", "Jun 17, 2026", "7:00 PM ET",  "Ghana",         "🇬🇭",   "Panamá",        "🇵🇦",   "BMO Field, Toronto"),
  m(23, "Grupo I", "Jun 17, 2026", "9:00 PM ET",  "Noruega",       "🇳🇴",   "Irak",   "🇮🇶",    "Gillette Stadium, Boston"),
  m(24, "Grupo K", "Jun 17, 2026", "10:00 PM ET", "Colombia",      "🇨🇴",   "Uzbekistán",    "🇺🇿",   "Estadio Azteca, Ciudad de México"),
];

// =====================================================================
// MATCHDAY 2
// =====================================================================
const MATCHDAY_2 = [
  // Jun 19
  m(25, "Grupo A", "Jun 19, 2026", "3:00 PM ET",  "México",        "🇲🇽",   "Corea del Sur", "🇰🇷",   "Rose Bowl, Los Ángeles"),
  m(26, "Grupo B", "Jun 19, 2026", "6:00 PM ET",  "Suiza",         "🇨🇭",   "Bosnia y Herzegovina",   "🇧🇦",    "Hard Rock Stadium, Miami"),
  m(27, "Grupo C", "Jun 19, 2026", "9:00 PM ET",  "Brasil",        "🇧🇷",   "Haití",         "🇭🇹",   "Lincoln Financial Field, Filadelfia"),

  // Jun 20
  m(28, "Grupo D", "Jun 20, 2026", "3:00 PM ET",  "USA",           "🇺🇸",   "Türkiye",   "🇹🇷",    "Levi's Stadium, Santa Clara"),
  m(29, "Grupo A", "Jun 20, 2026", "6:00 PM ET",  "Sudáfrica",     "🇿🇦",   "Chequia",   "🇨🇿",    "SoFi Stadium, Los Ángeles"),
  m(30, "Grupo C", "Jun 20, 2026", "9:00 PM ET",  "Marruecos",     "🇲🇦",   "Escocia",       "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "AT&T Stadium, Dallas"),

  // Jun 21
  m(31, "Grupo E", "Jun 21, 2026", "3:00 PM ET",  "Alemania",      "🇩🇪",   "Costa de Marfil","🇨🇮",  "NRG Stadium, Houston"),
  m(32, "Grupo F", "Jun 21, 2026", "6:00 PM ET",  "Japón",         "🇯🇵",   "Túnez",         "🇹🇳",   "Gillette Stadium, Boston"),
  m(33, "Grupo B", "Jun 21, 2026", "9:00 PM ET",  "Canadá",        "🇨🇦",   "Qatar",         "🇶🇦",   "BMO Field, Toronto"),

  // Jun 22
  m(34, "Grupo G", "Jun 22, 2026", "3:00 PM ET",  "Bélgica",       "🇧🇪",   "Nueva Zelanda", "🇳🇿",   "MetLife Stadium, Nueva Jersey"),
  m(35, "Grupo H", "Jun 22, 2026", "6:00 PM ET",  "España",        "🇪🇸",   "Arabia Saudita","🇸🇦",   "Arrowhead Stadium, Kansas City"),
  m(36, "Grupo D", "Jun 22, 2026", "9:00 PM ET",  "Paraguay",      "🇵🇾",   "Australia",     "🇦🇺",   "Estadio Azteca, Ciudad de México"),

  // Jun 23
  m(37, "Grupo I", "Jun 23, 2026", "3:00 PM ET",  "Francia",       "🇫🇷",   "Irak",   "🇮🇶",    "AT&T Stadium, Dallas"),
  m(38, "Grupo F", "Jun 23, 2026", "6:00 PM ET",  "Países Bajos",  "🇳🇱",   "Suecia",   "🇸🇪",    "Rose Bowl, Los Ángeles"),
  m(39, "Grupo G", "Jun 23, 2026", "9:00 PM ET",  "Egipto",        "🇪🇬",   "Irán",          "🇮🇷",   "Levi's Stadium, Santa Clara"),

  // Jun 24
  m(40, "Grupo H", "Jun 24, 2026", "3:00 PM ET",  "Uruguay",       "🇺🇾",   "Cabo Verde",    "🇨🇻",   "Lincoln Financial Field, Filadelfia"),
  m(41, "Grupo J", "Jun 24, 2026", "6:00 PM ET",  "Argentina",     "🇦🇷",   "Austria",       "🇦🇹",   "Hard Rock Stadium, Miami"),
  m(42, "Grupo E", "Jun 24, 2026", "9:00 PM ET",  "Ecuador",       "🇪🇨",   "Curazao",       "🇨🇼",   "BMO Field, Toronto"),

  // Jun 25
  m(43, "Grupo K", "Jun 25, 2026", "3:00 PM ET",  "Colombia",      "🇨🇴",   "RD Congo",   "🇨🇩",    "NRG Stadium, Houston"),
  m(44, "Grupo I", "Jun 25, 2026", "6:00 PM ET",  "Noruega",       "🇳🇴",   "Senegal",       "🇸🇳",   "Estadio Akron, Zapopan"),
  m(45, "Grupo J", "Jun 25, 2026", "9:00 PM ET",  "Jordania",      "🇯🇴",   "Argelia",       "🇩🇿",   "MetLife Stadium, Nueva Jersey"),

  // Jun 26
  m(46, "Grupo L", "Jun 26, 2026", "3:00 PM ET",  "Inglaterra",    "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Ghana",         "🇬🇭",   "SoFi Stadium, Los Ángeles"),
  m(47, "Grupo K", "Jun 26, 2026", "6:00 PM ET",  "Portugal",      "🇵🇹",   "Uzbekistán",    "🇺🇿",   "Gillette Stadium, Boston"),
  m(48, "Grupo L", "Jun 26, 2026", "9:00 PM ET",  "Croacia",       "🇭🇷",   "Panamá",        "🇵🇦",   "AT&T Stadium, Dallas"),
];

// =====================================================================
// MATCHDAY 3 (últimos de la fase de grupos — simultáneos)
// =====================================================================
const MATCHDAY_3 = [
  // Jun 27
  m(49, "Grupo A", "Jun 27, 2026", "3:00 PM ET",  "México",        "🇲🇽",   "Chequia",   "🇨🇿",    "Estadio Akron, Zapopan"),
  m(50, "Grupo A", "Jun 27, 2026", "3:00 PM ET",  "Sudáfrica",     "🇿🇦",   "Corea del Sur", "🇰🇷",   "Rose Bowl, Los Ángeles"),
  m(51, "Grupo B", "Jun 27, 2026", "6:00 PM ET",  "Canadá",        "🇨🇦",   "Suiza",         "🇨🇭",   "SoFi Stadium, Los Ángeles"),
  m(52, "Grupo B", "Jun 27, 2026", "6:00 PM ET",  "Qatar",         "🇶🇦",   "Bosnia y Herzegovina",   "🇧🇦",    "BMO Field, Toronto"),

  // Jun 28
  m(53, "Grupo C", "Jun 28, 2026", "3:00 PM ET",  "Brasil",        "🇧🇷",   "Escocia",       "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "MetLife Stadium, Nueva Jersey"),
  m(54, "Grupo C", "Jun 28, 2026", "3:00 PM ET",  "Marruecos",     "🇲🇦",   "Haití",         "🇭🇹",   "Gillette Stadium, Boston"),
  m(55, "Grupo D", "Jun 28, 2026", "6:00 PM ET",  "USA",           "🇺🇸",   "Australia",     "🇦🇺",   "AT&T Stadium, Dallas"),
  m(56, "Grupo D", "Jun 28, 2026", "6:00 PM ET",  "Paraguay",      "🇵🇾",   "Türkiye",   "🇹🇷",    "Lincoln Financial Field, Filadelfia"),

  // Jun 29
  m(57, "Grupo E", "Jun 29, 2026", "3:00 PM ET",  "Alemania",      "🇩🇪",   "Ecuador",       "🇪🇨",   "Hard Rock Stadium, Miami"),
  m(58, "Grupo E", "Jun 29, 2026", "3:00 PM ET",  "Costa de Marfil","🇨🇮",  "Curazao",       "🇨🇼",   "Estadio Azteca, Ciudad de México"),
  m(59, "Grupo F", "Jun 29, 2026", "6:00 PM ET",  "Países Bajos",  "🇳🇱",   "Túnez",         "🇹🇳",   "NRG Stadium, Houston"),
  m(60, "Grupo F", "Jun 29, 2026", "6:00 PM ET",  "Japón",         "🇯🇵",   "Suecia",   "🇸🇪",    "Arrowhead Stadium, Kansas City"),

  // Jun 30
  m(61, "Grupo G", "Jun 30, 2026", "3:00 PM ET",  "Bélgica",       "🇧🇪",   "Irán",          "🇮🇷",   "Levi's Stadium, Santa Clara"),
  m(62, "Grupo G", "Jun 30, 2026", "3:00 PM ET",  "Egipto",        "🇪🇬",   "Nueva Zelanda", "🇳🇿",   "SoFi Stadium, Los Ángeles"),
  m(63, "Grupo H", "Jun 30, 2026", "6:00 PM ET",  "España",        "🇪🇸",   "Uruguay",       "🇺🇾",   "Rose Bowl, Los Ángeles"),
  m(64, "Grupo H", "Jun 30, 2026", "6:00 PM ET",  "Arabia Saudita","🇸🇦",   "Cabo Verde",    "🇨🇻",   "MetLife Stadium, Nueva Jersey"),

  // Jul 1
  m(65, "Grupo I", "Jul 1, 2026",  "3:00 PM ET",  "Francia",       "🇫🇷",   "Noruega",       "🇳🇴",   "AT&T Stadium, Dallas"),
  m(66, "Grupo I", "Jul 1, 2026",  "3:00 PM ET",  "Senegal",       "🇸🇳",   "Irak",   "🇮🇶",    "Gillette Stadium, Boston"),
  m(67, "Grupo J", "Jul 1, 2026",  "6:00 PM ET",  "Argentina",     "🇦🇷",   "Jordania",      "🇯🇴",   "Hard Rock Stadium, Miami"),
  m(68, "Grupo J", "Jul 1, 2026",  "6:00 PM ET",  "Argelia",       "🇩🇿",   "Austria",       "🇦🇹",   "Lincoln Financial Field, Filadelfia"),

  // Jul 2
  m(69, "Grupo K", "Jul 2, 2026",  "3:00 PM ET",  "Colombia",      "🇨🇴",   "Portugal",      "🇵🇹",   "NRG Stadium, Houston"),
  m(70, "Grupo K", "Jul 2, 2026",  "3:00 PM ET",  "Uzbekistán",    "🇺🇿",   "RD Congo",   "🇨🇩",    "Estadio Akron, Zapopan"),
  m(71, "Grupo L", "Jul 2, 2026",  "6:00 PM ET",  "Inglaterra",    "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Panamá",        "🇵🇦",   "Arrowhead Stadium, Kansas City"),
  m(72, "Grupo L", "Jul 2, 2026",  "6:00 PM ET",  "Croacia",       "🇭🇷",   "Ghana",         "🇬🇭",   "Estadio Azteca, Ciudad de México"),
];

/** Todos los partidos de la fase de grupos, ordenados por fecha */
export const WC2026_MATCHES = [...MATCHDAY_1, ...MATCHDAY_2, ...MATCHDAY_3];
