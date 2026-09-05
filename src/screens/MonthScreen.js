// MonthScreen.js — grid of the month with a micro moon per day, tapping a
// date opens a bottom sheet with that day's tithi + festival + quick add.
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  StyleSheet, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import dayjs from 'dayjs';
import MoonPhase from '../components/MoonPhase';
import { getDayPanchang, listUserEvents, getTithiStrip } from '../services/api';
import { theme, radius } from '../screens/theme';
import Screen from '../components/Screen';
import { EVENT_TYPES } from './AddEventScreen';
import { useUser } from '../context/UserContext';

const CELL_SIZE = Math.floor((Dimensions.get('window').width - 32) / 7);
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MonthScreen({ navigation, route }) {
  const focusDate = route?.params?.focusDate ? dayjs(route.params.focusDate) : dayjs();
  const { profile } = useUser();
  const [cursor, setCursor] = useState(focusDate.startOf('month'));
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [myEventDates, setMyEventDates] = useState(new Set());
  const [myEvents, setMyEvents] = useState([]);
  const loadedMonthKey = useRef(null);

  const locationName = profile?.location_name || null;
  const locationId = profile?.preferred_location || null;
  const preferenceKey = profile
    ? [profile.language, profile.preferred_calendar, profile.preferred_location].join('|')
    : null;

  useEffect(() => {
    const refreshMyEvents = () => {
      listUserEvents()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.results ?? []);
          setMyEvents(list);
          setMyEventDates(new Set(list.map((e) => e.event_date)));
        })
        .catch(() => setMyEventDates(new Set()));
    };
    refreshMyEvents();
    const unsubscribe = navigation.addListener('focus', refreshMyEvents);
    return unsubscribe;
  }, [navigation]);

  const [loadError, setLoadError] = useState(null);

  // const loadMonth = useCallback(async (c) => {
  //   setLoading(true);
  //   try {
  //     const res = await getMonthGrid(c.year(), c.month() + 1, LOCATION_ID);
  //     setDays(res.days);
  //   } catch (e) {
  //     console.warn(e);
  //     setDays([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  const loadMonth = useCallback(async (c, force = false) => {
    const monthKey = `${preferenceKey}|${c.format('YYYY-MM')}`;
    if (!force && loadedMonthKey.current === monthKey) return;
    setLoading(true);
    setLoadError(null);
    try {
      const start = c.startOf('month');
      const daysInMonth = c.daysInMonth();
      const res = await getTithiStrip(start.format('YYYY-MM-DD'), locationId, daysInMonth);
      const list = res?.days ?? [];
      setDays(list);
      loadedMonthKey.current = monthKey;
      if (!list.length) console.warn('getTithiStrip returned no days:', res);
    } catch (e) {
      console.warn('getTithiStrip failed:', e.message);
      setLoadError(e.message);
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [locationId, preferenceKey]);

  useEffect(() => {
    if (profile) loadMonth(cursor);
  }, [cursor, loadMonth, profile]);

  const openDay = async (dateStr) => {
    setSelectedDate(dateStr);
    setDetailLoading(true);
    try {
      const detail = await getDayPanchang(dateStr, locationId);
      setSelectedDetail(detail);
    } catch (e) {
      console.warn(e);
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const changeMonth = (delta) => {
    setSelectedDate(null);
    setCursor((c) => c.add(delta, 'month'));
  };

  // Build a 7-wide grid with leading blanks for the month's first weekday
  const leadingBlanks = cursor.startOf('month').day();
  const daysWithUserEvents = days.map((d) => ({
    ...d,
    has_user_event: myEventDates.has(dayjs(d.date).format('YYYY-MM-DD')),
  }));
  const cells = [...Array(leadingBlanks).fill(null), ...daysWithUserEvents];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        <View style={styles.header}>
          <Pressable onPress={() => changeMonth(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={theme.skyMuted} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>{cursor.format('MMMM YYYY')}</Text>
            <Text style={styles.headerSub}>{locationName || 'Location'}</Text>
          </View>
          <Pressable onPress={() => changeMonth(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color={theme.skyMuted} />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={[styles.weekday, { width: CELL_SIZE }]}>{w}</Text>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.accent} />
        ) : (
          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (!d) return <View key={`blank-${i}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
              const dateStr = dayjs(d.date).format('YYYY-MM-DD');
              const isSelected = dateStr === selectedDate;
              return (
                <Pressable
                  key={dateStr}
                  onPress={() => openDay(dateStr)}
                  style={[
                    styles.cell,
                    { width: CELL_SIZE, height: CELL_SIZE },
                    isSelected && styles.cellSelected,
                    d.is_today && !isSelected && styles.cellToday,
                  ]}
                >
                  <MoonPhase
                    tithiNumber={d.tithi_number}
                    paksha={d.paksha}
                    size={20}
                    moonColor={d.has_festival ? theme.sacred : '#D3D1C7'}
                    skyColor={isSelected ? theme.accentTint : theme.surface}
                  />
                  <Text style={[
                    styles.cellDate,
                    d.is_today && styles.cellDateToday,
                    d.has_user_event && styles.cellDateUserEvent,
                  ]}>
                    {dayjs(d.date).date()}
                  </Text>
                  <View style={styles.cellDotRow}>
                    {d.has_user_event && <View style={styles.eventDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.legend}>
          <Text style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.sacred }]} /> Festival
          </Text>
          <Text style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]} /> My event
          </Text>
        </View>

        {selectedDate && (
          <DaySheet
            date={selectedDate}
            detail={selectedDetail}
            loading={detailLoading}
            dayEvents={myEvents.filter(
              (e) => dayjs(e.event_date).format('YYYY-MM-DD') === selectedDate
            )}
            onClose={() => setSelectedDate(null)}
            onFestivalPress={(code) => navigation.navigate('EventDetail', { code, date: selectedDate })}
            onEventPress={(userEventId) => navigation.navigate('EventDetail', { userEventId })}
            onAddEvent={() => navigation.navigate('AddEvent', { prefillDate: selectedDate })}
          />
        )}
      </View>
    </Screen>
  );
}

function DaySheet({ date, detail, loading, dayEvents, onClose, onFestivalPress, onEventPress, onAddEvent }) {
  const festival = detail?.religious_events?.[0];

  const getEventTypeLabel = (eventTypeKey) => {
    const eventType = EVENT_TYPES.find(item => item.key === eventTypeKey);
    return eventType ? eventType.label : eventTypeKey; // fallback to key if not found
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />

      {loading || !detail ? (
        <ActivityIndicator color={theme.accent} style={{ paddingVertical: 20 }} />
      ) : (
        <>
          {/* Fixed Header */}
          <View style={styles.sheetHeader}>
            <MoonPhase
              tithiNumber={detail.tithi_number}
              paksha={detail.paksha.toUpperCase()}
              size={34}
            />

            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.sheetDate}>
                {dayjs(date).format('dddd, D MMMM')}
              </Text>
              <Text style={styles.sheetSub}>
                {detail.lunar_month} {detail.paksha}{' '} {detail.tithi_local || detail.tithi}
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {festival ? (
              <>
                <Pressable
                  style={styles.festivalCard}
                  onPress={() => onFestivalPress(festival.code)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.festivalTitle}>{festival.name}</Text>
                    <Text style={styles.festivalSub}>
                      {festival.name_local} ·{' '} {festival.importance === 'MAJOR' ? 'Major festival' : 'Festival'}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color={theme.accent} />
                </Pressable>

                {dayEvents.length > 0 && (
                  <View style={[styles.festivalCard, { marginTop: 10, gap: 6, marginBottom: 50, flexDirection: 'column', alignItems: 'stretch' },]}>
                    <Text style={styles.festivalTitle}>Personal Events</Text>

                    {dayEvents.map((e) => (
                      <Pressable key={e.id ?? `${e.event_date}-${e.title}`} style={styles.userEventRow} onPress={() => onEventPress(e.id)}>
                        <View style={styles.eventDot} />
                        <Text style={styles.userEventText}> {e.title || e.name} </Text>
                        <Text style={[styles.chipText, styles.chipActive]}>
                          ({getEventTypeLabel(e.event_type)})
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noFestivalCard}>
                <Text style={styles.noFestivalText}>No festival today</Text>

                {dayEvents.length > 0 && (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    {dayEvents.map((e) => (
                      <View key={e.id ?? `${e.event_date}-${e.title}`} style={styles.userEventRow}>
                        <View style={styles.eventDot} />

                        <Text style={styles.userEventText}> {e.title || e.name} </Text>

                        <Text style={[styles.chipText, styles.chipActive]}>
                          ({getEventTypeLabel(e.event_type)})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Pressable style={styles.addButton} onPress={onAddEvent}>
                  <Ionicons name="add" size={15} color="#fff" />
                  <Text style={styles.addButtonText}>
                    {' '}Add event on this day
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.sky, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: theme.skyText, fontSize: 16, fontWeight: '600' },
  headerSub: { color: theme.skyMuted, fontSize: 11 },
  weekdayRow: { flexDirection: 'row', paddingTop: 10, paddingHorizontal: 16 },
  weekday: { textAlign: 'center', fontSize: 11, color: theme.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  cell: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.s, marginVertical: 1 },
  cellSelected: { backgroundColor: theme.accentTint, borderWidth: 1.5, borderColor: theme.accent },
  cellToday: { backgroundColor: theme.sacredTint },
  cellDate: { fontSize: 11, color: theme.text, marginTop: 1 },
  cellDateToday: { color: theme.sacredMuted, fontWeight: '700' },
  cellDateUserEvent: { color: theme.accentDeep, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingTop: 8 },
  legendItem: { fontSize: 11, color: theme.textMuted, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  sheet: {
    marginTop: 'auto', backgroundColor: theme.surfaceAlt,
    borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border,
    alignSelf: 'center', marginBottom: 10,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sheetDate: { fontSize: 15, fontWeight: '600', color: theme.text },
  sheetSub: { fontSize: 12, color: theme.textMuted },
  festivalCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    borderRadius: radius.m, padding: 12,
  },
  festivalTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
  festivalSub: { fontSize: 12, color: theme.textMuted, marginTop: 1 },
  noFestivalCard: {
    backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border, borderRadius: radius.m, padding: 12,
  },
  personalEventsCard: {
    backgroundColor: theme.accentTint,
    borderLeftWidth: 3, borderLeftColor: theme.accent,
    borderRadius: radius.m, padding: 12, gap: 6,
  },
  personalEventsTitle: { fontSize: 14, fontWeight: '600', color: theme.accentDeep, marginBottom: 2 },
  noFestivalText: { fontSize: 14, fontWeight: '600', color: theme.text },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.accent, borderRadius: radius.m, paddingVertical: 8, marginTop: 10,
  },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cellDotRow: { height: 6, marginTop: 2, justifyContent: 'center', alignItems: 'center' },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent },
  userEventRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userEventText: { fontSize: 13, color: theme.text, marginLeft: 6 },
  chipActive: { backgroundColor: theme.accentTint, borderColor: theme.accent, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3, },
  chipText: { fontSize: 13, color: theme.accentDeep, fontWeight: '600' },
  sheetScroll: { maxHeight: 320, flexGrow: 0 },
  sheetScrollContent: { paddingBottom: 16 },
});
