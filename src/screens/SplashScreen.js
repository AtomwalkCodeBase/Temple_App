// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import AppText from '../components/AppText';
import Screen from '../components/Screen';
import theme, { spacing } from '../theme/theme';

export default function SplashScreen({ onFinished }) {

  useEffect(() => {
    const timer = setTimeout(() => onFinished?.(), 1400);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <Image
        source={require('../assets/logo-diya.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="App logo"
      />
      <AppText variant="h2" style={{ marginTop: spacing.lg }}>
        Temple Devotee
      </AppText>
      <AppText variant="bodySmall" color="textSecondary" style={{ marginTop: spacing.xs }}>
        Your spiritual calendar
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
  },
});
