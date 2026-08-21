// src/theme/index.js
// Semantic token layer. Components should import `useTheme()` and reference
// theme.color.background etc — NOT constants/colors.js directly — so that
// dark mode (or any accent re-theme) needs zero component changes.
//
// buildTheme(accent, isDark) is the single place where an accent palette is
// mapped onto the semantic color tokens. The Settings screen picks an accent
// key; ThemeContext feeds it in here.
import { colors } from '../constants/colors';
import { accentPalettes } from '../constants/palettes';
import { typography, fontFamily } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { radius, iconSize, touchTarget, buttonHeight, inputHeight, shadow, animation } from '../constants/layout';

const DARK_OVERRIDES = {
  background: '#1B1717',
  surface: '#241F1F',
  surfaceAlt: '#2C2626',
  text: '#F2EEEA',
  textSecondary: '#B8B2AB',
  border: '#3A332F',
};

export function buildTheme(accentKey = 'maroon', isDark = false) {
  const palette = accentPalettes[accentKey] || accentPalettes.maroon;
  const color = {
    ...palette,
    secondary: colors.secondary,
    secondaryLight: colors.secondaryLight,
    success: colors.sage,
    background: colors.background,
    surface: colors.surface,
    surfaceAlt: colors.surfaceAlt,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textDisabled: colors.textDisabled,
    border: colors.border,
    error: colors.error,
    warning: colors.warning,
    white: colors.white,
    overlay: colors.overlay,
    ...(isDark ? DARK_OVERRIDES : {}),
  };

  return {
    mode: isDark ? 'dark' : 'light',
    color,
    typography,
    fontFamily,
    spacing,
    radius,
    iconSize,
    touchTarget,
    buttonHeight,
    inputHeight,
    shadow,
    animation,
  };
}

// Default export keeps any old imports working.
export const lightTheme = buildTheme('maroon', false);
export const darkTheme = buildTheme('maroon', true);

export default lightTheme;
