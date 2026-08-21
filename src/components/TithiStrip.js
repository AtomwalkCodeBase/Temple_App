// TithiStrip.js — 7 days as waxing/waning mini moons.
// Gold moon = festival day. Tapping a day navigates to it.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MoonPhase from './MoonPhase';
import { theme } from '../screens/theme';

export default function TithiStrip({ days, onSelectDay }) {
  // days: [{ date, label, tithi_number, paksha, is_today, has_festival }]
  return (
    <View style={styles.row}>
      {days?.length === 0 ? "data not found" :
        days.map((d) => {
          const moonColor = d.has_festival ? theme.sacred
            : d.is_today ? theme.accent
              : theme.star;
          return (
            <Pressable
              key={d.date}
              onPress={() => onSelectDay?.(d.date)}
              style={[styles.day, d.is_today && styles.today]}
            >
              <MoonPhase
                tithiNumber={d.tithi_number}
                paksha={d.paksha}
                size={24}
                moonColor={moonColor}
                skyColor={d.is_today ? theme.accentTint : theme.surface}
              />
              <Text
                style={[
                  styles.label,
                  d.is_today && styles.todayLabel,
                  d.has_festival && !d.is_today && styles.festivalLabel,
                ]}
              >
                {d.is_today ? 'Today' : d.label}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  day: { alignItems: 'center', paddingVertical: 2, paddingHorizontal: 4 },
  today: {
    backgroundColor: theme.accentTint,
    borderRadius: 10,
    marginTop: -4,
    paddingHorizontal: 7,
    paddingTop: 4,
  },
  label: { fontSize: 10, color: theme.textMuted, marginTop: 2 },
  todayLabel: { color: theme.accentDeep, fontWeight: '600' },
  festivalLabel: { color: theme.sacredMuted, fontWeight: '600' },
});
