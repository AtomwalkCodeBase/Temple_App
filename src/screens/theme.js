// src/theme.js
// Two-mood palette: a deep "night sky" hero (moon phase, stars) at the top
// of Home, and the calm warm-ivory surface everywhere else -- same family
// as the rest of the app, just with a devotional night-sky accent piece.
export const theme = {
  // Night sky (hero)
  sky: '#042C53',
  skyText: '#E6F1FB',
  skyMuted: '#85B7EB',
  skyLine: '#378ADD',
  skyChipBorder: '#185FA5',
  star: '#B5D4F4',

  // Moon
  moon: '#FAEEDA',

  // Daylight section
  surface: '#FFFFFF',
  surfaceAlt: '#F5F7FA',
  border: '#E3E8EF',
  text: '#1A2433',
  textMuted: '#6B7686',

  // Interactive (blue family)
  accent: '#185FA5',
  accentTint: '#E6F1FB',
  accentDeep: '#0C447C',

  // Sacred (gold family) — festivals only
  sacred: '#EF9F27',
  sacredTint: '#FAEEDA',
  sacredText: '#412402',
  sacredMuted: '#854F0B',

  errorText: '#5C1A0E',
  success: '#1B8A4C',
  successTint: '#E6F7EC',
  error: '#C4321E',
  errorTint: '#FCE8E6',
};

export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999, s: 8, m: 12, l: 16 };

export default { theme, spacing, radius };
