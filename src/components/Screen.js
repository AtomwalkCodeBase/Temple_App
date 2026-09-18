// src/components/Screen.js
// Every screen should render its root through this instead of a plain
// <View> — it keeps content clear of the status bar, the notch, and the
// home indicator / gesture bar, which raw Views ignore.
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { StatusBar } from 'expo-status-bar';

/**
 * edges: which sides to pad for safe area.
 *  - Screens inside the bottom tab navigator: leave default (tab bar already
 *    handles the bottom inset) -> ['top', 'left', 'right']
 *  - Modal / stack screens presented over everything (no tab bar below
 *    them): pass edges={['top', 'bottom', 'left', 'right']}
 */
export default function Screen({ children, style, edges = ['top', 'left', 'right'] }) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: theme.surfaceAlt }, style]}>
      <StatusBar style="dark" />
      {children}
    </SafeAreaView>
  );
}
