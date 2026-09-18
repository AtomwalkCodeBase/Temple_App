// MyEventsScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, Pressable, RefreshControl,
  ActivityIndicator, StyleSheet,
  Image,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import dayjs from 'dayjs';
import { listUserEvents } from '../../services/api';
import { theme, radius } from '../../theme/theme';
import Screen from '../../components/Screen';
import FloatingActionMenu from '../../components/FloatingActionMenu';
import TempleIcon from '../../assets/TempleIcon';


const TYPE_LABEL = {
  PUJA: 'Puja', BRATA: 'Brata', FAMILY: 'Family',
  TEMPLE_VISIT: 'Temple visit', OTHER: 'Other',
};
const TYPE_ICON = {
  PUJA: 'flame-outline', BRATA: 'flower-outline', FAMILY: 'people-outline',
  OTHER: 'ellipse-outline',
};

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PERSONAL', label: 'Personal' },
  { key: 'FESTIVAL', label: 'Festivals' },
  { key: 'RECURRING', label: 'Recurring' },
];

const TYPE_FILTERS = [
  { key: 'ALL', label: 'All types' },
  { key: 'PUJA', label: 'Puja' },
  { key: 'BRATA', label: 'Brata' },
  { key: 'FAMILY', label: 'Family' },
  { key: 'TEMPLE_VISIT', label: 'Temple visit' },
  { key: 'OTHER', label: 'Other' },
];

const RELIGIOUS_TYPES = [
  { key: 'ALL', label: 'All' },
  { key: 'EKADASHI', label: 'Ekadashi' },
  { key: 'PURNIMA', label: 'Purnima' },
  { key: 'AMAVASYA', label: 'Amavasya' },
  { key: 'SANKRANTI', label: 'Sankranti' },
  { key: 'BRATA', label: 'Brata' },
];

