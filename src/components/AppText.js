import React from 'react';
import { Text } from 'react-native';
import { theme, fontSize } from '../theme/theme';

/**
 * Central text component.
 *
 * variant:
 * 'display' | 'h1' | 'h2' | 'h3' | 'body' |
 * 'bodySmall' | 'caption' | 'button' | 'quote'
 *
 * color:
 * 'text' | 'textSecondary' | 'textDisabled' |
 * 'primary' | 'secondary' | 'accent' |
 * 'success' | 'error' | 'white'
 */
export default function AppText({
  variant = 'body',
  color = 'text',
  style,
  children,
  ...rest
}) {
  const variantStyles = {
    display: {
      fontSize: fontSize.display,
      fontWeight: '700',
    },
    h1: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
    },
    h2: {
      fontSize: fontSize.xl,
      fontWeight: '700',
    },
    h3: {
      fontSize: fontSize.lg,
      fontWeight: '600',
    },
    body: {
      fontSize: fontSize.base,
      fontWeight: '400',
    },
    bodySmall: {
      fontSize: fontSize.md,
      fontWeight: '400',
    },
    caption: {
      fontSize: fontSize.sm,
      fontWeight: '400',
    },
    button: {
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    quote: {
      fontSize: fontSize.lg,
      fontWeight: '400',
      fontStyle: 'italic',
    },
  };

  const colorMap = {
    text: theme.text,
    textSecondary: theme.textMuted,
    textDisabled: theme.border,
    primary: theme.accent,
    secondary: theme.accentDeep,
    accent: theme.accent,
    success: theme.success,
    error: theme.error,
    white: '#FFFFFF',
  };

  return (
    <Text
      style={[
        variantStyles[variant] || variantStyles.body,
        { color: colorMap[color] || theme.text },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}