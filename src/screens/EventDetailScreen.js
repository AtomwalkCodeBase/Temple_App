// EventDetailScreen.js — two variants driven by route.params:
//   { code, date }        -> festival: track/untrack + reminder checkboxes
//   { userEventId }       -> personal event: edit/delete/notes/participants
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, Alert, ActivityIndicator,
  StyleSheet, TextInput, Share, FlatList,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import dayjs from 'dayjs';
import {
  getReligiousEventOccurrence, trackReligiousEvent, untrackReligiousEvent,
  getUserEvent, deleteUserEvent, addParticipant,
} from '../services/api';
import { scheduleEventReminders, cancelEventReminders } from '../services/notifications';
import { theme, radius } from '../screens/theme';
import Screen from '../components/Screen';

const REMINDER_OPTIONS = [
  { minutes: 0, label: 'On the day (morning)' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 4320, label: '3 days before' },
];

export default function EventDetailScreen({ navigation, route }) {

  const isFestival = !!route.params?.code;
  return isFestival
    ? <FestivalDetail navigation={navigation} route={route} />
    : <UserEventDetail navigation={navigation} route={route} />;
}

// ---------------------------------------------------------------------
// Festival variant
// ---------------------------------------------------------------------
function FestivalDetail({ navigation, route }) {
  const { code, date } = route.params;
  const [data, setData] = useState(null);
  const [reminders, setReminders] = useState([1440]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const d = await getReligiousEventOccurrence(code, date);
    setData(d);
    if (d.reminder_minutes?.length) setReminders(d.reminder_minutes);
  }, [code, date]);

  useEffect(() => { load().catch(console.warn); }, [load]);

  if (!data) return <Loading />;

  const toggleTrack = async () => {
    setBusy(true);
    try {
      if (data.is_tracked) {
        if (data.user_event_id) await cancelEventReminders(data.user_event_id);
        await untrackReligiousEvent(code);
      } else {
        const created = await trackReligiousEvent(code, { reminder_minutes: reminders });
        await scheduleEventReminders(
          {
            id: created.id, title: created.title,
            event_date: created.event_date, start_time: created.start_time
          },
          reminders);
      }
      await load();
    } catch (e) {
      Alert.alert('Something went wrong', e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleReminder = async (minutes) => {
    const next = reminders.includes(minutes)
      ? reminders.filter((m) => m !== minutes)
      : [...reminders, minutes];
    setReminders(next);
    if (data.is_tracked) {
      // re-track applies the updated reminder set (backend uses get_or_create)
      setBusy(true);
      try {
        const created = await trackReligiousEvent(code, { reminder_minutes: next });
        await scheduleEventReminders(
          {
            id: created.id, title: created.title,
            event_date: created.event_date, start_time: created.start_time
          },
          next);
      } catch (e) { Alert.alert('Could not update reminder', e.message); }
      finally { setBusy(false); }
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>

      <ScrollView style={{ flex: 1, backgroundColor: theme.surface }}>
        <View style={styles.heroDark}>
          <Text style={styles.heroDate}>{dayjs(data.date).format('dddd, D MMMM YYYY')}</Text>
          <Text style={styles.heroTitle}>{data.name}</Text>
          <Text style={styles.heroSub}>
            {data.name_local} · {data.lunar_month} {data.paksha} {data.tithi_local || data.tithi}
          </Text>
          <View style={styles.importanceBadge}>
            <Text style={styles.importanceBadgeText}>
              {data.importance === 'MAJOR' ? 'Major festival' : 'Festival'}
            </Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {!!data.description &&
            <>
              <Text style={styles.descriptionHeading}>Why we celebrate</Text>
              <Text style={styles.description}>{data.description}</Text>
            </>}

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Add to My Calendar</Text>
                <Text style={styles.cardSub}>Get reminders for this every year</Text>
              </View>
              <Pressable
                onPress={toggleTrack}
                disabled={busy}
                style={[styles.toggle, data.is_tracked && styles.toggleOn]}
              >
                <View style={[styles.toggleKnob, data.is_tracked && styles.toggleKnobOn]} />
              </Pressable>
            </View>
          </View>

          {data.is_tracked && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Remind me</Text>
              {REMINDER_OPTIONS.map((opt) => {
                const on = reminders.includes(opt.minutes);
                return (
                  <Pressable key={opt.minutes} style={styles.checkboxRow}
                    onPress={() => toggleReminder(opt.minutes)} disabled={busy}>
                    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18}
                      color={on ? theme.accent : theme.textMuted} />
                    <Text style={styles.checkboxLabel}>{'  '}{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------
// User-created event variant
// ---------------------------------------------------------------------
function UserEventDetail({ navigation, route }) {
  const { userEventId } = route.params;
  const [event, setEvent] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const load = useCallback(async () => {
    const d = await getUserEvent(userEventId);
    setEvent(d);
  }, [userEventId]);

  useEffect(() => { load().catch(console.warn); }, [load]);

  if (!event) return <Loading />;

  const remove = () => {
    Alert.alert('Delete event?', `"${event.title}" will be removed and reminders cancelled.`,
      [{ text: 'Cancel', style: 'cancel' }, {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await cancelEventReminders(event.id);
          await deleteUserEvent(event.id);
          navigation.goBack();
        },
      }]);
  };

  const onContactPicked = async (contact) => {
    setPickerVisible(false);
    const phone = contact.phoneNumbers?.[0]?.number?.replace(/[^\d+]/g, '');
    try {
      await addParticipant(event.id, { name: contact.name, mobile: phone || '' });
      load();
    } catch (e) {
      Alert.alert('Could not add participant', e.message);
    }
  };

  // const shareInvite = async () => {
  //   try {
  //     const eventLink = `https://agam.app/event/user/${event.id}`;

  //     await Share.share({
  //       message:
  //         `You're invited: ${event.title}\n` +
  //         `${dayjs(event.event_date).format('dddd, D MMMM YYYY')}` +
  //         (event.start_time
  //           ? ` at ${dayjs(`2000-01-01 ${event.start_time}`).format('h:mm a')}`
  //           : '') +
  //         `\n\nShared from Agam Mandira` +
  //         `\n\nOpen event: ${eventLink}`,
  //     });
  //   } catch (e) {
  //     Alert.alert('Could not share', e.message);
  //   }
  // };

  const shareInvite = async () => {
    try {
      await Share.share({
        message:
          `You're invited: ${event.title}\n` +
          `${dayjs(event.event_date).format('dddd, D MMMM YYYY')}` +
          (event.start_time ? ` at ${dayjs(`2000-01-01 ${event.start_time}`).format('h:mm a')}` : '') +
          `\n\nShared from Agam Mandira`,
      });
    } catch (e) {
      Alert.alert('Could not share', e.message);
    }
  };


  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.surface }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <Pressable onPress={() => navigation.navigate('AddEvent', { editUserEvent: event })} hitSlop={10}>
              <Ionicons name="create-outline" size={20} color={theme.text} />
            </Pressable>
            <Pressable onPress={remove} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color="#993C1D" />
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{event.event_type}</Text>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.subtitle}>
            {dayjs(event.event_date).format('dddd, D MMMM YYYY')}
            {event.start_time ? ` · ${dayjs(`2000-01-01 ${event.start_time}`).format('h:mm a')}` : ''}
            {event.recurrence_type === 'YEARLY' ? ' · Repeats yearly' : ''}
          </Text>

          {!!event.description && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notes</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {event.reminders?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reminders</Text>
              {event.reminders.map((r) => (
                <View key={r.id} style={styles.checkboxRow}>
                  <Ionicons name="notifications" size={15} color={theme.accent} />
                  <Text style={styles.checkboxLabel}>
                    {'  '}{r.reminder_minutes === 0 ? 'On the day' : `${r.reminder_minutes / 1440} day(s) before`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Participants ({event.participants?.length ?? 0})</Text>
            <Pressable style={styles.smallAddButton} onPress={() => setPickerVisible(true)}>
              <Ionicons name="people" size={13} color="#fff" />
              <Text style={styles.smallAddButtonText}> Add from contacts</Text>
            </Pressable>
          </View>

          {event.participants?.map((p) => (
            <View key={p.id} style={styles.participantRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(p.name)}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: theme.text }}>{p.name}</Text>
              <View style={[styles.statusPill, p.status === 'ACCEPTED' ? styles.statusAccepted : styles.statusInvited]}>
                <Text style={[styles.statusPillText, p.status === 'ACCEPTED' ? styles.statusAcceptedText : styles.statusInvitedText]}>
                  {p.status === 'ACCEPTED' ? 'Accepted' : 'Invited'}
                </Text>
              </View>
            </View>
          ))}

          <Pressable style={styles.shareButton} onPress={shareInvite}>
            <Ionicons name="share-outline" size={15} color={theme.text} />
            <Text style={styles.shareButtonText}> Share invite</Text>
          </Pressable>

          <View style={{ height: 30 }} />
        </View>

      </ScrollView>
      <ContactPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPick={onContactPicked}
      />
    </Screen>
  );
}

function ContactPickerModal({ visible, onClose, onPick }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Contacts permission needed',
          'Enable contacts access in Settings to invite people from your phone.');
        setLoading(false);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      setContacts(data.filter((c) => c.phoneNumbers?.length && c.name));
      setLoading(false);
    })();
  }, [visible]);

  if (!visible) return null;

  const filtered = query
    ? contacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : contacts;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add from contacts</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={20} color={theme.textMuted} />
          </Pressable>
        </View>
        <TextInput style={styles.searchInput} placeholder="Search contacts"
          value={query} onChangeText={setQuery} />
        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ paddingVertical: 30 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 320 }}
            ListEmptyComponent={
              <Text style={styles.emptyContacts}>No contacts with a phone number found.</Text>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.contactRow} onPress={() => onPick(item)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(item.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: theme.text }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>
                    {item.phoneNumbers[0].number}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface }}>
      <ActivityIndicator color={theme.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  heroDark: { backgroundColor: theme.sky, padding: 16, paddingBottom: 20 },
  heroDate: { color: theme.skyMuted, fontSize: 11 },
  heroTitle: { color: theme.skyText, fontSize: 21, fontWeight: '700', marginTop: 2 },
  heroSub: { color: theme.skyMuted, fontSize: 13, marginTop: 1 },
  importanceBadge: { backgroundColor: theme.sacredTint, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 9, paddingVertical: 3 },
  importanceBadgeText: { color: theme.sacredText, fontSize: 11, fontWeight: '600' },
  descriptionHeading: { color: theme.text, fontSize: 21, fontWeight: '700', marginTop: 2 },
  description: { fontSize: 13, color: theme.textMuted, lineHeight: 20 },
  card: { backgroundColor: theme.surfaceAlt, borderRadius: radius.m, padding: 14, marginTop: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: theme.textMuted },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: theme.border, padding: 2 },
  toggleOn: { backgroundColor: theme.accent },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleKnobOn: { marginLeft: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  checkboxLabel: { fontSize: 13, color: theme.text },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 4 },
  typeBadge: { backgroundColor: theme.accentTint, borderRadius: 10, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3 },
  typeBadgeText: { color: theme.accentDeep, fontSize: 11, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: theme.text, marginTop: 8 },
  subtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  smallAddButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accent, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  smallAddButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accentTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '600', color: theme.accentDeep },
  statusPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  statusAccepted: { backgroundColor: '#E1F5EE' }, statusAcceptedText: { color: '#0F6E56' },
  statusInvited: { backgroundColor: theme.sacredTint }, statusInvitedText: { color: theme.sacredMuted },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: radius.s, padding: 9, fontSize: 13, marginBottom: 6, color: theme.text },
  saveButton: { backgroundColor: theme.accent, borderRadius: radius.s, paddingVertical: 8, paddingHorizontal: 16 },
  saveButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  cancelButton: { backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: radius.s, paddingVertical: 8, paddingHorizontal: 16 },
  cancelButtonText: { color: theme.text, fontSize: 13 },
  shareButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surfaceAlt, borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border, borderRadius: radius.m, paddingVertical: 11, marginTop: 16,
  },
  shareButtonText: { fontSize: 14, fontWeight: '600', color: theme.text },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(4,44,83,0.4)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.surface, borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l, padding: 16, maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: theme.text },
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    borderRadius: radius.s, padding: 10, fontSize: 14, marginBottom: 8, color: theme.text,
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
  },
  emptyContacts: { fontSize: 13, color: theme.textMuted, textAlign: 'center', paddingVertical: 24 },
});