// App.js
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './src/screens/SplashScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { registerPushToken } from './src/services/notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayerProvider } from './src/context/PlayerContext';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');

        setIsAuthenticated(!!token);
        if (token) {
          registerPushToken();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    registerPushToken();

  };

  const handleSignOut = () => setIsAuthenticated(false);

  if (showSplash || booting) {
    return (
      <ThemeProvider>
        <StatusBar style="translucent" translucent backgroundColor="transparent" />
        <SplashScreen onFinished={() => setShowSplash(false)} />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <AuthNavigator onAuthenticated={handleAuthenticated} />
      </ThemeProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <ThemeProvider>
          <StatusBar style="auto" translucent backgroundColor="transparent" />
          <RootNavigator onSignOut={handleSignOut} />
        </ThemeProvider>
      </PlayerProvider>
    </SafeAreaProvider>
  );
}
