// notifications.js — local alert scheduling AND server push registration.
//
// Two complementary mechanisms:
//  - LOCAL (scheduleEventReminders): instant, works offline, but only
//    fires on the device that created the event.
//  - SERVER PUSH (registerPushToken + backend tasks.py): reaches invited
//    participants and survives reinstall, via Expo's push service.
// Both are wired up; the event creator gets both (belt and suspenders),
// invited participants get push only once they've accepted.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { Platform } from 'react-native';
import { BASE_URL } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

export async function ensurePermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/**
 * Call once after login (and it's safe to call again on every app start —
 * update_or_create on the backend means repeats are harmless).
 */
export async function registerPushToken() {
  if (!Device.isDevice) return null;   // push tokens don't work in simulators
  const ok = await ensurePermission();
  if (!ok) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    const authToken = await AsyncStorage.getItem('auth_token');
    if (!authToken) return null;

    await fetch(`${BASE_URL}/push-tokens/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${authToken}`,
      },
      body: JSON.stringify({ token, device_label: Platform.OS }),
    });
    return token;
  } catch (e) {
    console.warn('Push token registration failed:', e.message);
    return null;
  }
}

/**
 * Schedule local notifications for an event.
 * @param {object} event  { id, title, event_date 'YYYY-MM-DD', start_time 'HH:mm'|null }
 * @param {number[]} reminderMinutes  offsets before the event, e.g. [0, 1440]
 *        Anchor = start_time if set, else 07:00 on event day.
 */
export async function scheduleEventReminders(event, reminderMinutes) {
  const ok = await ensurePermission();
  if (!ok) return [];

  const anchor = dayjs(
    `${event.event_date} ${event.start_time || '07:00'}`, 'YYYY-MM-DD HH:mm');

  const ids = [];
  for (const minutes of reminderMinutes) {
    const fireAt = anchor.subtract(minutes, 'minute');
    if (fireAt.isBefore(dayjs())) continue;   // never schedule in the past
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: event.title,
        body: minutes === 0
          ? `Today: ${event.title}`
          : `${event.title} — ${humanOffset(minutes)} from now`,
        data: { userEventId: event.id },
      },
      trigger: fireAt.toDate(),
    });
    ids.push(id);
  }
  // Remember ids so we can cancel on edit/delete
  await AsyncStorage.setItem(`notif:${event.id}`, JSON.stringify(ids));
  return ids;
}

export async function cancelEventReminders(userEventId) {
  const raw = await AsyncStorage.getItem(`notif:${userEventId}`);
  if (!raw) return;
  for (const id of JSON.parse(raw)) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => { });
  }
  await AsyncStorage.removeItem(`notif:${userEventId}`);
}

function humanOffset(minutes) {
  if (minutes % 1440 === 0) {
    const d = minutes / 1440;
    return d === 1 ? '1 day' : `${d} days`;
  }
  if (minutes % 60 === 0) return `${minutes / 60} hr`;
  return `${minutes} min`;
}