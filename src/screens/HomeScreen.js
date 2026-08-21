// HomeScreen.js — night-sky hero + tithi strip + festival banner + upcoming.
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import MoonPhase from '../components/MoonPhase';
import TithiStrip from '../components/TithiStrip';
import { getDayPanchang, getTithiStrip, getUpcomingEvents } from '../services/api';
import { getGreeting } from '../services/i18n';
import { theme, spacing, radius } from '../screens/theme';
import Screen from '../components/Screen';

const LOCATION_ID = 1; // TODO: from user profile / settings

export default function HomeScreen({ navigation }) {
  const [day, setDay] = useState(null);
  const [strip, setStrip] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const stripStart = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const [d, s, u] = await Promise.all([
      getDayPanchang(today, LOCATION_ID),
      getTithiStrip(stripStart, LOCATION_ID, 7),
      getUpcomingEvents(30),
    ]);
    setDay(d); setStrip(s.days); setUpcoming(u.events);
  }, []);

  useEffect(() => {
    load().catch(console.warn).finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load().catch(console.warn);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Screen>
        <View style={[styles.center, { backgroundColor: theme.sky }]}>
          <ActivityIndicator color={theme.moon} size="large" />
        </View>
      </Screen>
    );
  }

  const todayFestival = day.religious_events?.[0];
  const daysToPurnima = day.days_to_purnima;

  return (
    <Screen>

      <ScrollView
        style={{ backgroundColor: theme.surface }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ---- Night sky hero ---- */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting(day.user_language)}, {day.user_first_name}</Text>
              <Text style={styles.heroDate}>{dayjs(day.date).format('dddd, D MMMM YYYY')}</Text>
            </View>
            <Pressable style={styles.locationChip}
              onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="location-outline" size={12} color={theme.star} />
              <Text style={styles.locationText}> {day.location_name}</Text>
            </Pressable>
          </View>

          <View style={{ alignItems: 'center' }}>
            <MoonPhase
              tithiNumber={day.tithi_number}
              paksha={day.paksha.toUpperCase()}
              size={110}
              withStars
            />
            <Text style={styles.pakshaLine}>{day.lunar_month_local} {day.paksha_local} ପକ୍ଷ</Text>
            <Text style={styles.tithiBig}>{day.tithi_local}</Text>
            <Text style={styles.tithiSub}>
              {day.tithi} · until {day.tithi_end_display} · {day.nakshatra}
            </Text>
            <Text style={styles.metaLine}>
              <Ionicons name="sunny-outline" size={12} color={theme.skyLine} /> {day.sunrise}
              {'   '}
              <Ionicons name="moon-outline" size={12} color={theme.skyLine} /> {day.sunset}
              {daysToPurnima != null &&
                `   Purnima in ${daysToPurnima} day${daysToPurnima === 1 ? '' : 's'}`}
            </Text>
          </View>
        </View>

        {/* ---- Tithi strip ---- */}
        <TithiStrip
          days={strip}
          onSelectDay={(date) => navigation.navigate('Month', { focusDate: date })}
        />

        {/* ---- Festival banner (only when today has one) ---- */}
        {todayFestival && (
          <Pressable
            style={styles.festivalBanner}
            onPress={() => navigation.navigate('EventDetail',
              { code: todayFestival.code, date: day.date })}
          >
            <Ionicons name="flag" size={20} color={theme.sacredText} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.festivalTitle}>{todayFestival.name} today</Text>
              <Text style={styles.festivalSub}>
                {todayFestival.importance === 'MAJOR' ? 'Major festival' : 'Festival'}
                {todayFestival.is_tracked ? ' · reminder set' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.sacredMuted} />
          </Pressable>
        )}

        {/* ---- Upcoming ---- */}
        <Text style={styles.sectionTitle}>Coming up</Text>
        {upcoming.map((ev, i) => (
          <Pressable
            key={`${ev.kind}-${ev.id}`}
            style={[styles.upcomingRow, i < upcoming.length - 1 && styles.rowBorder]}
            onPress={() =>
              ev.kind === 'religious'
                ? navigation.navigate('EventDetail', { code: ev.code, date: ev.date })
                : navigation.navigate('EventDetail', { userEventId: ev.id })}
          >
            <Text style={styles.upcomingDate}>{dayjs(ev.date).format('D MMM')}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.upcomingTitle}>{ev.title}</Text>
              <Text style={styles.upcomingSub}>{ev.subtitle}</Text>
            </View>
            <Ionicons
              name={ev.kind === 'user' ? 'people-outline' : 'notifications-outline'}
              size={16}
              color={ev.kind === 'user' ? theme.accent : theme.textMuted}
            />
          </Pressable>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: theme.sky, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { color: theme.skyText, fontSize: 16, fontWeight: '600' },
  heroDate: { color: theme.skyMuted, fontSize: 11, marginTop: 1 },
  locationChip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.skyChipBorder,
    borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3,
  },
  locationText: { color: theme.star, fontSize: 11 },
  pakshaLine: { color: theme.skyMuted, fontSize: 12, marginTop: 6 },
  tithiBig: { color: theme.skyText, fontSize: 30, fontWeight: '600', marginTop: 1 },
  tithiSub: { color: theme.skyMuted, fontSize: 12, marginTop: 2 },
  metaLine: { color: theme.skyLine, fontSize: 11, marginTop: 9 },
  festivalBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.sacredTint, borderRadius: radius.m,
    marginHorizontal: 14, marginTop: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  festivalTitle: { color: theme.sacredText, fontSize: 14, fontWeight: '600' },
  festivalSub: { color: theme.sacredMuted, fontSize: 12 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: theme.textMuted,
    marginTop: 14, marginHorizontal: 18, marginBottom: 2,
  },
  upcomingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 14, paddingVertical: 9, paddingHorizontal: 4,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  upcomingDate: { fontSize: 13, color: theme.accent, fontWeight: '600', minWidth: 44 },
  upcomingTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
  upcomingSub: { fontSize: 12, color: theme.textMuted },
});
