// MyEventsScreen.js — everything the user personally added or tracks:
// own puja/family events AND festivals they've tapped "Add to My Calendar"
// on (those show up as UserEvent rows with linked_religious_event set).
import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, Pressable, RefreshControl,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import dayjs from 'dayjs';
import { listUserEvents } from '../services/api';
import { theme, radius } from '../screens/theme';
import Screen from '../components/Screen';

const TYPE_LABEL = {
  PUJA: 'Puja', BRATA: 'Brata', FAMILY: 'Family',
  TEMPLE_VISIT: 'Temple visit', OTHER: 'Other',
};

export default function MyEventsScreen({ navigation }) {
  const [events, setEvents] = useState(null);   // null = initial loading
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listUserEvents();
      setEvents(data);
    } catch (e) {
      console.warn(e);
      setEvents([]);
    }
  }, []);

  // Refetch every time the tab gains focus — catches edits/deletes made
  // from EventDetail without needing a manual pull-to-refresh.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (events === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  const today = dayjs().format('YYYY-MM-DD');
  const upcoming = events.filter((e) => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = events.filter((e) => e.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const sections = [
    { title: 'Upcoming', data: upcoming },
    { title: 'Past', data: past },
  ].filter((s) => s.data.length > 0);

  if (sections.length === 0) {
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
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        style={{ backgroundColor: theme.surface }}
        data={sections}
        ListHeaderComponent={<Header />}
        keyExtractor={(s) => s.title}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.data.map((ev) => (
              <EventRow key={ev.id} event={ev}
                onPress={() => navigation.navigate('EventDetail', { userEventId: ev.id })} />
            ))}
          </View>
        )}
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

function EventRow({ event, onPress }) {
  const isTracked = !!event.linked_religious_event;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{dayjs(event.event_date).format('D')}</Text>
        <Text style={styles.dateMonth}>{dayjs(event.event_date).format('MMM')}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.rowSub}>
          {TYPE_LABEL[event.event_type] || event.event_type}
          {event.recurrence_type === 'YEARLY' ? ' · yearly' : ''}
          {event.participants?.length ? ` · ${event.participants.length} people` : ''}
        </Text>
      </View>
      {isTracked ? (
        <Ionicons name="flag" size={16} color={theme.sacredMuted} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: theme.sky, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.skyText },
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
  sectionHeader: {
    fontSize: 13, fontWeight: '600', color: theme.textMuted,
    marginTop: 16, marginHorizontal: 16, marginBottom: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 14, paddingVertical: 10, paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
  },
  dateBox: { width: 42, alignItems: 'center' },
  dateDay: { fontSize: 16, fontWeight: '700', color: theme.accent },
  dateMonth: { fontSize: 10, color: theme.textMuted, textTransform: 'uppercase' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
  rowSub: { fontSize: 12, color: theme.textMuted, marginTop: 1 },
});
