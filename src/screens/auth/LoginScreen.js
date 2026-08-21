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

import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Alert,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_LOGIN_URL } from '../../services/api';
import { theme, radius } from '../../screens/theme';
import { getPreLoginGreeting } from '../../services/i18n';

export default function LoginScreen({ onLoggedIn, onGoToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username || !password) {
      Alert.alert('Missing details', 'Enter both username and password.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(AUTH_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Invalid username or password');
      const data = await res.json();               // dj_rest_auth: { "key": "..." }
      await AsyncStorage.setItem('auth_token', data.key);
      onLoggedIn();
    } catch (e) {
      Alert.alert('Could not sign in', e.message);
    } finally {
      setBusy(false);
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
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </Pressable>

      <Pressable onPress={onGoToRegister} style={{ marginTop: 16 }}>
        <Text style={styles.link}>New here? Create an account</Text>
      </Pressable>
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
  link: { color: theme.skyMuted, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
});
