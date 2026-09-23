// MonthScreen.js — redesign:
// - Month/Week toggle, swipeable like Google Calendar (paged ScrollView, 3-buffer trick)
// - Selected date defaults to today; tapping a date shows a persistent Muhurta panel
//   below the grid (auspicious vs inauspicious), plus that date's festival/personal events
// - "This month" agenda (festivals + personal events) stays below, tap -> selects that date
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  StyleSheet, Dimensions, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import MoonPhase from '../components/MoonPhase';
import { getDayPanchang, listUserEvents, getTithiStrip, getMonthsEvents, untrackReligiousEvent, trackReligiousEvent } from '../services/api';
import { theme, radius, spacing, fontSize } from '../theme/theme';
import Screen from '../components/Screen';
import { useUser } from '../context/UserContext';
import MonthAgendaDrawer from '../components/MonthAgendaDrawer';
import { EVENT_TYPES, REMINDER_OPTIONS } from '../constants/constant';
import { cancelEventReminders, scheduleEventReminders } from '../services/notifications';
import StatusModal from '../components/StatusModal';
import { extractErrorMessage } from '../utils/date';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 32) / 7);
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const VIEW_MODES = [{ key: 'month', label: 'Month' },
  // { key: 'week', label: 'Week' }
];

export default function MonthScreen({ navigation, route }) {
  const focusDate = route?.params?.focusDate ? dayjs(route.params.focusDate) : dayjs();
  const { profile } = useUser();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [cursor, setCursor] = useState(focusDate.startOf('month')); // anchor month
  const [weekCursor, setWeekCursor] = useState(focusDate.startOf('week'));
  const [selectedDate, setSelectedDate] = useState(focusDate.format('YYYY-MM-DD'));

  const [trackedMap, setTrackedMap] = useState({}); // code -> { is_tracked, user_event_id }
  const [expandedCode, setExpandedCode] = useState(null);
  const [reminderSelections, setReminderSelections] = useState({});
  const [busyCodes, setBusyCodes] = useState({});
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'error', title: '', message: '' });

  const [monthDays, setMonthDays] = useState({}); // { 'YYYY-MM': [...tithi days] }
  const [upcomingFestivals, setUpcomingFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [myEvents, setMyEvents] = useState([]);
  const loadedMonths = useRef(new Set());

  const locationName = profile?.location_name || null;
  const locationId = profile?.preferred_location || null;
  const preferenceKey = profile
    ? [profile.language, profile.preferred_calendar, profile.preferred_location].join('|')
    : null;

  const showStatus = (type, title, message) => setStatusModal({ visible: true, type, title, message });
  const hideStatus = () => setStatusModal((prev) => ({ ...prev, visible: false }));

  // ---- personal events (list) ----
  useFocusEffect(
    useCallback(() => {
      listUserEvents()
        .then((res) => setMyEvents(Array.isArray(res) ? res : (res?.results ?? [])))
        .catch(() => setMyEvents([]));
    }, [])
  );
  const myEventDates = useMemo(
    () => new Set(myEvents.map((e) => e.event_date)),
    [myEvents]
  );

  // ---- month tithi grid, cached per month key ----
  const loadMonthTithis = useCallback(async (monthStart) => {
    const key = `${preferenceKey}|${monthStart.format('YYYY-MM')}`;
    if (loadedMonths.current.has(key)) return;
    loadedMonths.current.add(key);
    try {
      const res = await getTithiStrip(
        monthStart.format('YYYY-MM-DD'), locationId, monthStart.daysInMonth()
      );
      setMonthDays((prev) => ({ ...prev, [monthStart.format('YYYY-MM')]: res?.days ?? [] }));
    } catch (e) {
      console.warn('getTithiStrip failed:', e.message);
      loadedMonths.current.delete(key); // allow retry
    }
  }, [locationId, preferenceKey]);

  // ---- upcoming festivals/personal events (for "this month" agenda) ----
  const loadAgenda = useCallback(async () => {
    try {
      const res = await getMonthsEvents(cursor.format('MM-YYYY'));
      setUpcomingFestivals(res?.events ?? []);
    } catch (e) {
      console.warn('getMonthsEvents failed:', e.message);
    }
  }, [cursor]);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      setLoading(true);
      Promise.all([
        loadMonthTithis(cursor),
        loadMonthTithis(cursor.subtract(1, 'month')),
        loadMonthTithis(cursor.add(1, 'month')),
        loadAgenda(),
      ]).finally(() => setLoading(false));
    }, [profile, cursor, loadMonthTithis, loadAgenda])
  );

  // ---- selected date's panchang (muhurtas, festival) ----
  const loadDayDetail = useCallback(async (dateStr) => {
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
  }, [locationId]);

  useEffect(() => {
    if (locationId) loadDayDetail(selectedDate);
  }, [selectedDate, locationId, loadDayDetail]);

  const openReminderPicker = (code) => {
    setReminderSelections((prev) => ({ ...prev, [code]: prev[code] ?? [1440] }));
    setExpandedCode(code);
  };

  const toggleReminderOption = (code, minutes) => {
    setReminderSelections((prev) => {
      const current = prev[code] ?? [1440];
      const next = current.includes(minutes) ? current.filter((m) => m !== minutes) : [...current, minutes];
      return { ...prev, [code]: next };
    });
  };

  const confirmAddToCalendar = async (f) => {
    const minutes = reminderSelections[f.key] ?? [1440];
    if (minutes.length === 0) {
      showStatus('error', 'Pick a reminder', 'Select at least one reminder option.');
      return;
    }
    if (busyCodes[f.key]) return;

    setBusyCodes((prev) => ({ ...prev, [f.key]: true }));
    try {
      const created = await trackReligiousEvent(f.key, { reminder_minutes: minutes });
      await scheduleEventReminders(
        { id: created.id, title: created.title, event_date: created.event_date, start_time: created.start_time },
        minutes
      );
      setTrackedMap((prev) => ({ ...prev, [f.key]: { is_tracked: true, user_event_id: created.id } }));
      setExpandedCode(null);
      showStatus('success', 'Added', `${f.name} added to your calendar.`);
    } catch (e) {
      console.log(e)
      showStatus('error', 'Something went wrong', extractErrorMessage(e));
    } finally {
      setBusyCodes((prev) => { const n = { ...prev }; delete n[f.key]; return n; });
    }
  };

  const removeFromCalendar = async (f) => {
    if (busyCodes[f.key]) return;
    const entry = trackedMap[f.key];
    setBusyCodes((prev) => ({ ...prev, [f.key]: true }));
    setTrackedMap((prev) => ({ ...prev, [f.key]: { ...entry, is_tracked: false } }));

    try {
      if (entry?.user_event_id) await cancelEventReminders(entry.user_event_id);
      await untrackReligiousEvent(f.key);

      // reset reminder picker state for this festival back to default
      setReminderSelections((prev) => {
        const next = { ...prev };
        delete next[f.key];
        return next;
      });
      setExpandedCode((prev) => (prev === f.key ? null : prev));
    } catch (e) {
      setTrackedMap((prev) => ({ ...prev, [f.key]: { ...entry, is_tracked: true } }));
      showStatus('error', 'Something went wrong', extractErrorMessage(e));
    } finally {
      setBusyCodes((prev) => { const n = { ...prev }; delete n[f.key]; return n; });
    }
  };

  const closeReminderPicker = (code) => {
    setExpandedCode((prev) => (prev === code ? null : prev));
  };

  const selectDate = (dateStr) => {
    setSelectedDate(dateStr);
    const d = dayjs(dateStr);
    if (!d.isSame(cursor, 'month')) setCursor(d.startOf('month'));
    setWeekCursor(d.startOf('week'));
  };

  const changeMonth = (delta) => setCursor((c) => c.add(delta, 'month'));
  const changeWeek = (delta) => setWeekCursor((w) => w.add(delta, 'week'));

  // ---- build month grid cells ----
  const monthCells = useMemo(() => {
    const key = cursor.format('YYYY-MM');
    const days = monthDays[key] ?? [];
    const withEvents = days.map((d) => ({
      ...d,
      has_user_event: myEventDates.has(dayjs(d.date).format('YYYY-MM-DD')),
    }));
    const leadingBlanks = cursor.startOf('month').day();
    return [...Array(leadingBlanks).fill(null), ...withEvents];
  }, [cursor, monthDays, myEventDates]);

  // ---- build week grid cells (7 days from weekCursor) ----
  const weekCells = useMemo(() => {
    const monthKey = weekCursor.format('YYYY-MM');
    const monthKeyEnd = weekCursor.add(6, 'day').format('YYYY-MM');
    const pool = [...(monthDays[monthKey] ?? []), ...(monthKeyEnd !== monthKey ? (monthDays[monthKeyEnd] ?? []) : [])];
    const byDate = Object.fromEntries(pool.map((d) => [dayjs(d.date).format('YYYY-MM-DD'), d]));
    return Array.from({ length: 7 }, (_, i) => {
      const dateStr = weekCursor.add(i, 'day').format('YYYY-MM-DD');
      const d = byDate[dateStr];
      return d
        ? { ...d, has_user_event: myEventDates.has(dateStr) }
        : { date: dateStr, is_today: dayjs().format('YYYY-MM-DD') === dateStr, has_user_event: myEventDates.has(dateStr) };
    });
  }, [weekCursor, monthDays, myEventDates]);

  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'week') {
        loadMonthTithis(weekCursor.startOf('month'));
        loadMonthTithis(weekCursor.endOf('week').startOf('month'));
      }
    }, [viewMode, weekCursor, loadMonthTithis])
  );

  const currentMonthAgenda = useMemo(
    () =>
      upcomingFestivals
        .filter((ev) => dayjs(ev.date).isSame(cursor, 'month'))
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date))),
    [upcomingFestivals, cursor]
  );

  const selectedDayEvents = myEvents.filter(
    (e) => dayjs(e.event_date).format('YYYY-MM-DD') === selectedDate
  );

  const headerLabel = viewMode === 'month'
    ? cursor.format('MMMM YYYY')
    : `${weekCursor.format('D MMM')} – ${weekCursor.add(6, 'day').format('D MMM')}`;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        {/* ---- Header: nav + view toggle ---- */}
        <View style={styles.header}>
          <Pressable onPress={() => (viewMode === 'month' ? changeMonth(-1) : changeWeek(-1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={theme.textOnPrimary} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>{headerLabel}</Text>
            <Text style={styles.headerSub}>{locationName || 'Location'}</Text>
          </View>
          <Pressable onPress={() => (viewMode === 'month' ? changeMonth(1) : changeWeek(1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color={theme.textOnPrimary} />
          </Pressable>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.segment}>
            {VIEW_MODES.map((m) => (
              <Pressable
                key={m.key}
                style={[styles.segmentItem, viewMode === m.key && styles.segmentItemActive]}
                onPress={() => setViewMode(m.key)}
              >
                <Text style={[styles.segmentLabel, viewMode === m.key && styles.segmentLabelActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.btnRow}>

            <Pressable
              style={styles.todayBtn}
              onPress={() => selectDate(dayjs().format('YYYY-MM-DD'))}
            >
              <Text style={styles.todayBtnText}>Today</Text>
            </Pressable>

            <Pressable style={styles.todayBtn} onPress={() => setDrawerOpen(true)}>
              <Ionicons name="list" size={14} color={theme.skyText} />
            </Pressable>
          </View>
        </View>

        {/* ---- Swipeable grid (month or week) ---- */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <SwipeGrid
            key={viewMode}
            mode={viewMode}
            onSwipe={(dir) => (viewMode === 'month' ? changeMonth(dir) : changeWeek(dir))}
          >
            {loading && monthCells.length === 0 ? (
              <ActivityIndicator style={{ marginVertical: 30 }} color={theme.accent} />
            ) : (
              <>
                <View style={styles.weekdayRow}>
                  {WEEKDAYS.map((w, i) => (
                    <Text key={i} style={[styles.weekday, { width: CELL_SIZE }]}>{w}</Text>
                  ))}
                </View>
                <View style={styles.grid}>
                  {(() => {
                    const cells = viewMode === 'month' ? monthCells : weekCells;
                    const hasRealDays = cells.some((c) => c && c.date);

                    if (!hasRealDays) {
                      return (
                        <View style={styles.emptyPlaceholder}>
                          <Text style={styles.emptyPlaceholderText}>
                            No data available
                          </Text>
                          <Text style={styles.emptyPlaceholderSubText}>
                            {viewMode === 'month'
                              ? 'No dates found for this month'
                              : 'No dates found for this week'}
                          </Text>
                        </View>
                      );
                    }

                    return cells.map((d, i) => {
                      if (!d) return <View key={`blank-${i}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                      const dateStr = dayjs(d.date).format('YYYY-MM-DD');
                      const isSelected = dateStr === selectedDate;
                      return (
                        <Pressable
                          key={dateStr}
                          onPress={() => selectDate(dateStr)}
                          style={[
                            styles.cell,
                            { width: CELL_SIZE, height: viewMode === 'month' ? CELL_SIZE : CELL_SIZE + 14 },
                            isSelected && styles.cellSelected,
                            d.is_today && !isSelected && styles.cellToday,
                          ]}
                        >
                          <MoonPhase
                            tithiNumber={d.tithi_number}
                            paksha={d.paksha}
                            size={viewMode === 'month' ? 20 : 26}
                            moonColor={d.has_festival ? theme.sacred : '#D3D1C7'}
                            skyColor={isSelected ? theme.primaryTint : theme.surface}
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
                    });
                  })()}
                </View>
              </>
            )}
          </SwipeGrid>

          <View style={styles.legend}>
            <Text style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.sacred }]} /> Festival
            </Text>
            <Text style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.accent }]} /> My event
            </Text>
          </View>

          {/* ---- Everything below scrolls together: day panel + agenda ---- */}
          <DayPanel
            date={selectedDate}
            detail={selectedDetail}
            loading={detailLoading}
            dayEvents={selectedDayEvents}
            onFestivalPress={(code) => navigation.navigate('EventDetail', { code, date: selectedDate })}
            onEventPress={(userEventId) => navigation.navigate('EventDetail', { userEventId })}
            onAddEvent={() => navigation.navigate('AddEvent', { prefillDate: selectedDate })}
            trackedMap={trackedMap}
            expandedCode={expandedCode}
            reminderSelections={reminderSelections}
            busyCodes={busyCodes}
            onOpenReminderPicker={openReminderPicker}
            onToggleReminderOption={toggleReminderOption}
            onConfirmAddToCalendar={confirmAddToCalendar}
            onRemoveFromCalendar={removeFromCalendar}
            onCloseReminderPicker={closeReminderPicker}
          />
        </ScrollView>

        <MonthAgendaDrawer
          visible={drawerOpen}
          monthLabel={cursor.format('MMMM YYYY')}
          festivals={currentMonthAgenda.filter((ev) => ev.kind === 'religious')}
          personalEvents={currentMonthAgenda.filter((ev) => ev.kind === 'user')}
          onClose={() => setDrawerOpen(false)}
          onSelectDate={selectDate}
        />
      </View>

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        autoClose={statusModal.type === 'success'}
        onPrimary={hideStatus}
        onRequestClose={hideStatus}
      />
    </Screen>
  );
}

function SwipeGrid({ mode, onSwipe, children }) {
  const scrollRef = useRef(null);
  const width = SCREEN_WIDTH;
  const ignoreNextEnd = useRef(false);

  const handleScrollEnd = (e) => {
    if (ignoreNextEnd.current) {
      ignoreNextEnd.current = false;
      return;
    }
    const x = e.nativeEvent.contentOffset.x;
    const page = Math.round(x / width);
    if (page !== 1) {
      onSwipe(page - 1); // -1 = swiped to prev, +1 = swiped to next
      ignoreNextEnd.current = true; // the reset below will also fire this handler — skip it
      scrollRef.current?.scrollTo({ x: width, animated: false });
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleScrollEnd}
      contentOffset={{ x: width, y: 0 }}
      style={{ flexGrow: 0 }}
    >
      <View style={{ width }}>{children}</View>
      <View style={{ width }}>{children}</View>
      <View style={{ width }}>{children}</View>
    </ScrollView>
  );
}

function DayPanel({ date, detail, loading, dayEvents, onFestivalPress, onEventPress, onAddEvent,
  trackedMap, expandedCode, reminderSelections, busyCodes,
  onOpenReminderPicker, onToggleReminderOption, onConfirmAddToCalendar, onRemoveFromCalendar, onCloseReminderPicker
}) {
  const parseTime = (t) => dayjs(t, 'hh:mm A');
  const muhurtas = detail?.extra
    ? Object.entries(detail.extra).sort(([, a], [, b]) => parseTime(a.start_time).diff(parseTime(b.start_time)))
    : [];
  const auspicious = muhurtas.filter(([, m]) => m.auspicious);
  const inauspicious = muhurtas.filter(([, m]) => !m.auspicious);

  const getEventTypeLabel = (key) => EVENT_TYPES.find((t) => t.key === key)?.label ?? key;

  const formatTime = (t) => (t ? dayjs(t, 'HH:mm:ss').format('h:mm A') : null);
  const parseHHMMSS = (t) => (t ? dayjs(t, "HH:mm:ss") : null);

  const festivals = groupReligiousEvents(detail?.religious_events, date);

  function groupReligiousEvents(events = [], baseDate) {
    const byName = {};
    events.forEach((ev) => {
      (byName[ev.name] ||= []).push(ev);
    });

    return Object.entries(byName).map(([name, group]) => {
      const first = group[0];

      if (group.length === 1) {
        const range = formatTimeRange(formatTime(first.start_time), formatTime(first.end_time));
        return {
          key: first.code,
          name,
          name_local: first.name_local,
          importance: first.importance,
          isMultiDay: false,
          singleLine: range, // e.g. "6:00 AM – 7:00 PM", or just one time, or null
        };
      }

      const day1 = group[0];
      const day2 = group[1];

      const start = parseHHMMSS(day1.start_time);
      const end = parseHHMMSS(day2.end_time);

      const startedPreviousDay = start && end && start.isAfter(end);

      const fromDate = startedPreviousDay ? dayjs(baseDate).subtract(1, "day") : dayjs(baseDate);
      const toDate = startedPreviousDay ? dayjs(baseDate) : dayjs(baseDate).add(1, "day");
      return {
        key: `${first.code}`,
        name,
        name_local: first.name_local,
        importance: first.importance,
        isMultiDay: true,
        from: day1.start_time ? { date: fromDate.format("ddd, D MMM"), time: formatTime(day1.start_time) } : null,
        to: day2.end_time ? { date: toDate.format("ddd, D MMM"), time: formatTime(day2.end_time) } : null,
      };
    });
  }

  function formatTimeRange(start, end) {
    if (start && end) return `${start} – ${end}`;
    return start || end || null;
  }

  function formatTimeRange(start, end) {
    if (start && end) return `${start} – ${end}`;
    return start || end || null;
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.panelDate}>{dayjs(date).format('dddd, D MMMM')}</Text>

      {loading || !detail ? (
        <ActivityIndicator color={theme.accent} style={{ paddingVertical: 20 }} />
      ) : (
        <>
          <Text style={styles.panelTithi}>
            {detail.lunar_month} {detail.paksha} · {detail.tithi_local || detail.tithi}
            {detail.nakshatra ? ` · ${detail.nakshatra}` : ''}
          </Text>

          {/* Festival */}
          {festivals.map((f) => {
            const tracked = trackedMap[f.key]?.is_tracked;
            const busy = !!busyCodes[f.key];
            const expanded = expandedCode === f.key;
            const selectedMinutes = reminderSelections[f.key] ?? [1440];

            return (
              <View key={f.key} style={styles.festivalCard}>
                <Pressable style={styles.festivalCardRow} onPress={() => onFestivalPress(f.key)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.festivalTitle}>{f.name}</Text>
                    <Text style={styles.festivalSub}>
                      {f.name_local} · {f.importance === 'MAJOR' ? 'Major festival' : 'Festival'}
                    </Text>

                    {f.isMultiDay ? (
                      <View style={{ marginTop: 4, gap: 2 }}>
                        {f.from && (
                          <Text style={styles.festivalTiming}>
                            <Text style={styles.festivalTimingLabel}>From  </Text>
                            {f.from.date} · {f.from.time}
                          </Text>
                        )}
                        {f.to && (
                          <Text style={styles.festivalTiming}>
                            <Text style={styles.festivalTimingLabel}>To      </Text>
                            {f.to.date} · {f.to.time}
                          </Text>
                        )}
                      </View>
                    ) : (
                      f.singleLine && <Text style={styles.festivalTiming}>{f.singleLine}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.sacredMuted} />
                </Pressable>

                <View style={{ flexDirection: 'row', gap: '8', flexWrap: 'wrap' }}>
                  <Pressable
                    style={[styles.calendarPill, tracked && styles.calendarPillActive]}
                    disabled={busy}
                    onPress={() => (tracked ? onRemoveFromCalendar(f) : onOpenReminderPicker(f.key))}
                  >
                    <Ionicons
                      name={tracked ? 'checkmark-circle' : 'calendar-outline'}
                      size={14}
                      color={tracked ? theme.textOnPrimary : theme.sacredMuted}
                    />
                    <Text style={[styles.calendarPillText, tracked && styles.calendarPillTextActive]}>
                      {tracked ? 'Added to calendar' : 'Add to calendar'}
                    </Text>
                  </Pressable>

                  {tracked &&
                    <Pressable
                      style={[styles.calendarPill, styles.reminderCloseBtn]}
                      disabled={busy}
                      onPress={() => onRemoveFromCalendar(f)}
                    >
                      <Ionicons
                        name='close'
                        size={14}
                        color={theme.error}
                      />
                      <Text style={styles.reminderCloseText}>
                        Untrack from my Calendar
                      </Text>
                    </Pressable>}

                </View>

                {
                  expanded && (
                    <View style={styles.reminderInline}>
                      <View style={styles.reminderHeaderRow}>
                        <Text style={styles.reminderHeaderText}>Remind me</Text>
                        {/* <Pressable hitSlop={8} onPress={() => onCloseReminderPicker(f.key)}>
                        <Ionicons name="close" size={16} color={theme.textMuted} />
                      </Pressable> */}
                      </View>
                      <View style={styles.reminderChipRow}>
                        {REMINDER_OPTIONS.map((opt) => {
                          const on = selectedMinutes.includes(opt.minutes);
                          return (
                            <Pressable
                              key={opt.minutes}
                              style={[styles.reminderChip, on && styles.reminderChipActive]}
                              onPress={() => onToggleReminderOption(f.key, opt.minutes)}
                            >
                              <Text style={[styles.reminderChipText, on && styles.reminderChipTextActive]}>{opt.label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          style={[styles.reminderConfirmBtn, busy && { opacity: 0.6 }]}
                          disabled={busy}
                          onPress={() => onConfirmAddToCalendar(f)}
                        >
                          <Text style={styles.reminderConfirmText}>{busy ? 'Adding...' : 'Confirm'}</Text>
                        </Pressable>
                        <Pressable
                          style={styles.reminderCloseBtn}
                          disabled={busy}
                          onPress={() => onCloseReminderPicker(f.key)}
                        >
                          <Text style={styles.reminderCloseText}>Close</Text>
                        </Pressable>
                      </View>

                    </View>
                  )
                }
              </View>
            );
          })}

          {/* Personal events */}
          {dayEvents.length > 0 ? (
            <View style={styles.personalEventsCard}>
              <Text style={styles.personalEventsTitle}>Personal Events</Text>
              {dayEvents.map((e) => (
                <Pressable key={e.id ?? `${e.event_date}-${e.title}`} style={styles.userEventRow} onPress={() => onEventPress(e.id)}>
                  <View style={styles.eventDot} />
                  <Text style={styles.userEventText}>{e.title || e.name}</Text>
                  <Text style={[styles.chipText, styles.chipActive]}>({getEventTypeLabel(e.event_type)})</Text>
                  <Ionicons name="chevron-forward" size={13} color={theme.accent} />
                </Pressable>
              ))}
            </View>
          ) : (
            !festivals.length && (
              <Pressable style={styles.addButton} onPress={onAddEvent}>
                <Ionicons name="add" size={15} color="#fff" />
                <Text style={styles.addButtonText}> Add event on this day</Text>
              </Pressable>
            )
          )}

          {/* Muhurtas */}
          {muhurtas.length > 0 && (
            <View style={{ marginTop: spacing.base }}>
              <Text style={styles.muhurtaSectionTitle}>Auspicious Muhurtas</Text>
              <View style={styles.muhurtaGrid}>
                {auspicious.map(([name, m]) => (
                  <View key={name} style={[styles.muhurtaChip, styles.muhurtaChipGood]}>
                    <Ionicons name="checkmark-circle" size={13} color={theme.sacred} />
                    <View style={{ marginLeft: 6 }}>
                      <Text style={styles.muhurtaName}>{name}</Text>
                      <Text style={styles.muhurtaTime}>{m.start_time} – {m.end_time}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {inauspicious.length > 0 && (
                <>
                  <Text style={[styles.muhurtaSectionTitle, { marginTop: spacing.base }]}>
                    Avoid (Inauspicious)
                  </Text>
                  <View style={styles.muhurtaGrid}>
                    {inauspicious.map(([name, m]) => (
                      <View key={name} style={[styles.muhurtaChip, styles.muhurtaChipBad]}>
                        <Ionicons name="close-circle" size={13} color={theme.textMuted} />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={styles.muhurtaName}>{name}</Text>
                          <Text style={styles.muhurtaTime}>{m.start_time} – {m.end_time}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </>
      )
      }
    </View >
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.primary, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: theme.textOnPrimary, fontSize: 16, fontWeight: '600' },
  headerSub: { color: theme.textOnPrimary, fontSize: 11 },

  toggleRow: {
    backgroundColor: theme.primary, paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  segmentItem: { paddingVertical: 5, paddingHorizontal: 16, borderRadius: radius.pill },
  segmentItemActive: { backgroundColor: theme.moon },
  segmentLabel: { color: theme.skyMuted, fontSize: 12, fontWeight: '600' },
  segmentLabelActive: { color: theme.sky },
  todayBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  todayBtnText: { color: theme.textOnPrimary, fontSize: 12, fontWeight: '600' },

  weekdayRow: { flexDirection: 'row', paddingTop: 10, paddingHorizontal: 16 },
  weekday: { textAlign: 'center', fontSize: 11, color: theme.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  cell: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.s, marginVertical: 1 },
  cellSelected: { backgroundColor: theme.primaryTint, borderWidth: 1.5, borderColor: theme.primary },
  cellToday: { backgroundColor: theme.sacredTint },
  cellDate: { fontSize: 11, color: theme.text, marginTop: 1 },
  cellDateToday: { color: theme.sacredMuted, fontWeight: '700' },
  cellDateUserEvent: { color: theme.accentDeep, fontWeight: '700' },
  cellDotRow: { height: 6, marginTop: 2, justifyContent: 'center', alignItems: 'center' },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent },

  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingTop: 8 },
  legendItem: { fontSize: 11, color: theme.textMuted, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },

  panel: {
    marginTop: 14, marginHorizontal: 16, backgroundColor: theme.surfaceAlt,
    borderRadius: radius.l, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    padding: 14,
  },
  panelDate: { fontSize: 15, fontWeight: '700', color: theme.text },
  panelTithi: { fontSize: 12, color: theme.textMuted, marginTop: 2, marginBottom: 10 },

  festivalCard: {
    backgroundColor: theme.sacredTint,
    borderLeftWidth: 3, borderLeftColor: theme.sacred,
    borderRadius: radius.m, padding: 12, marginBottom: 8,
  },
  festivalCardRow: { flexDirection: 'row', alignItems: 'center' },
  festivalTitle: { fontSize: fontSize.lg, fontWeight: '600', color: theme.sacredText },
  festivalSub: { fontSize: fontSize.sm, color: theme.sacredMuted, marginTop: 1 },
  festivalTimingLabel: { fontWeight: '700', color: theme.sacredText },
  festivalTiming: { fontSize: fontSize.sm, color: theme.sacredMuted, marginTop: 3, fontWeight: '600' },

  personalEventsCard: {
    backgroundColor: theme.accentTint, borderLeftWidth: 3, borderLeftColor: theme.accent,
    borderRadius: radius.m, padding: 12, gap: 6, marginBottom: 8,
  },
  personalEventsTitle: { fontSize: 14, fontWeight: '600', color: theme.accentDeep, marginBottom: 2 },
  userEventRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userEventText: { fontSize: 13, color: theme.text, marginLeft: 6, flex: 1 },
  chipActive: { backgroundColor: theme.surface, borderColor: theme.accent, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 12, color: theme.accentDeep, fontWeight: '600' },

  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, borderRadius: radius.m, paddingVertical: 10, marginBottom: 8,
  },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  muhurtaSectionTitle: { fontSize: fontSize.sm, fontWeight: '700', color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  muhurtaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muhurtaChip: {
    flexDirection: 'row', alignItems: 'center', width: '48%',
    borderRadius: radius.m, padding: 8,
  },
  muhurtaChipGood: { backgroundColor: theme.sacredTint },
  muhurtaChipBad: { backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  muhurtaName: { fontSize: fontSize.base, fontWeight: '700', color: theme.text },
  muhurtaTime: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: 2 },

  agendaContent: { paddingHorizontal: 16, paddingTop: 16, gap: 6 },
  agendaTitle: { fontSize: 13, fontWeight: '600', color: theme.textMuted, marginBottom: 2 },
  agendaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 10,
    borderLeftWidth: 3, borderRadius: radius.s,
  },
  agendaRowFestival: { borderLeftColor: theme.sacred, backgroundColor: theme.sacredTint + '40' },
  agendaRowPersonal: { borderLeftColor: theme.accent, backgroundColor: theme.accentTint + '40' },
  agendaRowSelected: { borderWidth: 1, borderColor: theme.accent },
  agendaDate: { fontSize: 12, color: theme.accent, fontWeight: '600', minWidth: 42 },
  agendaEventTitle: { fontSize: 13, fontWeight: '600', color: theme.text },
  agendaSub: { fontSize: 11, color: theme.textMuted, marginTop: 1 },
  emptyPlaceholder: {
    flex: 1,
    width: '100%',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary || '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyPlaceholderSubText: {
    fontSize: 13,
    color: theme.textMuted || '#999',
    textAlign: 'center',
  },
  calendarPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1, borderColor: theme.sacredMuted,
    backgroundColor: theme.surface,
    flexShrink: 1,
  },
  calendarPillActive: { backgroundColor: theme.sacred, borderColor: theme.sacred },
  calendarPillText: { fontSize: fontSize.xs, fontWeight: '600', color: theme.sacredMuted },
  calendarPillTextActive: { color: theme.textOnPrimary },

  reminderInline: { marginTop: 10, gap: 8 },
  reminderChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reminderChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
  },
  reminderChipActive: { backgroundColor: theme.sacred, borderColor: theme.sacred },
  reminderChipText: { fontSize: fontSize.xs, fontWeight: '600', color: theme.textMuted },
  reminderChipTextActive: { color: theme.textOnPrimary },

  reminderConfirmBtn: {
    alignSelf: 'flex-start', backgroundColor: theme.sacredMuted,
    borderRadius: radius.m, paddingHorizontal: 14, paddingVertical: 7,
  },
  reminderCloseBtn: {
    alignSelf: 'flex-start', backgroundColor: theme.errorTint, borderColor: theme.error, borderWidth: 1,
    borderRadius: radius.m, paddingHorizontal: 14, paddingVertical: 7,
  },
  reminderCloseText: { color: theme.error, fontSize: fontSize.xs, fontWeight: '700' },
  reminderConfirmText: { color: theme.textOnPrimary, fontSize: fontSize.xs, fontWeight: '700' },
  reminderHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderHeaderText: { fontSize: fontSize.xs, fontWeight: '700', color: theme.sacredMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  untrackPillText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: theme.errorText,
    flexShrink: 1,
  },
});