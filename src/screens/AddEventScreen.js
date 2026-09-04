// AddEventScreen.js — create a puja / family event with alerts.
// Also handles "track a festival" when opened with route.params.trackCode.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  Switch, Alert, StyleSheet, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { createUserEvent, trackReligiousEvent, updateUserEvent } from '../services/api';
import { cancelEventReminders, scheduleEventReminders } from '../services/notifications1';
import { theme, radius } from './theme';
import Screen from '../components/Screen';

export const EVENT_TYPES = [
  { key: 'PUJA', label: 'Puja' },
  { key: 'BRATA', label: 'Brata' },
  { key: 'FAMILY', label: 'Family' },
  { key: 'TEMPLE_VISIT', label: 'Temple visit' },
  { key: 'OTHER', label: 'Other' },
];

const REMINDER_OPTIONS = [
  { minutes: 0, label: 'On the day (morning)' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 4320, label: '3 days before' },
];

export default function AddEventScreen({ navigation, route, onSaved, onDeleted, onCancel }) {
  const params = route?.params ?? {};
  const editing = params.editUserEvent ?? null;
  const track = params.trackCode
    ? {
      code: params.trackCode, name: params.trackName,
      date: params.trackDate
    }
    : null;

  const [title, setTitle] = useState(editing?.title ?? track?.name ?? '');
  const [eventType, setEventType] = useState(editing?.event_type ?? 'PUJA');
  const [date, setDate] = useState(
    editing?.event_date ? new Date(editing.event_date) : (track?.date ? new Date(track.date) : new Date())
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasTime, setHasTime] = useState(!!editing?.start_time);
  const [time, setTime] = useState(
    editing?.start_time
      ? new Date(new Date().setHours(...editing.start_time.split(':').map(Number), 0, 0))
      : new Date(new Date().setHours(7, 0, 0, 0))
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [yearly, setYearly] = useState(editing ? editing.recurrence_type === 'YEARLY' : true);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [reminders, setReminders] = useState(
    editing?.reminders?.length ? editing.reminders.map((r) => r.reminder_minutes ?? r) : [1440]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextEditing = route?.params?.editUserEvent ?? null;
    const nextTrack = route?.params?.trackCode
      ? {
        code: route.params.trackCode,
        name: route.params.trackName,
        date: route.params.trackDate,
      }
      : null;

    setTitle(nextEditing?.title ?? nextTrack?.name ?? '');
    setEventType(nextEditing?.event_type ?? 'PUJA');
    setDate(
      nextEditing?.event_date
        ? new Date(nextEditing.event_date)
        : (nextTrack?.date ? new Date(nextTrack.date) : new Date())
    );
    setHasTime(!!nextEditing?.start_time);
    setTime(
      nextEditing?.start_time
        ? new Date(new Date().setHours(...nextEditing.start_time.split(':').map(Number), 0, 0))
        : new Date(new Date().setHours(7, 0, 0, 0))
    );
    setYearly(nextEditing ? nextEditing.recurrence_type === 'YEARLY' : true);
    setDescription(nextEditing?.description ?? '');
    setReminders(
      nextEditing?.reminders?.length
        ? nextEditing.reminders.map((r) => r.reminder_minutes ?? r)
        : [1440]
    );
  }, [
    route?.params?.editUserEvent,
    route?.params?.trackCode,
    route?.params?.trackName,
    route?.params?.trackDate,
  ]);

  const toggleReminder = (minutes) =>
    setReminders((r) =>
      r.includes(minutes) ? r.filter((m) => m !== minutes) : [...r, minutes]);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Missing name', 'Please give the event a name.');
      return;
    }
    setSaving(true);
    try {
      let created;
      if (editing) {
        const patchPayload = {
          title: title.trim(),
          event_type: eventType,
          event_date: dayjs(date).format('YYYY-MM-DD'),
          start_time: hasTime ? dayjs(time).format('HH:mm') : null,
          recurrence_type: yearly ? 'YEARLY' : 'NONE',
          description,
          // NOTE: intentionally NOT sending reminders/participants here —
          // the backend serializer only implements create() for those
          // nested fields, not update(); including them 500s the request.
        };
        created = await updateUserEvent(editing.id, patchPayload);
        await cancelEventReminders(editing.id);
      } else if (track) {
        created = await trackReligiousEvent(track.code, { reminder_minutes: reminders });
      } else {
        const payload = {
          title: title.trim(),
          event_type: eventType,
          event_date: dayjs(date).format('YYYY-MM-DD'),
          start_time: hasTime ? dayjs(time).format('HH:mm') : null,
          recurrence_type: yearly ? 'YEARLY' : 'NONE',
          description,
          reminders: reminders.map((m) => ({ reminder_minutes: m })),
          participants: [],
        };
        created = await createUserEvent(payload);
      }

      // Local alerts on this device
      await scheduleEventReminders(
        {
          id: created.id, title: created.title,
          event_date: created.event_date, start_time: created.start_time
        },
        reminders,
      );

      if (typeof onSaved === 'function') {
        onSaved();
      } else {
        navigation?.goBack?.();
      }
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Header title={editing ? "Edit Event" : "Add Events"} />
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
        {track && (
          <View style={styles.trackNote}>
            <Ionicons name="flag" size={16} color={theme.sacredText} />
            <Text style={styles.trackNoteText}>
              {'  '}Tracking {track.name} — we'll set your alerts for it.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Event name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Satyanarayan Puja at home"
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
          editable={!track}
        />

        {/* 
        {editing && (
          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: -2, marginBottom: 4 }}>
            Editing "{editing.title}"
          </Text>
        )} */}

        <Text style={styles.label}>Type</Text>
        <View style={styles.chipRow}>
          {EVENT_TYPES.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setEventType(t.key)}
              style={[styles.chip, eventType === t.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, eventType === t.key && styles.chipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}
          disabled={!!track}>
          <Text style={styles.inputText}>{dayjs(date).format('dddd, D MMMM YYYY')}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
          />
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Set a time</Text>
          <Switch value={hasTime} onValueChange={setHasTime}
            trackColor={{ true: theme.accent }} />
        </View>
        {hasTime && (
          <>
            <Pressable style={styles.input} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.inputText}>{dayjs(time).format('h:mm a')}</Text>
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                onChange={(_, t) => { setShowTimePicker(false); if (t) setTime(t); }}
              />
            )}
          </>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Repeat every year (same date)</Text>
          <Switch value={yearly} onValueChange={setYearly}
            trackColor={{ true: theme.accent }} />
        </View>

        <Text style={styles.label}>Remind me</Text>
        {REMINDER_OPTIONS.map((opt) => {
          const on = reminders.includes(opt.minutes);
          return (
            <Pressable key={opt.minutes} style={styles.reminderRow}
              onPress={() => toggleReminder(opt.minutes)}>
              <Ionicons
                name={on ? 'checkbox' : 'square-outline'}
                size={20}
                color={on ? theme.accent : theme.textMuted}
              />
              <Text style={styles.reminderLabel}>{'  '}{opt.label}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
          placeholder="Items needed, pandit contact, etc."
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <Pressable
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : editing ? 'Update event' : 'Save event'}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

export function Header({ title }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.surface, flex: 1 },
  header: { backgroundColor: theme.sky, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.skyText },
  trackNote: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.sacredTint, borderRadius: radius.m,
    padding: 12, marginBottom: 12,
  },
  trackNoteText: { color: theme.sacredText, fontSize: 13, flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: theme.textMuted, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    borderRadius: radius.m, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: theme.text, backgroundColor: theme.surfaceAlt,
  },
  inputText: { fontSize: 15, color: theme.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipActive: { backgroundColor: theme.accentTint, borderColor: theme.accent },
  chipText: { fontSize: 13, color: theme.textMuted },
  chipTextActive: { color: theme.accentDeep, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 14,
  },
  switchLabel: { fontSize: 15, color: theme.text },
  reminderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  reminderLabel: { fontSize: 15, color: theme.text },
  saveButton: {
    backgroundColor: theme.accent, borderRadius: radius.m,
    paddingVertical: 13, alignItems: 'center', marginTop: 22, marginBottom: 30,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
