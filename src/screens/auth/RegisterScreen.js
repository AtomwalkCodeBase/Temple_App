// RegisterScreen.js — self-service signup, optional invite code for Gold.
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Alert,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REGISTER_URL } from '../../services/api';
import { theme, radius } from '../../screens/theme';
import { getPreLoginGreeting } from '../../services/i18n';

export default function RegisterScreen({ onRegistered, onGoToLogin }) {
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username || !password) {
      Alert.alert('Missing details', 'Username and password are required.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
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
      if (data.invite_applied) {
        Alert.alert('Welcome!', `Invite code applied — you're on the ${data.tier} plan.`);
      }
      onRegistered();
    } catch (e) {
      Alert.alert('Could not create account', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>{getPreLoginGreeting()}</Text>
      <Text style={styles.subtitle}>Create your Panji account</Text>

      <TextInput style={styles.input} placeholder="Your name"
        placeholderTextColor={theme.textMuted} value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Username"
        placeholderTextColor={theme.textMuted} autoCapitalize="none"
        value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Phone (optional)"
        placeholderTextColor={theme.textMuted} keyboardType="phone-pad"
        value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="Password (min 8 characters)"
        placeholderTextColor={theme.textMuted} secureTextEntry
        value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Family invite code (optional)"
        placeholderTextColor={theme.textMuted} autoCapitalize="characters"
        value={inviteCode} onChangeText={setInviteCode} />
      <Text style={styles.hint}>
        Have a family invite code? Enter it above to unlock Gold features.
      </Text>

      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
      </Pressable>

      <Pressable onPress={onGoToLogin} style={{ marginTop: 16 }}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1, backgroundColor: theme.sky, justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 40,
  },
  title: { color: theme.skyText, fontSize: 30, textAlign: 'center', marginBottom: 4 },
  subtitle: { color: theme.skyMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: radius.m,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    marginBottom: 10, color: theme.text,
  },
  hint: { color: theme.skyMuted, fontSize: 12, marginBottom: 16, marginTop: -2 },
  button: {
    backgroundColor: theme.accent, borderRadius: radius.m,
    paddingVertical: 13, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  link: { color: theme.skyMuted, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
});
