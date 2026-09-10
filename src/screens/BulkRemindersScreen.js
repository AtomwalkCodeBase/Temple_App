// BulkRemindersScreen.js — two bulk-creation flows:
//   1. Track every occurrence of a panji event TYPE in a year (e.g. all
//      Ekadashi) — hits /religious-events/track-by-type/
//   2. Create a standalone series on a weekday (e.g. next 5 Mondays) —
//      hits /user-events/weekday-series/
// These are deliberately different mechanisms (panji-driven vs pure
// Gregorian date math) so they get separate sections, not one merged form.

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { trackByEventType, createWeekdaySeries } from '../services/api';
import { scheduleEventReminders } from '../services/notifications';
import { theme, radius } from '../theme/theme';
import Screen from '../components/Screen';
import StatusModal from '../components/StatusModal';

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

export default function BulkRemindersScreen({ navigation }) {
  return (
    <Screen>
      <ScrollView style={{ flex: 1, backgroundColor: theme.surface }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set reminders</Text>
        </View>
        <EventTypeSection />
        <View style={styles.divider} />
        <WeekdaySeriesSection navigation={navigation} />
        <View style={{ height: 30 }} />
      </ScrollView>
    </Screen>
  );
}

function EventTypeSection() {
  const [eventType, setEventType] = useState('EKADASHI');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [reminders, setReminders] = useState([1440]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [modal, setModal] = useState({ visible: false, type: 'error', title: '', message: '' });

  const showModal = (type, title, message) =>
    setModal({ visible: true, type, title, message });
  const hideModal = () =>
    setModal((m) => ({ ...m, visible: false }));

  const toggleReminder = (minutes) =>
    setReminders((r) => (r.includes(minutes) ? r.filter((m) => m !== minutes) : [...r, minutes]));

  const submit = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await trackByEventType(eventType, Number(year), reminders);
      setResult(res);
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
        e.g. get reminded for every Ekadashi this year, not just the next one.
      </Text>

      <Text style={styles.label}>Which observance</Text>
      <View style={styles.chipRow}>
        {EVENT_TYPES.map((t) => (
          <Pressable key={t.key} onPress={() => setEventType(t.key)}
            style={[styles.chip, eventType === t.key && styles.chipActive]}>
            <Text style={[styles.chipText, eventType === t.key && styles.chipTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Year</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={year} onChangeText={setYear} />

      <Text style={styles.label}>Remind me</Text>
      {REMINDER_OPTIONS.map((opt) => {
        const on = reminders.includes(opt.minutes);
        return (
          <Pressable key={opt.minutes} style={styles.checkboxRow} onPress={() => toggleReminder(opt.minutes)}>
            <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18}
              color={on ? theme.accent : theme.textMuted} />
            <Text style={styles.checkboxLabel}>{'  '}{opt.label}</Text>
          </Pressable>
        );
      })}

      <Pressable style={[styles.button, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Remind me for every {EVENT_TYPES.find(t => t.key === eventType)?.label}</Text>}
      </Pressable>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            Found {result.occurrences_found} occurrence{result.occurrences_found === 1 ? '' : 's'} in {result.year}.
            {' '}Reminders set for: {result.newly_tracked}.
            {result.newly_tracked < result.occurrences_found &&
              ` (${result.occurrences_found - result.newly_tracked} already had a reminder.)`}
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
  };

  const toggleReminder = (minutes) =>
    setReminders((r) => (r.includes(minutes) ? r.filter((m) => m !== minutes) : [...r, minutes]));

  const submit = async () => {
    if (!title.trim()) {
      showModal('warning', 'Missing name', 'Give it a name, e.g. "Monday brata".');
      return;
    }
    setSaving(true);
    try {
      const res = await createWeekdaySeries({
        title: title.trim(), weekday, count: Number(count), reminder_minutes: reminders,
      });
      // Schedule local device reminders for each created event too
      for (const ev of res.events) {
        await scheduleEventReminders(
          { id: ev.id, title: title.trim(), event_date: ev.event_date, start_time: null },
          reminders);
      }
      // Success — navigate back when the user taps OK
      showModal('success', 'Reminders set', `Added ${res.created_count} reminder(s).`,
        () => navigation.goBack());
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
              color={on ? theme.accent : theme.textMuted} />
            <Text style={styles.checkboxLabel}>{'  '}{opt.label}</Text>
          </Pressable>
        );
      })}

      <Pressable style={[styles.button, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
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
  header: { backgroundColor: theme.sky, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.skyText },
  divider: { height: 8, backgroundColor: theme.surfaceAlt },
  section: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  sectionSub: { fontSize: 12, color: theme.textMuted, marginTop: 2, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: theme.textMuted, marginTop: 10, marginBottom: 5 },
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
  chipActive: { backgroundColor: theme.accentTint, borderColor: theme.accent },
  chipText: { fontSize: 13, color: theme.textMuted },
  chipTextActive: { color: theme.accentDeep, fontWeight: '600' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  checkboxLabel: { fontSize: 13, color: theme.text },
  button: {
    backgroundColor: theme.accent, borderRadius: radius.m,
    paddingVertical: 12, alignItems: 'center', marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultBox: { backgroundColor: theme.sacredTint, borderRadius: radius.m, padding: 12, marginTop: 12 },
  resultText: { fontSize: 13, color: theme.sacredText, lineHeight: 19 },
});
