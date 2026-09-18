// context/UserContext.js — single source of truth for user profile
// Shared across HomeScreen, MonthScreen, SettingsScreen, ProfileScreen

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyProfile } from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0); // increments on profile change
  const [selectedLocation, setSelectedLocationState] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (e) {
      console.warn('Failed to load profile:', e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSelectedLocation = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedLocation');
      if (saved) setSelectedLocationState(parseInt(saved, 10));
    } catch (e) {
      console.warn('Failed to load selected location:', e);
    }
  }, []);

  const setSelectedLocation = useCallback(async (locationId) => {
    try {
      await AsyncStorage.setItem('selectedLocation', locationId.toString());
      setSelectedLocationState(locationId);
    } catch (e) {
      console.warn('Failed to save selected location:', e);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadSelectedLocation();
  }, [loadProfile, loadSelectedLocation]);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    await loadProfile();
    setVersion(v => v + 1);
  }, [loadProfile]);

  return (
    <UserContext.Provider value={{ profile, loading, refreshProfile, version, selectedLocation, setSelectedLocation }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used inside <UserProvider>');
  }
  return ctx;
}