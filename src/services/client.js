// src/api/client.js — thin fetch wrapper for the admin API.
const ROOT_URL = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

// admin_views.py is mounted inside event.urls at 'admin_api/' (underscore),
// and event.urls itself is mounted at root as 'event/' — so the full path
// prefix is /event/admin_api/. Change here if the mount ever moves again.
const ADMIN_API = `${ROOT_URL}/event/admin_api`;

// dj_rest_auth's LoginView, mounted at root in project/urls.py
const AUTH_LOGIN_URL = `${ROOT_URL}/auth/login/`;

function authHeader() {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Token ${token}` } : {};
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const res = await fetch(`${ADMIN_API}${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...authHeader(),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export async function login(username, password) {
  const res = await fetch(AUTH_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json();          // dj_rest_auth: { "key": "..." }
  localStorage.setItem('admin_token', data.key);
  return data;
}

export const logout = () => localStorage.removeItem('admin_token');

// ---- Calendars & Locations ----
export const listCalendars = () => request('/calendars/');
export const listLocations = () => request('/locations/');

// ---- Calendar Years ----
export const listCalendarYears = (calendarId) =>
  request(`/calendar-years/${calendarId ? `?calendar=${calendarId}` : ''}`);
export const createCalendarYear = (payload) =>
  request('/calendar-years/', { method: 'POST', body: payload });
export const importCalendarYear = (id, data, source, sourceVersion) =>
  request(`/calendar-years/${id}/import_data/`, {
    method: 'POST',
    body: { data, source, source_version: sourceVersion },
  });
export const previewCalendarYear = (id) =>
  request(`/calendar-years/${id}/preview/`);
export const publishCalendarYear = (id) =>
  request(`/calendar-years/${id}/publish/`, { method: 'POST' });
export const unpublishCalendarYear = (id) =>
  request(`/calendar-years/${id}/unpublish/`, { method: 'POST' });

// ---- Religious events ----
export const listReligiousEvents = (calendarId) =>
  request(`/religious-events/${calendarId ? `?calendar=${calendarId}` : ''}`);
export const createReligiousEvent = (payload) =>
  request('/religious-events/', { method: 'POST', body: payload });
export const updateReligiousEvent = (id, payload) =>
  request(`/religious-events/${id}/`, { method: 'PATCH', body: payload });
export const deleteReligiousEvent = (id) =>
  request(`/religious-events/${id}/`, { method: 'DELETE' });

// ---- Calendar days (spot correction) ----
export const listCalendarDays = (yearId, month) =>
  request(`/calendar-days/?calendar_year=${yearId}${month ? `&month=${month}` : ''}`);
export const updateCalendarDay = (id, payload) =>
  request(`/calendar-days/${id}/`, { method: 'PATCH', body: payload });
