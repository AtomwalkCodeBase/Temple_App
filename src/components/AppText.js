// src/components/AppText.js
import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Central text component. Every screen should render text through this
 * instead of raw <Text> so typography/color stays consistent.
 *
 * variant: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'button' | 'quote'
 * color: 'text' | 'textSecondary' | 'textDisabled' | 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'white'
 */
export default function AppText({
  variant = 'body',
  color = 'text',
  style,
  children,
  ...rest
}) {
  const theme = useTheme();
  const variantStyle = theme.typography[variant] || theme.typography.body;
  const colorValue = theme.color[color] || theme.color.text;

  return (
    <Text style={[variantStyle, { color: colorValue }, style]} {...rest}>
      {children}
    </Text>
  );
}
