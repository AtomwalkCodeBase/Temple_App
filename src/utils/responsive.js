// src/utils/responsive.js
// Simple width/height scaling helpers so the design system adapts
// across 360x800, 390x844, 412x915 and tablets, without a UI library.
import { Dimensions, PixelRatio } from 'react-native';
import { baseScreen } from '../constants/layout';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Clamp so very large tablets don't blow up spacing/fonts.
const widthRatio = Math.min(SCREEN_WIDTH / baseScreen.width, 1.3);

export function scaleWidth(size) {
  return Math.round(PixelRatio.roundToNearestPixel(size * widthRatio));
}

export function scaleFont(size) {
  const newSize = size * widthRatio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export function moderateScale(size, factor = 0.5) {
  return Math.round(size + (scaleWidth(size) - size) * factor);
}

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
};

export default { scaleWidth, scaleFont, moderateScale, screen };
