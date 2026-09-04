// GodsScreen.js — pick a deity, then see their songs
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { theme, spacing, radius } from './theme';
// import { getGods } from '../services/api'; // expected: [{ id, name, name_local, image }]

const NUM_COLUMNS = 3;

const DUMMY_GODS = [
  { id: 1, name: 'Krishna', name_local: 'कृष्ण', image: null },
  { id: 2, name: 'Shiva', name_local: 'शिव', image: null },
  { id: 3, name: 'Ganesha', name_local: 'गणेश', image: null },
  { id: 4, name: 'Durga', name_local: 'दुर्गा', image: null },
  { id: 5, name: 'Vishnu', name_local: 'विष्णु', image: null },
  { id: 6, name: 'Hanuman', name_local: 'हनुमान', image: null },
  { id: 7, name: 'Lakshmi', name_local: 'लक्ष्मी', image: null },
  { id: 8, name: 'Saraswati', name_local: 'सरस्वती', image: null },
  { id: 9, name: 'Jagannath', name_local: 'ଜଗନ୍ନାଥ', image: null },
];

export default function GodsScreen({ navigation, hideHeader }) {
  const [gods, setGods] = useState(null);

  // useEffect(() => {
  //   getGods()
  //     .then(setGods)
  //     .catch((e) => {
  //       console.warn(e);
  //       setGods([]);
  //     });
  // }, []);

  useEffect(() => {
    const timer = setTimeout(() => setGods(DUMMY_GODS), 300); // mimic network delay
    return () => clearTimeout(timer);
  }, []);

  if (!gods) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, hideHeader && { backgroundColor: 'transparent' }]}>
      {!hideHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Devotional Songs</Text>
          <Text style={styles.headerSubtitle}>Choose a deity to listen</Text>
        </View>
      )}

      <FlatList
        data={gods}
        keyExtractor={(item) => String(item.id)}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <Pressable
            style={styles.tile}
            onPress={() =>
              navigation.navigate('SongsList', { godId: item.id, godName: item.name })
            }
          >
            <View style={styles.tileImageWrap}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.tileImage} />
              ) : (
                <Text style={styles.tileFallback}>🪷</Text>
              )}
            </View>
            <Text style={styles.tileName} numberOfLines={1}>{item.name}</Text>
            {!!item.name_local && (
              <Text style={styles.tileNameLocal} numberOfLines={1}>{item.name_local}</Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const TILE_SIZE = 96;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surfaceAlt },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surfaceAlt },
  header: {
    backgroundColor: theme.sky,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
    borderBottomLeftRadius: radius.l,
    borderBottomRightRadius: radius.l,
  },
  headerTitle: { color: theme.skyText, fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: theme.skyMuted, fontSize: 13, marginTop: 2 },
  grid: { padding: spacing.base },
  gridRow: { justifyContent: 'flex-start', gap: spacing.sm },
  tile: {
    width: TILE_SIZE,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tileImageWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.pill,
    backgroundColor: theme.sacredTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  tileImage: { width: '100%', height: '100%' },
  tileFallback: { fontSize: 36 },
  tileName: {
    marginTop: spacing.xs,
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  tileNameLocal: {
    color: theme.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
