// SettingsScreen.js — the user's own preferences: location, calendar
// source, language, plus sign out. This is what unblocks getGreeting()
// and LOCATION_ID hardcoding across Home/Month from actually reflecting
// a real per-user choice.
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  StyleSheet, Alert, Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  getAvailableCalendars, getAvailableLocations,
  AUTH_LOGOUT_URL, ACCOUNT_DELETION_INFO_URL,
  deleteMyAccount,
} from '../services/api';
import { theme, radius } from '../theme/theme';
import Screen from '../components/Screen';
import ConfirmModal from '../components/ConfirmModal';
import StatusModal from '../components/StatusModal';
import { useUser } from '../context/UserContext';
import { updateMyProfile } from '../services/api';
import Constants from 'expo-constants';
import Header from '../components/Header';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (err) {
    console.warn('Failed to load expo-notifications:', err.message);
  }
}

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

export default function SettingsScreen({ onSignOut, route }) {
  const { profile, refreshProfile, selectedLocation, setSelectedLocation } = useUser();
  const scrollViewRef = useRef(null);
  const sectionOffsets = useRef({});
  const navigation = useNavigation();
  const [calendars, setCalendars] = useState([]);
  const [locations, setLocations] = useState([]);
  const [saving, setSaving] = useState(null);
  const [showSignOut, setShowSignOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
    onPrimary: null,
  });

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

  const scrollToRequestedSection = useCallback(() => {
    const section = route?.params?.section;
    const offset = sectionOffsets.current[section];

    if (offset !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(offset - 8, 0), animated: true });
    }
  }, [route?.params?.section]);

  useFocusEffect(useCallback(() => {
    requestAnimationFrame(scrollToRequestedSection);
  }, [scrollToRequestedSection]));

  const handleSectionLayout = useCallback((section, event) => {
    sectionOffsets.current[section] = event.nativeEvent.layout.y;
    scrollToRequestedSection();
  }, [scrollToRequestedSection]);

  const save = async (field, value) => {
    setSaving(field);
    try {
      const formData = new FormData();
      formData.append(field, String(value));
      await updateMyProfile(formData);
      if (field === 'preferred_location') {
        setSelectedLocation(value);
      }
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
    await AsyncStorage.removeItem('entryPath');
    await AsyncStorage.removeItem('autoLocationPending');
    await AsyncStorage.removeItem('selectedLocation');
    onSignOut();
  };


  const confirmDelete = async () => {
    if (deleteText.trim().toUpperCase() !== 'DELETE' || deleting) {
      return;
    }

    setDeleting(true);

    try {
      // 1. Try to delete the account from the server
      try {
        await deleteMyAccount();
      } catch (apiError) {
        console.warn('Server delete failed, continuing with local cleanup:', apiError.message);
      }

      // Cancel locally scheduled reminders if not running in Expo Go
      if (Notifications?.cancelAllScheduledNotificationsAsync) {
        await Notifications.cancelAllScheduledNotificationsAsync().catch(() => { });
      }

      // Clear ALL AsyncStorage data (auth token, settings, etc.)
      await AsyncStorage.clear();

      // 3. Clear SecureStore (Keychain) biometric saved credentials
      await SecureStore.deleteItemAsync('saved_username').catch(() => { });
      await SecureStore.deleteItemAsync('saved_password').catch(() => { });

      setDeleteOpen(false);
      setDeleteText('');

      // 4. Show success StatusModal, then redirect to login screen
      setStatusModal({
        visible: true,
        type: 'success',
        title: 'Account Deleted',
        message: 'Your account and data have been removed successfully.',
        onPrimary: () => {
          setStatusModal((prev) => ({ ...prev, visible: false }));
          if (typeof onSignOut === 'function') {
            onSignOut();
          }
        },
      });

      // Auto redirect after 2.5 seconds
      setTimeout(() => {
        if (typeof onSignOut === 'function') {
          onSignOut();
        }
      }, 2500);
    } catch (e) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Could not delete account',
        message: e?.message || 'An unexpected error occurred while deleting your account.',
        onPrimary: () => setStatusModal((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setDeleting(false);
    }
  };


  if (!profile) {
    return (
      <Screen>

        <Header title="Settings" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, backgroundColor: theme.surface }}>
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>

      <Header title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView ref={scrollViewRef} style={{ flex: 1, backgroundColor: theme.surface }}>

        <Section title="Panji source" onLayout={(event) => handleSectionLayout('panji', event)}>
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
              selected={(selectedLocation || profile.preferred_location) === loc.id}
              busy={saving === 'preferred_location'}
              onPress={() => save('preferred_location', loc.id)}
            />
          ))}
          {locations.length === 0 && (
            <Text style={styles.emptyNote}>No locations available yet.</Text>
          )}
        </Section>

        <Section title="Language" onLayout={(event) => handleSectionLayout('language', event)}>
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

        <Pressable
          style={styles.deleteButton}
          onPress={() => {
            setDeleteText('');
            setDeleteOpen(true);
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.deleteText}>  Delete account</Text>
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL(ACCOUNT_DELETION_INFO_URL)}
        >
          <Text style={styles.deleteInfo}>
            How account deletion works
          </Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>
                    Delete your account?
                  </Text>

                  <Text style={styles.modalBody}>
                    This permanently deletes your profile, events, reminders
                    and shared contacts. It cannot be undone.
                    {'\n\n'}
                    Type DELETE to confirm.
                  </Text>

                  <TextInput
                    style={styles.modalInput}
                    value={deleteText}
                    onChangeText={setDeleteText}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="DELETE"
                    placeholderTextColor={theme.textMuted}
                  />

                  <View style={styles.modalRow}>
                    <Pressable
                      style={styles.modalCancel}
                      onPress={() => {
                        Keyboard.dismiss();
                        setDeleteOpen(false);
                      }}
                      disabled={deleting}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.modalConfirm,
                        (
                          deleteText.trim().toUpperCase() !== 'DELETE' ||
                          deleting
                        ) && { opacity: 0.4 },
                      ]}
                      disabled={
                        deleteText.trim().toUpperCase() !== 'DELETE' ||
                        deleting
                      }
                      onPress={() => {
                        Keyboard.dismiss();
                        confirmDelete();
                      }}
                    >
                      {deleting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.modalConfirmText}>
                          Delete forever
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

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

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onPrimary={() => {
          if (statusModal.onPrimary) {
            statusModal.onPrimary();
          } else {
            setStatusModal((prev) => ({ ...prev, visible: false }));
          }
        }}
        onRequestClose={() => {
          if (statusModal.onPrimary) {
            statusModal.onPrimary();
          } else {
            setStatusModal((prev) => ({ ...prev, visible: false }));
          }
        }}
      />
    </Screen>
  );
}

function Section({ title, children, onLayout }) {
  return (
    <View style={{ marginTop: 16 }} onLayout={onLayout}>
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
        <ActivityIndicator size="small" color={theme.primary} />
      ) : selected ? (
        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
      ) : (
        <Ionicons name="ellipse-outline" size={20} color={theme.primaryTint} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 14 },
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.error,
    borderRadius: radius.m,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  deleteInfo: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  keyboardAvoid: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.surface,
    borderRadius: radius.l,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 19,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.m,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    color: theme.text,
    letterSpacing: 2,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radius.m,
    backgroundColor: theme.surfaceAlt,
  },
  modalCancelText: {
    color: theme.text,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radius.m,
    backgroundColor: '#993C1D',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});
