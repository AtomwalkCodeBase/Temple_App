// BulkRemindersScreen.js — two bulk-creation flows, now separated into tabs:
//   1. Track every occurrence of a panji event TYPE in a year (e.g. all
//      Ekadashi) — fetch occurrences, let user pick which ones, then
//      hits /religious-events/track-by-type/ with the selected dates.
//   2. Create a standalone series on a weekday (e.g. next 5 Mondays) —
//      hits /user-events/weekday-series/
// These are deliberately different mechanisms (panji-driven vs pure
// Gregorian date math), so they're shown as separate tabs, not one form.

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import dayjs from 'dayjs';
import { trackByEventType, createWeekdaySeries, trackByEventSelected, getRecurringEventsType } from '../../services/api';
import { scheduleEventReminders } from '../../services/notifications';
import { theme, radius } from '../../theme/theme';
import Screen from '../../components/Screen';
import StatusModal from '../../components/StatusModal';

const EVENT_TYPES = [
  { key: 'EKADASHI', label: 'Ekadashi' },
  { key: 'PURNIMA', label: 'Purnima' },
  { key: 'AMAVASYA', label: 'Amavasya' },
  { key: 'SANKRANTI', label: 'Sankranti' },
  { key: 'BRATA', label: 'Brata' },
];

const WEEKDAYS = [
  { key: 0, label: 'Mon' }, { key: 1, label: 'Tue' }, { key: 2, label: 'Wed' },
  { key: 3, label: 'Thu' }, { key: 4, label: 'Fri' }, { key: 5, label: 'Sat' },
  { key: 6, label: 'Sun' },
];

const REMINDER_OPTIONS = [
  { minutes: 0, label: 'On the day' },
  { minutes: 1440, label: '1 day before' },
];

const TABS = [
  { key: 'BY_TYPE', label: 'By observance', icon: 'moon-outline' },
  { key: 'WEEKDAY', label: 'By weekday', icon: 'calendar-outline' },
];

export default function BulkRemindersScreen({ navigation }) {
  const [tab, setTab] = useState('BY_TYPE');

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set reminders</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={15} color={active ? theme.primary : theme.textMuted} />
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: theme.surface }} keyboardShouldPersistTaps="handled">
        {tab === 'BY_TYPE' ? <EventTypeSection navigation={navigation} /> : <WeekdaySeriesSection navigation={navigation} />}
        <View style={{ height: 30 }} />
      </ScrollView>
    </Screen>
  );
}

