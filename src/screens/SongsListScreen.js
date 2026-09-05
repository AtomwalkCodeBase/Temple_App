// SongsListScreen.js — songs for the god picked in GodsScreen
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { theme, spacing, radius } from './theme';
// import { getSongsByGod } from '../services/api'; // expected: [{ id, title, artist, duration, cover }]
import { usePlayer } from '../context/PlayerContext'; // exposes { current, playing, play }

const DUMMY_SONGS_BY_GOD = {
  1: [
    { id: 101, title: 'Hare Krishna Hare Rama', artist: 'Anup Jalota', duration: 240, cover: null },
    { id: 102, title: 'Achyutam Keshavam', artist: 'Anuradha Paudwal', duration: 300, cover: null },
    { id: 103, title: 'Govinda Bolo Hari Gopal Bolo', artist: 'Traditional', duration: 210, cover: null },
  ],
  2: [
    { id: 201, title: 'Om Namah Shivaya', artist: 'Traditional', duration: 260, cover: null },
    { id: 202, title: 'Shiv Tandav Stotram', artist: 'Shankar Mahadevan', duration: 320, cover: null },
  ],
  3: [
    { id: 301, title: 'Ganpati Bappa Morya', artist: 'Traditional', duration: 200, cover: null },
    { id: 302, title: 'Sukhkarta Dukhharta', artist: 'Lata Mangeshkar', duration: 230, cover: null },
  ],
};
const DEFAULT_SONGS = [
  { id: 901, title: 'Devotional Bhajan', artist: 'Traditional', duration: 220, cover: null },
];

export default function SongsListScreen({ route, navigation }) {
  const { godId, godName } = route.params;
  const [songs, setSongs] = useState(null);
  const { current, playing, play } = usePlayer();

  // useEffect(() => {
  //   getSongsByGod(godId)
  //     .then(setSongs)
  //     .catch((e) => {
  //       console.warn(e);
  //       setSongs([]);
  //     });
  // }, [godId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSongs(DUMMY_SONGS_BY_GOD[godId] || DEFAULT_SONGS);
    }, 300);
    return () => clearTimeout(timer);
  }, [godId]);

  if (!songs) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.skyText} />
        </Pressable>
        <Text style={styles.headerTitle}>{godName}</Text>
        <Text style={styles.headerSubtitle}>{songs.length} songs</Text>
      </View>

      <FlatList
        data={songs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isActive = current?.id === item.id;
          return (
            <Pressable
              style={[styles.row, isActive && styles.rowActive]}
              onPress={() => play(item, songs)}
            >
              <View style={styles.cover}>
                {item.cover ? (
                  <Image source={{ uri: item.cover }} style={styles.coverImg} />
                ) : (
                  <Text style={styles.coverFallback}>🎵</Text>
                )}
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.title, isActive && { color: theme.accent }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
              </View>
              <Ionicons
                name={isActive && playing ? 'pause-circle' : 'play-circle'}
                size={30}
                color={isActive ? theme.accent : theme.textMuted}
              />
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </View>
  );
}

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
  backBtn: { marginBottom: spacing.sm },
  headerTitle: { color: theme.skyText, fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: theme.skyMuted, fontSize: 13, marginTop: 2 },
  list: { padding: spacing.base, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: radius.m,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rowActive: {
    backgroundColor: theme.accentTint,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: theme.sacredTint,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  coverImg: { width: '100%', height: '100%' },
  coverFallback: { fontSize: 18 },
  rowText: { flex: 1 },
  title: { color: theme.text, fontSize: 14, fontWeight: '600' },
  artist: { color: theme.textMuted, fontSize: 12, marginTop: 1 },
  divider: { height: spacing.xs },
});
