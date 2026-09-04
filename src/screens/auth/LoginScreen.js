// LoginScreen.js — obtains the DRF auth token and stores it for api.js.
//
// MVP: username/password against POST /api-token-auth/ (same endpoint the
// admin web uses, just with a regular, non-staff user). This is a
// placeholder — phone+OTP is the real plan for a family/friends app, but
// this unblocks development today with zero extra backend work.
//
// Swapping to OTP later only touches this screen + one backend endpoint;
// api.js and every other screen are unaffected since they just read
// whatever token is in AsyncStorage.

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { AUTH_LOGIN_URL } from '../../services/api';
import { theme, radius } from '../../screens/theme';
import { getPreLoginGreeting } from '../../services/i18n';
import StatusModal from '../../components/StatusModal';
import { Eye, EyeClosed } from 'lucide-react-native';

export default function LoginScreen({ onLoggedIn, onGoToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: "", message: "" });
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [hasSavedCreds, setHasSavedCreds] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setBiometricSupported(true);
      }
      const savedUser = await SecureStore.getItemAsync('saved_username');
      const savedPass = await SecureStore.getItemAsync('saved_password');
      if (savedUser && savedPass) {
        setHasSavedCreds(true);
      }
    })();
  }, []);

  const performLogin = async (u, p) => {
    setBusy(true);
    try {
      const res = await fetch(AUTH_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      if (!res.ok) throw new Error('Invalid username or password');
      const data = await res.json();
      
      await SecureStore.setItemAsync('saved_username', u);
      await SecureStore.setItemAsync('saved_password', p);
      
      await AsyncStorage.setItem('auth_token', data.key);
      onLoggedIn();
    } catch (e) {
      setShowModal(true)
      setModalData({ title: "Could not sign in", message: e.message })
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!username || !password) {
      setShowModal(true)
      setModalData({ title: "Missing details", message: "Enter both username and password." })
      return;
    }
    await performLogin(username, password);
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Agam Mandira',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        const savedUser = await SecureStore.getItemAsync('saved_username');
        const savedPass = await SecureStore.getItemAsync('saved_password');
        if (savedUser && savedPass) {
          await performLogin(savedUser, savedPass);
        }
      }
    } catch (e) {
      console.warn('Biometric auth failed:', e);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{getPreLoginGreeting()}</Text>
      <Text style={styles.subtitle}>Sign in to your Panji</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      {/* <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      /> */}
      <View style={styles.passwordWrapper}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          placeholderTextColor={theme.textMuted}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={styles.eyeButton}
          onPress={() => setShowPassword(prev => !prev)}
        >
          {showPassword ? <EyeClosed size={20} color={theme.textMuted} /> : <Eye size={20} color={theme.textMuted} />}
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </Pressable>

      {biometricSupported && hasSavedCreds && (
        <Pressable style={styles.biometricButton} onPress={handleBiometricAuth} disabled={busy}>
          <Text style={styles.biometricButtonText}>Login with Biometrics</Text>
        </Pressable>
      )}

      <Pressable onPress={onGoToRegister} style={{ marginTop: 16 }}>
        <Text style={styles.link}>New here? Create an account</Text>
      </Pressable>

      <StatusModal
        visible={showModal}
        type='error'
        title={modalData.title}
        message={modalData.message}
        primaryLabel="Retry"
        onPrimary={() => setShowModal(false)}
        onRequestClose={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: theme.sky, justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: { color: theme.skyText, fontSize: 34, textAlign: 'center', marginBottom: 4 },
  subtitle: { color: theme.skyMuted, fontSize: 14, textAlign: 'center', marginBottom: 28 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: radius.m,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    marginBottom: 10, color: theme.text,
  },
  button: {
    backgroundColor: theme.accent, borderRadius: radius.m,
    paddingVertical: 13, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  biometricButton: {
    backgroundColor: 'transparent', borderRadius: radius.m,
    borderWidth: 1, borderColor: theme.accent,
    paddingVertical: 13, alignItems: 'center', marginTop: 12,
  },
  biometricButtonText: { color: theme.accent, fontSize: 15, fontWeight: '600' },
  link: { color: theme.skyMuted, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
  passwordWrapper: {
    position: 'relative',
  },

  passwordInput: {
    paddingRight: 45,
  },

  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
