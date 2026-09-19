// RegisterScreen.js — self-service signup, optional invite code for Gold.
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Alert,
  StyleSheet, ActivityIndicator, ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REGISTER_URL } from '../../services/api';
import { theme, radius, spacing, fontSize } from '../../theme/theme';
import { getPreLoginGreeting } from '../../services/i18n';
import StatusModal from '../../components/StatusModal';
import { Eye, EyeClosed, Moon, Sparkles } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen({ onRegistered, onGoToLogin }) {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: "", message: "" });
  const [showPassword, setShowPassword] = useState(false);

  const appVersion = Constants.expoConfig?.version || '0.0.1';

  const submit = async () => {
    if (!username || !password) {
      setShowModal(true);
      setModalData({ title: "Missing details", message: "Username and password are required." })
      return;
    }
    if (password.length < 8) {
      setShowModal(true);
      setModalData({ title: "Password too short", message: "Use at least 8 characters." })
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, password, first_name: firstName,
          phone, invite_code: inviteCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstError = Object.values(data)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : 'Could not register');
      }
      await AsyncStorage.setItem('auth_token', data.token);
      await SecureStore.setItemAsync('saved_username', username);
      await SecureStore.setItemAsync('saved_password', password);
      await AsyncStorage.setItem('entryPath', 'register');
      await AsyncStorage.setItem('autoLocationPending', 'true');
      if (data.invite_applied) {
        setShowModal(true);
        setModalData({ title: "Welcome!", message: `Invite code applied — you're on the ${data.tier} plan.` })
      }
      onRegistered();
    } catch (e) {
      setShowModal(true);
      setModalData({ title: "Could not create account", message: e.message })
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: insets.bottom + spacing.sm }]}>
      {/* Night sky hero */}
      {/* <View style={styles.hero}>
        <View style={styles.starRow}>
          <View style={[styles.star, { top: 6, left: '18%' }]} />
          <View style={[styles.star, { top: 26, left: '72%' }]} />
          <View style={[styles.star, { top: 2, left: '48%' }]} />
          <View style={[styles.star, { top: 40, left: '30%' }]} />
          <View style={[styles.star, { top: 34, left: '85%' }]} />
        </View>
        <View style={styles.moonWrap}>
          <Moon size={30} color={theme.moon} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{getPreLoginGreeting()}</Text>
        <Text style={styles.subtitle}>Begin your journey with Agam Mandira</Text>
      </View> */}

      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Image source={require('../../assets/logo_white.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Agam Mandira</Text>
        <Text style={styles.subtitle}>Agam Wisdom, Living Traditions</Text>
      </View>

      {/* Daylight form card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Enter your details</Text>

        <TextInput style={styles.input} placeholder="Your name"
          placeholderTextColor={theme.textMuted} value={firstName} onChangeText={setFirstName} />
        <TextInput style={styles.input} placeholder="Username"
          placeholderTextColor={theme.textMuted} autoCapitalize="none"
          value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Phone (optional)"
          placeholderTextColor={theme.textMuted} keyboardType="phone-pad"
          value={phone} onChangeText={setPhone} />

        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password (min 8 characters)"
            placeholderTextColor={theme.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            onPress={() => setShowPassword(prev => !prev)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            {showPassword ? <EyeClosed size={20} color={theme.textMuted} /> : <Eye size={20} color={theme.textMuted} />}
          </Pressable>
        </View>

        {/* Sacred invite moment — set apart in gold, not another plain input */}
        <View style={styles.inviteBlock}>
          <View style={styles.inviteHeader}>
            <Sparkles size={14} color={theme.sacredMuted} />
            <Text style={styles.inviteLabel}>Family invite</Text>
          </View>
          <TextInput
            style={styles.inviteInput}
            placeholder="Enter code to unlock Gold"
            placeholderTextColor={theme.sacredMuted}
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
          />
          <Text style={styles.inviteHint}>Optional — a family member's code brings you in on Gold.</Text>
        </View>

        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
        </Pressable>

        <Pressable onPress={onGoToLogin} style={{ marginTop: spacing.lg }}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          App Version: {appVersion}
        </Text>
      </View>

      <StatusModal
        visible={showModal}
        type='error'
        title={modalData.title}
        message={modalData.message}
        primaryLabel="Retry"
        onPrimary={() => setShowModal(false)}
        onRequestClose={() => setShowModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: theme.surfaceAlt,
  },

  // --- Hero: night sky ---
  hero: {
    backgroundColor: theme.primary,
    paddingTop: 64,
    paddingBottom: 40,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    // borderBottomLeftRadius: radius.lg,
    // borderBottomRightRadius: radius.lg,
    overflow: 'hidden',
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 50,
    // backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  logo: { width: 80, height: 80 },
  title: {
    color: theme.textOnPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.textOnPrimary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: 4,
  },
  starRow: { ...StyleSheet.absoluteFillObject },
  star: {
    position: 'absolute',
    width: 3, height: 3, borderRadius: 2,
    backgroundColor: theme.star,
    opacity: 0.8,
  },
  moonWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(250,238,218,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: theme.skyChipBorder,
  },

  // --- Card: daylight form ---
  card: {
    marginTop: -24,
    marginHorizontal: spacing.lg,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    color: theme.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.m,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
    color: theme.text,
  },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 45 },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  // --- Invite: sacred/gold moment ---
  inviteBlock: {
    backgroundColor: theme.sacredTint,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: theme.sacred,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inviteLabel: {
    color: theme.sacredText,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  inviteInput: {
    backgroundColor: theme.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: theme.sacred,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.md,
    color: theme.sacredText,
  },
  inviteHint: {
    color: theme.sacredMuted,
    fontSize: fontSize.xs,
    marginTop: 6,
  },

  button: {
    backgroundColor: theme.primary,
    borderRadius: radius.m,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: { backgroundColor: theme.accentDeep },
  buttonText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
  link: {
    color: theme.textMuted,
    fontSize: fontSize.base,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  versionContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#95a5a6',
  },
});