// src/constants/palettes.js
// Preset accent palettes selectable from Settings (theme color picker).
// Each palette overrides the "brand" tokens — primary/primaryDark/primaryLight
// plus the gold accent pair. `maroon` is the default and matches the legacy
// colours in colors.js.
export const ACCENT_KEYS = ['maroon', 'saffron', 'green', 'blue'];

export const accentPalettes = {
  maroon: {
    primary: '#7A263A',
    primaryDark: '#5C1D2C',
    primaryLight: '#F2E3E7',
    accent: '#C9973E',
    accentLight: '#F7EEDB',
  },
  saffron: {
    primary: '#C05B1E',
    primaryDark: '#96460F',
    primaryLight: '#F9E7D8',
    accent: '#E0A32E',
    accentLight: '#FBEFD9',
  },
  green: {
    primary: '#2E6B4A',
    primaryDark: '#1F4D34',
    primaryLight: '#E3EFE7',
    accent: '#C9973E',
    accentLight: '#F7EEDB',
  },
  blue: {
    primary: '#2C4A8C',
    primaryDark: '#1D3366',
    primaryLight: '#E5EAF7',
    accent: '#C9973E',
    accentLight: '#F7EEDB',
  },
};

export default accentPalettes;
