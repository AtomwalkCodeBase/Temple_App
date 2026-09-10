// src/hooks/useNetworkStatus.js
// Subscribes to network state changes and returns whether the device has
// an active internet connection. Returns `true` initially so the modal
// doesn't flash on startup while the first check is in-flight.

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  // Start with `true` to avoid a false-positive flash on cold start.
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Fetch the current state immediately.
    NetInfo.fetch().then((state) => {
      setIsConnected(!!(state.isConnected && state.isInternetReachable !== false));
    });

    // Subscribe to future changes.
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!(state.isConnected && state.isInternetReachable !== false));
    });

    return unsubscribe;
  }, []);

  return isConnected;
}
