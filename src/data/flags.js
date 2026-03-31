/**
 * Mapa de nombre de equipo → código ISO 3166-1 alpha-2
 * para obtener banderas desde flagcdn.com
 * Uso: https://flagcdn.com/w40/{code}.png
 */
export const FLAG_CODES = {
  // Grupo A
  "México":         "mx",
  "Corea del Sur":  "kr",
  "Sudáfrica":      "za",
  // Grupo B
  "Canadá":         "ca",
  "Suiza":          "ch",
  "Qatar":          "qa",
  // Grupo C
  "Brasil":         "br",
  "Marruecos":      "ma",
  "Escocia":        "gb-sct",
  "Haití":          "ht",
  // Grupo D
  "USA":            "us",
  "Paraguay":       "py",
  "Australia":      "au",
  // Grupo E
  "Alemania":       "de",
  "Ecuador":        "ec",
  "Costa de Marfil":"ci",
  "Curazao":        "cw",
  // Grupo F
  "Países Bajos":   "nl",
  "Japón":          "jp",
  "Túnez":          "tn",
  // Grupo G
  "Bélgica":        "be",
  "Egipto":         "eg",
  "Irán":           "ir",
  "Nueva Zelanda":  "nz",
  // Grupo H
  "España":         "es",
  "Arabia Saudita": "sa",
  "Uruguay":        "uy",
  "Cabo Verde":     "cv",
  // Grupo I
  "Francia":        "fr",
  "Senegal":        "sn",
  "Noruega":        "no",
  // Grupo J
  "Argentina":      "ar",
  "Argelia":        "dz",
  "Austria":        "at",
  "Jordania":       "jo",
  // Grupo K
  "Colombia":       "co",
  "Portugal":       "pt",
  "Uzbekistán":     "uz",
  // Grupo L
  "Inglaterra":     "gb-eng",
  "Croacia":        "hr",
  "Panamá":         "pa",
  "Ghana":          "gh",
};

// Tamaños soportados por flagcdn.com
const CDN_SIZES = [20, 40, 80, 160, 320, 640];

/** Redondea al tamaño CDN más cercano */
function nearestSize(size) {
  return CDN_SIZES.reduce((a, b) =>
    Math.abs(b - size) < Math.abs(a - size) ? b : a,
  );
}

/** Devuelve la URL de la bandera o null si no hay código */
export function getFlagUrl(nombre, size = 40) {
  const code = FLAG_CODES[nombre];
  if (!code) return null;
  return `https://flagcdn.com/w${nearestSize(size)}/${code}.png`;
}
