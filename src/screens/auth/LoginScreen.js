import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { AUTH_LOGIN_URL } from '../../services/api';
import { theme, radius, spacing, fontSize } from '../../theme/theme';
import StatusModal from '../../components/StatusModal';
import { Eye, EyeClosed, Fingerprint, ScanFace } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen({ onLoggedIn, onGoToRegister, onGoToPhoneAuth }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: "", message: "" });

  //biometric device status
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [hasSavedCreds, setHasSavedCreds] = useState(false);

  const appVersion = Constants.expoConfig?.version || '0.0.1';

  useEffect(() => {
    let isMounted = true;

    const initializeBiometric = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();

        if (!compatible) {
          if (isMounted) {
            setBiometricSupported(false);
            setBiometricType(null);
          }
          return;
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (!enrolled) {
          if (isMounted) {
            setBiometricSupported(false);
            setBiometricType(null);
          }
          return;
        }

        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        let detectedType = null;

        // Prefer Face ID when available
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          detectedType = 'face';
        }

        // Fingerprint covers Touch ID on iOS and fingerprint
        // authentication on Android.
        else if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT
          )
        ) {
          detectedType = 'fingerprint';
        }

        if (isMounted) {
          setBiometricType(detectedType);
          setBiometricSupported(!!detectedType);
        }

        // Check whether saved credentials exist
        const savedUser = await SecureStore.getItemAsync('saved_username');
        const savedPass = await SecureStore.getItemAsync('saved_password');

        if (savedUser && savedPass && detectedType) {
          if (isMounted) {
            setHasSavedCreds(true);
          }

          // Automatically trigger biometric login
          setTimeout(() => {
            if (isMounted) {
              handleBiometricAuth();
            }
          }, 400);
        } else if (isMounted) {
          setHasSavedCreds(false);
        }
      } catch (error) {
        console.warn('Biometric initialization failed:', error);

        if (isMounted) {
          setBiometricSupported(false);
          setBiometricType(null);
          setHasSavedCreds(false);
        }
      }
    };

    initializeBiometric();

    return () => {
      isMounted = false;
    };
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
      await AsyncStorage.setItem('entryPath', 'login');
      await AsyncStorage.setItem('autoLocationPending', 'false');
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
    if (busy) return;

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();

      if (!compatible) {
        // Device doesn't have biometric hardware — silently hide the button
        setBiometricSupported(false);
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!enrolled) {
        // Face ID / fingerprint not set up on this device
        setShowModal(true);
        setModalData({
          title: 'Biometrics Not Set Up',
          message:
            biometricType === 'face'
              ? 'Face ID is not set up on this device. Go to Settings → Face ID & Passcode to enable it.'
              : 'No fingerprint is enrolled on this device. Go to Settings to set it up.',
        });
        return;
      }

      // Check if our app has permission to use Face ID (iOS only)
      const permissionResult = await LocalAuthentication.getEnrolledLevelAsync();
      // permissionResult === 0 means no biometrics available/permitted
      if (permissionResult === LocalAuthentication.SecurityLevel.NONE) {
        setShowModal(true);
        setModalData({
          title: 'Permission Required',
          message:
            'Face ID access is not permitted for this app. Go to Settings → Privacy → Face ID & Passcode and enable access for this app.',
        });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          biometricType === 'face'
            ? 'Login with Face ID'
            : 'Login with Fingerprint',
        disableDeviceFallback: false, // Prevent iOS from falling back to device passcode
      });

      if (!result.success) {
        // Handle specific error codes
        if (result.error === 'not_enrolled') {
          setShowModal(true);
          setModalData({
            title: 'Biometrics Not Set Up',
            message: 'Please set up Face ID or fingerprint in your device Settings.',
          });
        } else if (result.error === 'not_available') {
          // Silently hide the biometric option
          setBiometricSupported(false);
          setHasSavedCreds(false);
        }
        // For 'user_cancel' or 'system_cancel' — just do nothing, let user try again
        return;
      }

      const savedUser = await SecureStore.getItemAsync('saved_username');
      const savedPass = await SecureStore.getItemAsync('saved_password');

      if (!savedUser || !savedPass) {
        // Credentials were cleared — hide biometric and ask user to log in manually
        setHasSavedCreds(false);
        setBiometricSupported(false);
        return;
      }

      await performLogin(savedUser, savedPass);
    } catch (error) {
      console.warn('Biometric authentication failed:', error);
      // Could be a permission denial on iOS — inform the user
      if (error?.message?.toLowerCase().includes('permission')) {
        setShowModal(true);
        setModalData({
          title: 'Face ID Permission Denied',
          message:
            'This app does not have permission to use Face ID. Go to Settings → Privacy → Face ID & Passcode and allow access.',
        });
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: insets.bottom + spacing.sm }]}>
      {/* Night sky hero, dressed with mandala rings + rangoli dots */}
      {/* <View style={styles.hero}> */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Image source={require('../../assets/logo_white.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Agam Mandira</Text>
        <Text style={styles.subtitle}>Agam Wisdom, Living Traditions</Text>
      </View>

      {/* <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <View style={styles.dotArc}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === 3 && styles.dotCenter,
            ]}
          />
        ))}
      </View> */}

      {/* Bunting — temple-flag strip where sky meets the card */}
      {/* <View style={styles.bunting}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={styles.flag} />
        ))}
      </View> */}
      {/* </View> */}

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.cardAccent} />

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor={theme.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword(p => !p)} hitSlop={8}>
            {showPassword ? <EyeClosed size={20} color={theme.textMuted} /> : <Eye size={20} color={theme.textMuted} />}
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </Pressable>

        <Pressable onPress={onGoToPhoneAuth} style={{ marginTop: spacing.lg }}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>

        {hasSavedCreds && biometricSupported && biometricType && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={styles.biometricCircleLarge}
              onPress={handleBiometricAuth}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={theme.primary} />
              ) : biometricType === 'face' ? (
                <ScanFace size={60} color={theme.primary} />
              ) : (
                <Fingerprint size={60} color={theme.primary} />
              )}
            </Pressable>

            <Text style={styles.biometricLabel}>
              {biometricType === 'face'
                ? 'Login with Face ID'
                : 'Login with Fingerprint'}
            </Text>
          </>
        )}

        <Pressable onPress={onGoToRegister} style={{ marginTop: spacing.lg }}>
          <Text style={styles.link}>New here? Create an account</Text>
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

  hero: {
    backgroundColor: theme.primary,
    paddingTop: 56,
    paddingBottom: 60,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  logoCircle: {
    width: 75, height: 75, borderRadius: 50,
    // backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  logo: { width: 80, height: 80 },
  title: {
    color: theme.textOnPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  starRow: { ...StyleSheet.absoluteFillObject },
  star: {
    position: 'absolute',
    width: 3, height: 3, borderRadius: 2,
    backgroundColor: theme.star,
    opacity: 0.8,
  },

  // Mandala rings around the moon medallion
  mandalaOuter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 1,
    borderColor: theme.skyLine,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  mandalaInner: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 1,
    borderColor: theme.sacred,
    backgroundColor: 'rgba(250,238,218,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  subtitle: {
    color: theme.textOnPrimary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 500
  },
  cardAccent: {
    width: 32, height: 3, borderRadius: 2,
    backgroundColor: theme.accentBold,
    marginBottom: spacing.lg,
  },

  // Rangoli dot arc under the subtitle
  dotArc: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: theme.skyLine,
  },
  dotCenter: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: theme.sacred,
  },

  // Temple bunting strip at the base of the hero
  bunting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '86%',
    marginTop: spacing.xl,
  },
  flag: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.sacred,
    opacity: 0.7,
  },

  // --- Card ---
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: theme.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: spacing.xxl,
    marginTop: -18,
    alignItems: 'center',
  },
  cardAccent: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.sacred,
    marginBottom: spacing.lg,
  },

  input: {
    width: '100%',
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
  passwordWrapper: { position: 'relative', width: '100%' },
  passwordInput: { paddingRight: 32 },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  button: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonPressed: { backgroundColor: theme.secondary },
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: {
    marginHorizontal: spacing.sm,
    color: theme.textMuted,
    fontSize: fontSize.sm,
  },
  biometricCircleLarge: {
    width: 120, height: 120, borderRadius: 70,
    borderWidth: 2,
    borderColor: theme.primary,
    backgroundColor: theme.primaryTint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  biometricLabel: {
    color: theme.text,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
});