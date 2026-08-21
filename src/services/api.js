// api.js — thin client for the Panji backend
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ROOT_URL = 'https://agamandira.com';      // Android emulator -> localhost
// Physical device: change ROOT_URL to your machine's LAN IP,
// e.g. http://192.168.1.10:8000 — every URL below derives from it.

// event/urls.py is mounted at root as `event/` — NOT under /api/
export const BASE_URL = `${ROOT_URL}/event`;
export const ADMIN_API_URL = `${BASE_URL}/admin_api`;

// dj_rest_auth, mounted at root in project urls.py
export const AUTH_LOGIN_URL = `${ROOT_URL}/auth/login/`;
// dj_rest_auth's LoginView returns {"key": "..."} — NOT {"token": "..."}

// Your custom register view (applies invite codes / Gold tier) —
// lives inside event.urls, so it's under BASE_URL, not root.
export const REGISTER_URL = `${BASE_URL}/auth/register/`;
// NOTE: dj_rest_auth.registration.urls is also mounted at root
// (`auth/registration/`) in your project urls.py. Two registration paths
// exist right now — recommend removing that line from project/urls.py
// since it doesn't know about InviteCode/tier and will silently create
// TRIAL-only accounts if anyone hits it by mistake.

async function request(path, { method = 'GET', body } = {}) {
  const token = await AsyncStorage.getItem('auth_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.status === 204 ? null : res.json();
}

// ---- Panchang ----------------------------------------------------------
// GET /panchang/day/?date=2027-07-07&location=1
export const getDayPanchang = (date, locationId) =>
  request(`/panchang/day/?date=${date}&location=${locationId}`);

// GET /panchang/strip/?start=2027-07-06&days=7&location=1
export const getTithiStrip = (start, locationId, days = 7) =>
  request(`/panchang/strip/?start=${start}&days=${days}&location=${locationId}`);

// ---- Month grid ----
export const getMonthGrid = (year, month, locationId) =>
  request(`/panchang/month/?year=${year}&month=${month}&location=${locationId}`);

// ---- Religious event detail / tracking ----
export const getReligiousEventOccurrence = (code, date) =>
  request(`/religious-events/${code}/occurrence/?date=${date}`);

export const untrackReligiousEvent = (code) =>
  request(`/religious-events/${code}/untrack/`, { method: 'POST' });

// ---- Participants ----
export const addParticipant = (userEventId, payload) =>
  request(`/user-events/${userEventId}/participants/`, { method: 'POST', body: payload });

// ---- Single user event (for EventDetail) ----
export const getUserEvent = (id) => request(`/user-events/${id}/`);
export const listUserEvents = () => request('/user-events/');

// ---- Profile / Settings ----
export const getMyProfile = () => request('/profile/me/');
export const updateMyProfile = (payload) =>
  request('/profile/me/', { method: 'PATCH', body: payload });
export const getAvailableCalendars = () => request('/calendars/available/');
export const getAvailableLocations = () => request('/locations/available/');

// ---- Events ------------------------------------------------------------
// GET /events/upcoming/?days=30
export const getUpcomingEvents = (days = 30) =>
  request(`/events/upcoming/?days=${days}`);

// POST /user-events/
// payload: { title, event_type, event_date, start_time?, recurrence_type,
//            description?, reminders: [{reminder_minutes}], participants: [] }
export const createUserEvent = (payload) =>
  request('/user-events/', { method: 'POST', body: payload });

export const updateUserEvent = (id, payload) =>
  request(`/user-events/${id}/`, { method: 'PATCH', body: payload });

export const deleteUserEvent = (id) =>
  request(`/user-events/${id}/`, { method: 'DELETE' });

// POST /religious-events/<code>/track/  -> "Add to My Calendar"
// payload: { reminder_minutes: [1440] }
export const trackReligiousEvent = (code, payload = {}) =>
  request(`/religious-events/${code}/track/`, { method: 'POST', body: payload });
