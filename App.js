// App.js
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './src/screens/SplashScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { registerPushToken } from './src/services/notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { PlayerProvider } from './src/context/PlayerContext';
import { UserProvider } from './src/context/UserContext';
import { useColorScheme } from 'react-native';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import NoInternetModal from './src/components/NoInternetModal';

export default function App() {
  const isConnected = useNetworkStatus();
  const [booting, setBooting] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const statusBarStyle = isDarkMode ? 'dark' : 'light';

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
      <SafeAreaProvider>
        <StatusBar style="dark" translucent={true} />
        <SplashScreen onFinished={() => setShowSplash(false)} />
        <NoInternetModal visible={!isConnected} />
      </SafeAreaProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" translucent={true} />
        <AuthNavigator onAuthenticated={handleAuthenticated} />
        <NoInternetModal visible={!isConnected} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/* <PlayerProvider> */}
      <UserProvider>
        <StatusBar style={statusBarStyle} />
        <RootNavigator onSignOut={handleSignOut} />
      </UserProvider>
      {/* </PlayerProvider> */}
      <NoInternetModal visible={!isConnected} />
    </SafeAreaProvider>
  );
}