export default function MyEventsScreen() {
  const navigation = useNavigation();
  const listRef = useRef(null);
  const route = useRoute();

  const [events, setEvents] = useState(null);   // null = initial loading
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [religiousTypeFilter, setReligiousTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showAllPast, setShowAllPast] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [monthFilter, setMonthFilter] = useState(dayjs().format('YYYY-MM'));
  const [skipMonthFilter, setSkipMonthFilter] = useState(false);

  const PAST_PREVIEW_COUNT = 5;

  useFocusEffect(useCallback(() => {
    if (route.params?.presetReligiousFilter) {
      setFilter('ALL');
      setTypeFilter('ALL');
      setReligiousTypeFilter(route.params.presetReligiousFilter);
      setSkipMonthFilter(true);
      navigation.setParams({ presetReligiousFilter: undefined });
    }
    if (route.params?.presetTypeFilter) {
      setFilter('ALL');
      setReligiousTypeFilter('ALL');
      setTypeFilter(route.params.presetTypeFilter);
      setSkipMonthFilter(true);
      navigation.setParams({ presetTypeFilter: undefined });
    }
  }, [route.params?.presetReligiousFilter, route.params?.presetTypeFilter]));

  const load = useCallback(async () => {
    try {
      const data = await listUserEvents();
      setEvents(data);
    } catch (e) {
      console.warn(e);
      setEvents([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useFocusEffect(useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []));
  useEffect(() => { setShowAllPast(false) }, [filter, typeFilter, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (!events) return [];
    let result = events;
    switch (filter) {
      case 'PERSONAL':
        result = result.filter((e) => !e.linked_religious_event);
        break;
      case 'FESTIVAL':
        result = result.filter((e) => !!e.linked_religious_event);
        break;
      case 'RECURRING':
        result = result.filter((e) => e.recurrence_type && e.recurrence_type !== 'NONE');
        break;
      default:
        break;
    }
    if (typeFilter !== 'ALL') {
      result = result.filter((e) => e.event_type === typeFilter);
    }
    if (religiousTypeFilter !== 'ALL') {
      result = result.filter((e) => e.linked_religious_event?.event_type === religiousTypeFilter);
    }
    if (!skipMonthFilter) {
      result = result.filter((e) => e.event_date?.startsWith(monthFilter));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((e) =>
        e.title?.toLowerCase().includes(q) ||
        e.subtitle?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, filter, typeFilter, religiousTypeFilter, monthFilter, skipMonthFilter, search]);

  if (events === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.surface }}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      </View>
    );
  }

  const today = dayjs().format('YYYY-MM-DD');
  const todayEvents = filtered.filter((e) => e.event_date === today);
  const upcoming = filtered.filter((e) => e.event_date > today).sort((a, b) => a.event_date.localeCompare(b.event_date));
  const pastAll = filtered.filter((e) => e.event_date < today).sort((a, b) => b.event_date.localeCompare(a.event_date));
  const past = showAllPast ? pastAll : pastAll.slice(0, PAST_PREVIEW_COUNT);

  const sections = [
    { title: 'Today', data: todayEvents },
    { title: 'Upcoming', data: upcoming },
    { title: 'Past', data: past, totalPast: pastAll.length },
  ].filter((s) => s.data.length > 0);

  const fabActions = [
    { key: 'recurring', label: 'Add recurring event', icon: 'repeat-outline', onPress: () => navigation.navigate('BulkReminders') },
    { key: 'event', label: 'Add event', icon: 'calendar-outline', onPress: () => navigation.navigate('AddEvent') },
  ];

  if (events.length === 0) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <Header />
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={40} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySub}>
            Add a puja or family event, or track a festival from its detail page.
          </Text>
          <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('AddEvent')}>
            <Text style={styles.emptyButtonText}>+ Add your first event</Text>
          </Pressable>
        </View>
        <FloatingActionMenu actions={fabActions} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        ref={listRef}
        style={{ backgroundColor: theme.surface }}
        data={sections}
        keyExtractor={(s) => s.title}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <Header />
            <SearchBar value={search} onChange={setSearch} />
            <FilterTrigger
              filter={filter}
              typeFilter={typeFilter}
              religiousTypeFilter={religiousTypeFilter}
              monthFilter={monthFilter}
              skipMonthFilter={skipMonthFilter}
              onPress={() => setFilterModalVisible(true)}
            />
          </>
        }
        stickyHeaderIndices={[]}
        renderItem={({ item: section }) => (
          <View>
            <Text style={[styles.sectionHeader, section.title === 'Today' && styles.sectionHeaderToday]}>
              {section.title} · {section.title === 'Past' ? section.totalPast : section.data.length}
            </Text>
            {section.data.map((ev) => (
              <EventRow key={ev.id} event={ev} isToday={section.title === 'Today'}
                onPress={() => navigation.navigate('EventDetail', { userEventId: ev.id })} />
            ))}
            {section.title === 'Past' && section.totalPast > PAST_PREVIEW_COUNT && (
              <Pressable
                style={styles.showMoreBtn}
                onPress={() => setShowAllPast((prev) => !prev)}
              >
                <Text style={styles.showMoreText}>
                  {showAllPast
                    ? 'Show less'
                    : `Show ${section.totalPast - PAST_PREVIEW_COUNT} more past event${section.totalPast - PAST_PREVIEW_COUNT === 1 ? '' : 's'}`}
                </Text>
                <Ionicons name={showAllPast ? 'chevron-up' : 'chevron-down'} size={14} color={theme.accent} />
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.filterEmpty}>
            <Ionicons name="filter-outline" size={28} color={theme.textMuted} />
            <Text style={styles.filterEmptyText}>No {filter.toLowerCase()} events</Text>
          </View>
        }
      />
      <FloatingActionMenu actions={fabActions} />

      <FilterSheet
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filter={filter}
        typeFilter={typeFilter}
        religiousTypeFilter={religiousTypeFilter}
        monthFilter={monthFilter}
        onApply={(f, tf, rf, mf) => {
          setFilter(f); setTypeFilter(tf); setReligiousTypeFilter(rf);
          setMonthFilter(mf);
          setSkipMonthFilter(false); // any manual apply/reset re-enables the month filter
          setFilterModalVisible(false);
        }}
      />
    </Screen>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Events</Text>
    </View>
  );
}

// ── new component, alongside FilterBar
function SearchBar({ value, onChange }) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={16} color={theme.textMuted} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search events..."
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={theme.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

function EventRow({ event, isToday, onPress }) {
  const isTracked = !!event.linked_religious_event;
  const isRecurring = event.recurrence_type && event.recurrence_type !== 'NONE';

  return (
    <Pressable style={[styles.row, isToday && styles.rowToday]} onPress={onPress}>
      {isToday ? (
        <View style={styles.todayBox}>
          <Text style={styles.todayBoxText}>TODAY</Text>
        </View>
      ) : (
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{dayjs(event.event_date).format('D')}</Text>
          <Text style={styles.dateMonth}>{dayjs(event.event_date).format('MMM')}</Text>
        </View>
      )}

      <View
        style={[
          styles.typeIcon,
          isTracked ? styles.typeIconFestival : styles.typeIconPersonal,
        ]}
      >
        {!isTracked && event.event_type === 'TEMPLE_VISIT' ? (
          <TempleIcon size={14} color={theme.accent} />
        ) : (
          <Ionicons
            name={isTracked ? 'flag-outline' : (TYPE_ICON[event.event_type] || 'ellipse-outline')}
            size={15}
            color={isTracked ? theme.sacredMuted : theme.accent}
          />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{event.title}</Text>
        <View style={styles.rowMetaLine}>
          <Text style={styles.rowSub}>
            {isTracked ? 'Festival reminder' : (TYPE_LABEL[event.event_type] || event.event_type)}
          </Text>
          {event.start_time && (
            <>
              <Text style={styles.rowDot}>·</Text>
              <Ionicons name="time-outline" size={11} color={theme.textMuted} />
              <Text style={styles.rowSub}> {dayjs(`2000-01-01T${event.start_time}`).format('h:mm A')}</Text>
            </>
          )}
          {event.participants?.length > 0 && (
            <>
              <Text style={styles.rowDot}>·</Text>
              <Text style={styles.rowSub}>{event.participants.length} people</Text>
            </>
          )}
        </View>
      </View>

      {isRecurring && (
        <View style={styles.recurringBadge}>
          <Ionicons name="repeat" size={12} color={theme.accentDeep} />
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </Pressable>
  );
}

// ── new component: bottom sheet with both filter groups, applied together
function FilterSheet({ visible, onClose, filter, typeFilter, religiousTypeFilter, monthFilter, onApply }) {
  const [draftFilter, setDraftFilter] = useState(filter);
  const [draftType, setDraftType] = useState(typeFilter);
  const [draftReligious, setDraftReligious] = useState(religiousTypeFilter);
  const [draftMonth, setDraftMonth] = useState(monthFilter);

  useEffect(() => {
    if (visible) {
      setDraftFilter(filter);
      setDraftType(typeFilter);
      setDraftReligious(religiousTypeFilter);
      setDraftMonth(monthFilter);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sheetTitle}>Filter events</Text>

            <Text style={styles.sheetGroupLabel}>Month</Text>
            <View style={styles.monthStepper}>
              <Pressable style={styles.monthStepBtn} onPress={() => setDraftMonth((m) => dayjs(m).subtract(1, 'month').format('YYYY-MM'))}>
                <Ionicons name="chevron-back" size={18} color={theme.accent} />
              </Pressable>
              <Text style={styles.monthStepLabel}>{dayjs(draftMonth).format('MMMM YYYY')}</Text>
              <Pressable style={styles.monthStepBtn} onPress={() => setDraftMonth((m) => dayjs(m).add(1, 'month').format('YYYY-MM'))}>
                <Ionicons name="chevron-forward" size={18} color={theme.accent} />
              </Pressable>
            </View>

            <Text style={styles.sheetGroupLabel}>Category</Text>
            <View style={styles.sheetChipRow}>
              {FILTERS.map((f) => {
                const active = draftFilter === f.key;
                return (
                  <Pressable key={f.key} style={[styles.sheetChip, active && styles.sheetChipActive]}
                    onPress={() => setDraftFilter(f.key)}>
                    <Text style={[styles.sheetChipText, active && styles.sheetChipTextActive]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetGroupLabel}>Type</Text>
            <View style={styles.sheetChipRow}>
              {TYPE_FILTERS.map((f) => {
                const active = draftType === f.key;
                return (
                  <Pressable key={f.key} style={[styles.sheetChip, active && styles.sheetChipActive]}
                    onPress={() => setDraftType(f.key)}>
                    <Text style={[styles.sheetChipText, active && styles.sheetChipTextActive]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetGroupLabel}>Religious observance</Text>
            <View style={styles.sheetChipRow}>
              {RELIGIOUS_TYPES.map((f) => {
                const active = draftReligious === f.key;
                return (
                  <Pressable key={f.key} style={[styles.sheetChip, active && styles.sheetChipActive]}
                    onPress={() => setDraftReligious(f.key)}>
                    <Text style={[styles.sheetChipText, active && styles.sheetChipTextActive]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.sheetActions}>
            <Pressable
              style={styles.sheetResetBtn}
              onPress={() => {
                setDraftFilter('ALL'); setDraftType('ALL'); setDraftReligious('ALL');
                setDraftMonth(dayjs().format('YYYY-MM'));
              }}
            >
              <Text style={styles.sheetResetText}>Reset</Text>
            </Pressable>
            <Pressable style={styles.sheetApplyBtn} onPress={() => onApply(draftFilter, draftType, draftReligious, draftMonth)}>
              <Text style={styles.sheetApplyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterTrigger({ filter, typeFilter, religiousTypeFilter, monthFilter, skipMonthFilter, onPress }) {
  const isCurrentMonth = monthFilter === dayjs().format('YYYY-MM');
  const activeCount =
    (filter !== 'ALL' ? 1 : 0) +
    (typeFilter !== 'ALL' ? 1 : 0) +
    (religiousTypeFilter !== 'ALL' ? 1 : 0) +
    (!skipMonthFilter && !isCurrentMonth ? 1 : 0);
  const filterLabel = FILTERS.find((f) => f.key === filter)?.label;
  const typeLabel = TYPE_FILTERS.find((f) => f.key === typeFilter)?.label;
  const religiousLabel = RELIGIOUS_TYPES.find((f) => f.key === religiousTypeFilter)?.label;
  const monthLabel = skipMonthFilter ? 'All months' : dayjs(monthFilter).format('MMM YYYY');

  return (
    <Pressable style={styles.filterTrigger} onPress={onPress}>
      <Ionicons name="options-outline" size={16} color={theme.accent} />
      <Text style={styles.filterTriggerText} numberOfLines={1}>
        {activeCount === 0 && isCurrentMonth
          ? 'Filter events'
          : [filterLabel, typeLabel !== 'All types' ? typeLabel : null, religiousTypeFilter !== 'ALL' ? religiousLabel : null, monthLabel]
            .filter(Boolean).join(' · ')}
      </Text>
      {activeCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.sky, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.skyText },

  filterBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: theme.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border,
  },
  filterChip: {
    paddingHorizontal: 13, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border,
  },
  filterChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  filterChipText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  filterChipTextActive: { color: '#fff' },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surface, paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: theme.textMuted, textAlign: 'center', marginTop: 4 },
  emptyButton: {
    backgroundColor: theme.accent, borderRadius: radius.m,
    paddingVertical: 11, paddingHorizontal: 20, marginTop: 18,
  },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  filterEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  filterEmptyText: { fontSize: 13, color: theme.textMuted, marginTop: 8 },

  sectionHeader: {
    fontSize: 13, fontWeight: '600', color: theme.textMuted,
    marginTop: 16, marginHorizontal: 16, marginBottom: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 14, paddingVertical: 10, paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
  },
  dateBox: { width: 38, alignItems: 'center' },
  dateDay: { fontSize: 16, fontWeight: '700', color: theme.accent },
  dateMonth: { fontSize: 10, color: theme.textMuted, textTransform: 'uppercase' },

  typeIcon: {
    width: 28, height: 28, borderRadius: radius.pill,
    justifyContent: 'center', alignItems: 'center',
  },
  typeIconPersonal: { backgroundColor: theme.accentTint },
  typeIconFestival: { backgroundColor: theme.sacredTint },

  rowTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
  rowMetaLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 1 },
  rowSub: { fontSize: 12, color: theme.textMuted },
  rowDot: { fontSize: 12, color: theme.textMuted, marginHorizontal: 4 },

  recurringBadge: {
    width: 22, height: 22, borderRadius: radius.pill,
    backgroundColor: theme.accentTint, justifyContent: 'center', alignItems: 'center',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 14, paddingVertical: 10, paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  rowToday: {
    borderLeftColor: theme.accent,
    backgroundColor: theme.accentTint + '30',
  },
  sectionHeaderToday: { color: theme.accent },
  todayBox: {
    width: 38, alignItems: 'center', justifyContent: 'center',
  },
  todayBoxText: {
    fontSize: 9, fontWeight: '700', color: theme.accent, letterSpacing: 0.3,
  },

  // ── styles: add these
  typeFilterBar: {
    paddingVertical: 8,
    backgroundColor: theme.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border,
  },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill,
    backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border,
  },
  typeChipActive: { backgroundColor: theme.accentDeep, borderColor: theme.accentDeep },
  typeChipText: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  typeChipTextActive: { color: '#fff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginTop: 10, marginBottom: 4,
    backgroundColor: theme.surfaceAlt, borderRadius: radius.m,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: theme.text, padding: 0 },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginHorizontal: 14, marginTop: 4, paddingVertical: 8,
  },
  showMoreText: { fontSize: 12, fontWeight: '600', color: theme.accent },
  // ── styles: add these for the trigger + sheet, remove filterBar/typeFilterBar/typeChip* (no longer used)
  filterTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginTop: 4, marginBottom: 6,
    backgroundColor: theme.surfaceAlt, borderRadius: radius.m,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  filterTriggerText: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.text },
  filterBadge: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  sheetOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(4,44,83,0.4)', justifyContent: 'flex-end', zIndex: 30,
  },
  sheet: {
    backgroundColor: theme.surface, borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border,
    alignSelf: 'center', marginBottom: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
  sheetGroupLabel: {
    fontSize: 12, fontWeight: '600', color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: 10,
  },
  sheetChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetChip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: radius.pill,
    backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border,
  },
  sheetChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  sheetChipText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  sheetChipTextActive: { color: '#fff' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  sheetResetBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: radius.m, borderWidth: 1, borderColor: theme.border,
  },
  sheetResetText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  sheetApplyBtn: {
    flex: 2, alignItems: 'center', paddingVertical: 12,
    borderRadius: radius.m, backgroundColor: theme.accent,
  },
  sheetApplyText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4,44,83,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.surface, borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28, maxHeight: '75%',
  },
  monthStepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.surfaceAlt, borderRadius: radius.m,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 10, paddingVertical: 6, marginBottom: 4,
  },
  monthStepBtn: { padding: 6 },
  monthStepLabel: { fontSize: 14, fontWeight: '600', color: theme.text },
});