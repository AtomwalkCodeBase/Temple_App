// src/theme/ThemeContext.js
import React, { createContext, useContext, useMemo } from 'react';
import { buildTheme } from './index';
import { usePreferences } from '../hooks/usePreferences';

const ThemeContext = createContext(null);
const DEFAULT_THEME = buildTheme('maroon', false);

export function ThemeProvider({ children }) {
  const { preferences, update } = usePreferences();
  const accent = preferences?.accent || 'maroon';
  const isDark = preferences?.isDark || false;

  const theme = useMemo(() => buildTheme(accent, isDark), [accent, isDark]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme: () => update({ isDark: !isDark }),
      setAccentColor: (accentKey) => update({ accent: accentKey }),
    }),
    [theme, isDark, update]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return ctx ? ctx.theme : DEFAULT_THEME; // safe fallback if used outside a provider
}

export function useThemeToggle() {
  return useContext(ThemeContext);
}