// ---- Tab 1: track by observance type ----
// Flow: pick type + year -> Fetch -> occurrence list appears -> user
// selects some/all -> Set reminders sends only the selected dates.
function EventTypeSection({ navigation }) {
  const [eventType, setEventType] = useState('EKADASHI');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [reminders, setReminders] = useState([1440]);
  const [fetching, setFetching] = useState(false);
  const [occurrences, setOccurrences] = useState(null); // null = not fetched yet
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [modal, setModal] = useState({ visible: false, type: 'error', title: '', message: '' });

  const showModal = (type, title, message) =>
    setModal({ visible: true, type, title, message });
  const hideModal = () => {
    setModal((m) => ({ ...m, visible: false }));
    navigation.navigate('MyEventsScreen', { presetReligiousFilter: eventType });
  }
  const toggleReminder = (minutes) =>
    setReminders((r) => (r.includes(minutes) ? r.filter((m) => m !== minutes) : [...r, minutes]));

  const fetchOccurrences = async () => {
    setFetching(true);
    setResult(null);
    try {
      const res = await getRecurringEventsType(eventType);
      const data = res.events
      setOccurrences(data);
      setSelected(new Set(data.map((o) => o.id)));
    } catch (e) {
      showModal('error', 'Could not fetch dates', e.message);
    } finally {
      setFetching(false);
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = occurrences?.length > 0 && selected.size === occurrences.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(occurrences.map((o) => o.id)));
  };

  const submit = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const selectedIds = occurrences.filter((o) => selected.has(o.id)).map((o) => o.id);
      await trackByEventSelected(selectedIds, eventType, Number(year), reminders);
      showModal('success', 'Reminders set', `Reminders set for ${selectedIds.length} date(s).`);
      setTimeout(() => {
        navigation.navigate('MyEventsScreen', { presetReligiousFilter: eventType });
      }, 3000);
    } catch (e) {
      showModal('error', 'Could not track', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Remind me every time this occurs</Text>
      <Text style={styles.sectionSub}>
        Pick an observance and year, fetch the list, then choose which ones to get reminded for.
      </Text>

      <Text style={styles.label}>1. Which observance</Text>
      <View style={styles.chipRow}>
        {EVENT_TYPES.map((t) => (
          <Pressable key={t.key} onPress={() => { setEventType(t.key); setOccurrences(null); setResult(null); }}
            style={[styles.chip, eventType === t.key && styles.chipActive]}>
            <Text style={[styles.chipText, eventType === t.key && styles.chipTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>2. Year</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={year}
        onChangeText={(v) => { setYear(v); setOccurrences(null); setResult(null); }} />

      <Pressable style={[styles.fetchButton, fetching && { opacity: 0.6 }]} onPress={fetchOccurrences} disabled={fetching}>
        {fetching ? <ActivityIndicator color={theme.primary} /> : (
          <>
            <Ionicons name="search-outline" size={16} color={theme.primary} />
            <Text style={styles.fetchButtonText}>Fetch {EVENT_TYPES.find(t => t.key === eventType)?.label} dates</Text>
          </>
        )}
      </Pressable>

      {occurrences && (
        <View style={styles.occurrenceBlock}>
          <View style={styles.occurrenceHeader}>
            <Text style={styles.label3}>3. Select dates ({selected.size}/{occurrences.length})</Text>
            <Pressable onPress={toggleAll} hitSlop={6}>
              <Text style={styles.selectAllText}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
            </Pressable>
          </View>

          <View style={styles.occurrenceList}>
            {occurrences.map((o) => {
              const on = selected.has(o.id);
              return (
                <Pressable key={o.id} style={styles.occurrenceRow} onPress={() => toggleOne(o.id)}>
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18}
                    color={on ? theme.primary : theme.textMuted} />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={styles.occurrenceName}>{o.title || o.label}</Text>
                    <Text style={styles.occurrenceDate}>{dayjs(o.date).format('ddd, D MMM YYYY')}</Text>
                    {!!o.tithi && <Text style={styles.occurrenceTithi}>{o.tithi}</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>4. Remind me</Text>
          {REMINDER_OPTIONS.map((opt) => {
            const on = reminders.includes(opt.minutes);
            return (
              <Pressable key={opt.minutes} style={styles.checkboxRow} onPress={() => toggleReminder(opt.minutes)}>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18}
                  color={on ? theme.primary : theme.textMuted} />
                <Text style={styles.checkboxLabel}>{'  '}{opt.label}</Text>
              </Pressable>
            );
          })}

          <Pressable style={[styles.button, (saving || selected.size === 0) && { opacity: 0.5 }]} onPress={submit} disabled={saving || selected.size === 0}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.buttonText}>Set reminders for {selected.size} selected</Text>
            )}
          </Pressable>
        </View>
      )}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            Reminders set for {result.newly_tracked ?? selected.size} date(s) in {year}.
          </Text>
        </View>
      )}

      <StatusModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        autoClose={false}
        onPrimary={hideModal}
        onRequestClose={hideModal}
      />
    </View>
  );
}

// ---- Tab 2: weekday series (unchanged logic, just lives in its own tab now) ----
function WeekdaySeriesSection({ navigation }) {
  const [title, setTitle] = useState('');
  const [weekday, setWeekday] = useState(0);
  const [count, setCount] = useState('5');
  const [reminders, setReminders] = useState([1440]);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: 'error', title: '', message: '', onClose: null });

  const showModal = (type, title, message, onClose = null) =>
    setModal({ visible: true, type, title, message, onClose });
  const hideModal = () => {
    const cb = modal.onClose;
    setModal((m) => ({ ...m, visible: false, onClose: null }));
    cb?.();
    navigation.navigate('MyEventsScreen', { presetTypeFilter: 'OTHER' });
  };

  const toggleReminder = (minutes) =>
    setReminders((r) => (r.includes(minutes) ? r.filter((m) => m !== minutes) : [...r, minutes]));

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await createWeekdaySeries({
        title: title.trim(), weekday, count: Number(count), reminder_minutes: reminders,
      });
      for (const ev of res.events) {
        await scheduleEventReminders(
          { id: ev.id, title: title.trim(), event_date: ev.event_date, start_time: null }, reminders);
      }
      showModal('success', 'Reminders set', `Added ${res.created_count} reminder(s).`);
      setTimeout(() => {
        navigation.navigate('MyEventsScreen', { presetTypeFilter: 'OTHER' });
      }, 3000);
    } catch (e) {
      showModal('error', 'Could not create series', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Remind me on a recurring day</Text>
      <Text style={styles.sectionSub}>
        e.g. doing a brata every Monday? Get reminded for the next 5 weeks — plain calendar dates, not tied to the panji.
      </Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Monday brata"
        placeholderTextColor={theme.textMuted} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Which day</Text>
      <View style={styles.chipRow}>
        {WEEKDAYS.map((w) => (
          <Pressable key={w.key} onPress={() => setWeekday(w.key)}
            style={[styles.chip, weekday === w.key && styles.chipActive]}>
            <Text style={[styles.chipText, weekday === w.key && styles.chipTextActive]}>{w.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>How many weeks</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={count} onChangeText={setCount} />

      <Text style={styles.label}>Remind me</Text>
      {REMINDER_OPTIONS.map((opt) => {
        const on = reminders.includes(opt.minutes);
        return (
          <Pressable key={opt.minutes} style={styles.checkboxRow} onPress={() => toggleReminder(opt.minutes)}>
            <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18}
              color={on ? theme.prim0ary : theme.textMuted} />
            <Text style={styles.checkboxLabel}>{'  '}{opt.label}</Text>
          </Pressable>
        );
      })}

      <Pressable style={[styles.button, (saving || !title.trim()) && { opacity: 0.5 }]} onPress={submit} disabled={saving || !title.trim()}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Set reminders</Text>}
      </Pressable>

      <StatusModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        autoClose={false}
        onPrimary={hideModal}
        onRequestClose={hideModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.textOnPrimary },

  tabBar: {
    flexDirection: 'row', backgroundColor: theme.surfaceAlt,
    marginHorizontal: 14, marginTop: 12, borderRadius: radius.m, padding: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: radius.sm,
  },
  tabBtnActive: { backgroundColor: theme.surface, elevation: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3 },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  tabBtnTextActive: { color: theme.primary },

  section: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  sectionSub: { fontSize: 12, color: theme.textMuted, marginTop: 2, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: theme.textMuted, marginTop: 10, marginBottom: 5 },
  label3: { fontSize: 12, fontWeight: '700', color: theme.text },
  input: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: radius.m,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: theme.text,
    backgroundColor: theme.surfaceAlt,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipActive: { backgroundColor: theme.primaryTint, borderColor: theme.primaryDark },
  chipText: { fontSize: 13, color: theme.textMuted },
  chipTextActive: { color: theme.primary, fontWeight: '600' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  checkboxLabel: { fontSize: 13, color: theme.text },

  fetchButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: theme.primary, borderRadius: radius.m,
    paddingVertical: 11, marginTop: 16,
  },
  fetchButtonText: { color: theme.primary, fontSize: 14, fontWeight: '600' },

  occurrenceBlock: { marginTop: 18 },
  occurrenceHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectAllText: { fontSize: 12, fontWeight: '600', color: theme.primary },
  occurrenceList: {
    marginTop: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    borderRadius: radius.m, backgroundColor: theme.surfaceAlt, overflow: 'hidden',
  },
  occurrenceRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border,
  },
  occurrenceName: { fontSize: 13, fontWeight: '700', color: theme.text },
  occurrenceDate: { fontSize: 12, fontWeight: '500', color: theme.primary, marginTop: 1 },
  occurrenceTithi: { fontSize: 11, color: theme.textMuted, marginTop: 1 },

  button: {
    backgroundColor: theme.primary, borderRadius: radius.m,
    paddingVertical: 12, alignItems: 'center', marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultBox: { backgroundColor: theme.sacredTint, borderRadius: radius.m, padding: 12, marginTop: 12 },
  resultText: { fontSize: 13, color: theme.sacredText, lineHeight: 19 },
});