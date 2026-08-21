// src/constants/typography.js
export const fontFamily = {
  regular: 'NotoSans_400Regular',
  medium: 'NotoSans_500Medium',
  semiBold: 'NotoSans_600SemiBold',
  bold: 'NotoSans_700Bold',
  serif: 'NotoSerif_400Regular', // used sparingly, for devotional quotes / festival names
};

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontFamily: fontFamily.bold },
  h1: { fontSize: 26, lineHeight: 34, fontFamily: fontFamily.bold },
  h2: { fontSize: 22, lineHeight: 30, fontFamily: fontFamily.bold },
  h3: { fontSize: 18, lineHeight: 26, fontFamily: fontFamily.semiBold },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.regular },
  bodySmall: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.medium },
  button: { fontSize: 16, lineHeight: 20, fontFamily: fontFamily.semiBold },
  quote: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.serif, fontStyle: 'italic' },
};

export default typography;
