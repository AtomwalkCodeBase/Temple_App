// src/notifications.js
import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionEnsured = false;

export async function ensurePermissions() {
  if (permissionEnsured) return true;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    status = res.status;
  }
  if (status !== 'granted') return false;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Panchang reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  permissionEnsured = true;
  return true;
}

/**
 * event: { id, title, event_date: 'YYYY-MM-DD', start_time: 'HH:mm' | null }
 * remindersMinutes: number[] -- minutes BEFORE the event's start_time.
 *   A value of 0 means "on the day, morning" and fires at 8:00 AM that day
 *   rather than literally at midnight.
 * Cancels any reminders previously scheduled for this event first, so
 * calling this again after an edit doesn't stack duplicate notifications.
 */
export async function scheduleEventReminders(event, remindersMinutes = []) {
  const granted = await ensurePermissions();
  if (!granted) return [];

  await cancelEventReminders(event.id);

  const eventMoment = event.start_time
    ? dayjs(`${event.event_date} ${event.start_time}`, 'YYYY-MM-DD HH:mm')
    : dayjs(`${event.event_date} 08:00`, 'YYYY-MM-DD HH:mm');

  const ids = [];
  for (const minutes of remindersMinutes) {
    const triggerMoment =
      minutes === 0
        ? dayjs(`${event.event_date} 08:00`, 'YYYY-MM-DD HH:mm')
        : eventMoment.subtract(minutes, 'minute');

    if (triggerMoment.isBefore(dayjs())) continue; // already past, nothing to schedule

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: event.title,
        body: minutes === 0 ? "Today's the day" : `Coming up in ${describeMinutes(minutes)}`,
        data: { userEventId: event.id },
      },
      // SDK 51+ requires an explicit trigger `type` -- a bare Date throws
      // "trigger object ... invalid".
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerMoment.toDate() },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelEventReminders(userEventId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const mine = scheduled.filter((n) => n.content?.data?.userEventId === userEventId);
  await Promise.all(mine.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

function describeMinutes(minutes) {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  return `${minutes} min`;
}

export default { ensurePermissions, scheduleEventReminders, cancelEventReminders };
