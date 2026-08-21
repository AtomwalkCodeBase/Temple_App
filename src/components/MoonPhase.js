// MoonPhase.js — the signature element.
// Renders the moon for any tithi. Approximation: a sky-colored circle slides
// across the lit disc; its offset maps to the lit fraction of the lunar cycle.
//
//   Shukla (waxing):  lit fraction = tithi/15, crescent lit on the RIGHT
//   Krushna (waning): lit fraction = 1 - tithi/15, lit on the LEFT
//   Purnima  -> full gold disc.  Amavasya -> faint outlined disc.

import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../screens/theme';

export default function MoonPhase({
  tithiNumber,          // 1..15
  paksha,               // 'SHUKLA' | 'KRUSHNA'
  size = 66,
  moonColor = theme.moon,
  skyColor = theme.sky,
  withStars = false,
}) {
  const r = size * 0.42;
  const c = size / 2;

  const waxing = paksha === 'SHUKLA';
  const lit = waxing ? tithiNumber / 15 : 1 - tithiNumber / 15;

  // Occluder displacement: 0 = new moon (fully covered), >= 2.2r = full moon.
  const d = lit * 2.2 * r;
  const occluderCx = waxing ? c - d : c + d;

  const isAmavasya = lit <= 0.03;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {withStars && (
        <>
          <Circle cx={size * 0.14} cy={size * 0.16} r={1.2} fill={theme.star} />
          <Circle cx={size * 0.86} cy={size * 0.2} r={1} fill={theme.star} />
          <Circle cx={size * 0.8} cy={size * 0.82} r={1.3} fill={theme.star} />
          <Circle cx={size * 0.18} cy={size * 0.76} r={0.9} fill={theme.star} />
        </>
      )}
      {isAmavasya ? (
        // New moon: barely-there outline so the sky never looks empty
        <Circle cx={c} cy={c} r={r} fill="none" stroke={moonColor}
          strokeOpacity={0.25} strokeWidth={1} />
      ) : (
        <>
          <Circle cx={c} cy={c} r={r} fill={moonColor} />
          <Circle cx={occluderCx} cy={c} r={r * 0.97} fill={skyColor} />
        </>
      )}
    </Svg>
  );
}
