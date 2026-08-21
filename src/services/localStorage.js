// src/services/localStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = { PREFERENCES: 'preferences' };

const DEFAULT_PREFERENCES = {
    language: 'en', accent: 'maroon', state: null, panji: null, deities: [], temples: [],
};

async function getJson(key, fallback) {
    try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

async function setJson(key, value) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const localStorage = {
    getPreferences: () => getJson(KEYS.PREFERENCES, DEFAULT_PREFERENCES),
    setPreferences: (prefs) => setJson(KEYS.PREFERENCES, prefs),
    updatePreferences: async (patch) => {
        const current = await getJson(KEYS.PREFERENCES, DEFAULT_PREFERENCES);
        const next = { ...current, ...patch };
        await setJson(KEYS.PREFERENCES, next);
        return next;
    },
};

export default localStorage;