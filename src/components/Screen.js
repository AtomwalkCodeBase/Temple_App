// src/components/Screen.js
// Every screen should render its root through this instead of a plain
// <View> — it keeps content clear of the status bar, the notch, and the
// home indicator / gesture bar, which raw Views ignore.
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

/**
 * edges: which sides to pad for safe area.
 *  - Screens inside the bottom tab navigator: leave default (tab bar already
 *    handles the bottom inset) -> ['top', 'left', 'right']
 *  - Modal / stack screens presented over everything (no tab bar below
 *    them): pass edges={['top', 'bottom', 'left', 'right']}
 */
export default function Screen({ children, style, edges = ['top', 'left', 'right'] }) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: theme.color.background }, style]}>
      {children}
    </SafeAreaView>
  );
}
