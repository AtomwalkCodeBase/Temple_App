// SettingsScreen.js — the user's own preferences: location, calendar
// source, language, plus sign out. This is what unblocks getGreeting()
// and LOCATION_ID hardcoding across Home/Month from actually reflecting
// a real per-user choice.
import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  getAvailableCalendars, getAvailableLocations,
  AUTH_LOGOUT_URL,
} from '../services/api';
import { theme, radius } from '../screens/theme';
import Screen from '../components/Screen';
import ConfirmModal from '../components/ConfirmModal';
import { useUser } from '../context/UserContext';
import { updateMyProfile } from '../services/api';

export const LANGUAGES = [
  { code: 'en', label: 'English' },

  { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'as', label: 'অসমীয়া (Assamese)' },

  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },

  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },

  { code: 'ur', label: 'اردو (Urdu)' },
  { code: 'ne', label: 'नेपाली (Nepali)' },
  { code: 'sa', label: 'संस्कृत (Sanskrit)' },
  { code: 'kok', label: 'कोंकणी (Konkani)' },
  { code: 'mai', label: 'मैथिली (Maithili)' },
  { code: 'doi', label: 'डोगरी (Dogri)' },
  { code: 'ks', label: 'کٲشُر (Kashmiri)' },
  { code: 'sd', label: 'سنڌي (Sindhi)' },
  { code: 'mni', label: 'ꯃꯤꯇꯩ ꯂꯣꯟ (Manipuri)' },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)' },
  { code: 'brx', label: 'बड़ो (Bodo)' },
];

export default function SettingsScreen({ onSignOut }) {
  const { profile, refreshProfile } = useUser();
  const [calendars, setCalendars] = useState([]);
  const [locations, setLocations] = useState([]);
  const [saving, setSaving] = useState(null);
  const [showSignOut, setShowSignOut] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, l] = await Promise.all([
        getAvailableCalendars(), getAvailableLocations(),
      ]);
      setCalendars(c.calendars);
      setLocations(l.locations);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async (field, value) => {
    setSaving(field);
    try {
      await updateMyProfile({ [field]: value });
      await refreshProfile();
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(null);
    }
  };

  const signOut = () => {
    setShowSignOut(true);
  };

  const handleSignOut = async () => {
    const token = await AsyncStorage.getItem('auth_token');

    try {
      // Invalidate the token server-side.
      await fetch(AUTH_LOGOUT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      });
    } catch (e) {
      // Don't block sign-out on a network hiccup.
      console.warn('Server-side logout failed:', e.message);
    }

    await AsyncStorage.removeItem('auth_token');
    onSignOut();
  };

  if (!profile) {
    return (
      <Screen>

        <View style={{ flex: 1, backgroundColor: theme.surface }}>
          <Header />
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>

      <ScrollView style={{ flex: 1, backgroundColor: theme.surface }}>
        <Header />

        <Section title="Language">
          {LANGUAGES.map((lang) => (
            <OptionRow
              key={lang.code}
              label={lang.label}
              selected={profile.language === lang.code}
              busy={saving === 'language'}
              onPress={() => save('language', lang.code)}
            />
          ))}
        </Section>

        <Section title="Panji source">
          {calendars.map((cal) => (
            <OptionRow
              key={cal.id}
              label={cal.name}
              sublabel={cal.name_local}
              selected={profile.preferred_calendar === cal.id}
              busy={saving === 'preferred_calendar'}
              onPress={() => save('preferred_calendar', cal.id)}
            />
          ))}
          {calendars.length === 0 && (
            <Text style={styles.emptyNote}>No calendar sources available yet.</Text>
          )}
        </Section>

        <Section title="Location (for sunrise, sunset & timings)">
          {locations.map((loc) => (
            <OptionRow
              key={loc.id}
              label={loc.name}
              sublabel={loc.country}
              selected={profile.preferred_location === loc.id}
              busy={saving === 'preferred_location'}
              onPress={() => save('preferred_location', loc.id)}
            />
          ))}
          {locations.length === 0 && (
            <Text style={styles.emptyNote}>No locations available yet.</Text>
          )}
        </Section>

        {/* <Pressable style={styles.signOutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={16} color="#993C1D" />
          <Text style={styles.signOutText}>  Sign out</Text>
        </Pressable> */}

        <View style={{ height: 30 }} />
      </ScrollView>

      <ConfirmModal
        visible={showSignOut}
        type="normal"
        title="Sign out?"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowSignOut(false);
          handleSignOut();
        }}
        onCancel={() => setShowSignOut(false)}
      />
    </Screen>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Settings</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function OptionRow({ label, sublabel, selected, busy, onPress }) {
  return (
    <Pressable style={styles.optionRow} onPress={onPress} disabled={busy || selected}>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        {!!sublabel && <Text style={styles.optionSublabel}>{sublabel}</Text>}
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : selected ? (
        <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
      ) : (
        <Ionicons name="ellipse-outline" size={20} color={theme.border} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: theme.sky, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.skyText },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: theme.textMuted,
    marginHorizontal: 16, marginBottom: 6,
  },
  sectionCard: {
    backgroundColor: theme.surfaceAlt, marginHorizontal: 14,
    borderRadius: radius.m, overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
  },
  optionLabel: { fontSize: 14, color: theme.text, fontWeight: '500' },
  optionSublabel: { fontSize: 12, color: theme.textMuted, marginTop: 1 },
  emptyNote: { fontSize: 13, color: theme.textMuted, padding: 14 },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24, marginHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#FAECE7', borderRadius: radius.m,
  },
  signOutText: { fontSize: 14, fontWeight: '600', color: '#993C1D' },
});
