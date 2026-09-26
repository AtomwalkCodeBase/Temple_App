import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, ActivityIndicator, ScrollView, Modal, FlatList, StatusBar as RNStatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BASE_URL } from '../../services/api';
import { theme, radius, spacing, fontSize } from '../../theme/theme';
import StatusModal from '../../components/StatusModal';
import { COUNTRY_CODES } from '../../constants/constant';

const CODE_LENGTH = 6;

export default function PhoneAuthScreen({ onLoggedIn, onGoToLogin }) {
  const [countryCode, setCountryCode] = useState('+91');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState('phone');   // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const timerRef = useRef(null);
  const codeInputRef = useRef(null);

  const showError = (title, message) => setErrorModal({ visible: true, title, message });
  const hideError = () => setErrorModal((prev) => ({ ...prev, visible: false }));

  const startResendTimer = () => {
    setResendIn(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const fullPhone = `${countryCode}${phone.trim()}`;

  const requestCode = async () => {
    if (phone.trim().length < 8) {
      showError('Enter your number', 'Enter the mobile number linked to your account.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/otp/request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not send code. Check the number and try again.');
      setStep('code');
      startResendTimer();
    } catch (e) {
      showError('Could not send code', e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (code.trim().length !== CODE_LENGTH) {
      showError('Enter the code', `The code is ${CODE_LENGTH} digits.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/otp/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not verify code.');
      await AsyncStorage.setItem('auth_token', data.token);
      onLoggedIn();
    } catch (e) {
      showError('Could not verify', e.message);
    } finally {
      setBusy(false);
    }
  };

  const codeDigits = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] || '');

  // useEffect(() => {
  //   RNStatusBar.setBackgroundColor(theme.primary);
  //   RNStatusBar.setBarStyle('light-content');

  //   return () => {
  //     RNStatusBar.setBackgroundColor('transparent');
  //     RNStatusBar.setBarStyle('light-content');
  //   };
  // }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }} edges={['top', 'left', 'right']}>
      <ScrollView
        style={{ backgroundColor: theme.surface }}
        contentContainerStyle={[styles.screen]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, backgroundColor: theme.surface, paddingHorizontal: spacing.xl, }}>
          <Pressable
            onPress={() => (step === 'code' ? (setStep('phone'), setCode('')) : onGoToLogin?.())}
            hitSlop={10}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>

          <View style={styles.iconBadge}>
            <Ionicons
              name={step === 'phone' ? 'key-outline' : 'chatbox-ellipses-outline'}
              size={30}
              color={theme.primary}
            />
          </View>

          {step === 'phone' ? (
            <>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter the mobile number linked to your account. We'll text you a code to log you in — no password needed.
              </Text>

              <Text style={styles.fieldLabel}>Mobile number</Text>
              <View style={styles.phoneRow}>
                <Pressable style={styles.countryCode} onPress={() => setCountryPickerVisible(true)}>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
                </Pressable>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                  maxLength={10}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, busy && { opacity: 0.7 }]}
                onPress={requestCode}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color={theme.textOnPrimary} /> : (
                  <Text style={styles.buttonText}>Send code</Text>
                )}
              </Pressable>

              <Pressable onPress={onGoToLogin} style={{ alignSelf: 'center', marginTop: spacing.lg }}>
                <Text style={styles.link}>Remembered it? Back to login</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>
                Enter the code sent to <Text style={styles.subtitleStrong}>{fullPhone}</Text>
              </Text>

              <Pressable style={styles.codeBoxRow} onPress={() => codeInputRef.current?.focus()}>
                {codeDigits.map((digit, i) => (
                  <View
                    key={i}
                    style={[
                      styles.codeBox,
                      digit ? styles.codeBoxFilled : null,
                      code.length === i && styles.codeBoxActive,
                    ]}
                  >
                    <Text style={styles.codeBoxText}>{digit}</Text>
                  </View>
                ))}
              </Pressable>

              <TextInput
                ref={codeInputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                value={code}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
                autoFocus
              />

              <Pressable onPress={requestCode} disabled={resendIn > 0 || busy} style={{ alignSelf: 'center', marginBottom: spacing.xl }}>
                <Text style={[styles.link, resendIn > 0 && { opacity: 0.5 }]}>
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Didn't receive it? Resend"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, busy && { opacity: 0.7 }]}
                onPress={verifyCode}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color={theme.textOnPrimary} /> : (
                  <Text style={styles.buttonText}>Verify &amp; log in</Text>
                )}
              </Pressable>
            </>
          )}

          <StatusModal
            visible={errorModal.visible}
            type="error"
            title={errorModal.title}
            message={errorModal.message}
            primaryLabel="Retry"
            onPrimary={hideError}
            onRequestClose={hideError}
          />

          {/* New modal — place near the closing StatusModal */}
          <Modal
            visible={countryPickerVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setCountryPickerVisible(false)}
          >
            <View style={styles.pickerOverlay}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setCountryPickerVisible(false)} />
              <View style={[styles.pickerSheet, { paddingBottom: insets.bottom + spacing.base }]}>
                <View style={styles.pickerHandle} />
                <Text style={styles.pickerTitle}>Select country code</Text>
                <FlatList
                  data={COUNTRY_CODES}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.pickerRow}
                      onPress={() => { setCountryCode(item.code); setCountryPickerVisible(false); }}
                    >
                      <Text style={styles.pickerRowCode}>{item.code}</Text>
                      <Text style={styles.pickerRowName}>{item.name}</Text>
                      {countryCode === item.code && (
                        <Ionicons name="checkmark" size={18} color={theme.primary} />
                      )}
                    </Pressable>
                  )}
                />
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: theme.primary },

  backBtn: { width: 36, height: 36, justifyContent: 'center', marginBottom: spacing.lg },

  iconBadge: {
    width: 64, height: 64, borderRadius: radius.pill,
    backgroundColor: theme.primaryTint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  title: { fontSize: fontSize.xxl, fontWeight: '700', color: theme.text },
  subtitle: { color: theme.textMuted, fontSize: fontSize.base, marginTop: 6, marginBottom: spacing.xl, lineHeight: 20 },
  subtitleStrong: { color: theme.text, fontWeight: '700' },

  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: theme.textMuted, marginBottom: 6 },

  phoneRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  countryCode: {
    borderBottomWidth: 1.5, borderBottomColor: theme.border,
    justifyContent: 'center', paddingHorizontal: 4, paddingBottom: 10,
  },
  countryCodeText: { fontSize: fontSize.lg, color: theme.text, fontWeight: '600' },
  phoneInput: {
    flex: 1,
    borderBottomWidth: 1.5, borderBottomColor: theme.border,
    fontSize: fontSize.lg, color: theme.text,
    paddingBottom: 10,
  },

  codeBoxRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  codeBox: {
    width: 46, height: 54, borderRadius: radius.m,
    borderWidth: 1.5, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center',
  },
  codeBoxFilled: { borderColor: theme.primary },
  codeBoxActive: { borderColor: theme.primary, borderWidth: 2 },
  codeBoxText: { fontSize: fontSize.xl, fontWeight: '700', color: theme.text },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },

  button: {
    backgroundColor: theme.primary,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonPressed: { backgroundColor: theme.primaryDark },
  buttonText: { color: theme.textOnPrimary, fontSize: fontSize.md, fontWeight: '700' },

  link: { color: theme.primary, fontSize: fontSize.sm, fontWeight: '700' },
  countryCode: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderBottomWidth: 1.5, borderBottomColor: theme.border,
    paddingHorizontal: 4, paddingBottom: 10,
  },
  countryCodeText: { fontSize: fontSize.lg, color: theme.text, fontWeight: '600' },

  // New styles
  pickerOverlay: { flex: 1, backgroundColor: theme.themeOverlay, justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l,
    paddingHorizontal: spacing.base, paddingTop: spacing.sm,
    maxHeight: '60%',
  },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: spacing.sm },
  pickerTitle: { fontSize: fontSize.md, fontWeight: '700', color: theme.text, marginBottom: spacing.sm },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border,
  },
  pickerRowCode: { fontSize: fontSize.md, fontWeight: '700', color: theme.text, width: 56 },
  pickerRowName: { flex: 1, fontSize: fontSize.base, color: theme.textMuted },
});