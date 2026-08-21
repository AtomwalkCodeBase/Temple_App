// src/constants/layout.js
import { Platform } from 'react-native';
import colors from './colors';

export const radius = {
  sm: 8, // inputs, small badges
  md: 12, // cards, buttons
  lg: 16, // large feature cards
  pill: 999, // tags, filters, status
};

export const iconSize = {
  inline: 16,
  normal: 20,
  nav: 24,
  feature: 28,
  emptyState: 32,
};

export const touchTarget = {
  min: 44,
  preferred: 48,
};

export const buttonHeight = {
  default: 48,
};

export const inputHeight = {
  default: 50,
};

// Keep shadows extremely subtle. Prefer borders over shadows where possible.
export const shadow = Platform.select({
  ios: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: {
    elevation: 2,
  },
  default: {},
});

export const animation = {
  calendarTransition: 200,
  bottomSheet: 250,
  buttonPress: 120,
};

// Base design sizes used to scale for responsiveness (see utils/responsive.js)
export const baseScreen = {
  width: 390,
  height: 844,
};
