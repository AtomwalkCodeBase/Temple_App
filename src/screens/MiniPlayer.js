// MiniPlayer.js — persistent bar above the tab bar while a song is loaded.
// Mount once in RootNavigator, inside NavigationContainer, as a sibling to <Tabs />.
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, spacing, radius } from '../screens/theme';
import { usePlayer } from '../context/PlayerContext';

export default function MiniPlayer() {
  const { current, playing, toggle, next, close, progress } = usePlayer();

  if (!current) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(progress || 0) * 100}%` }]} />
      </View>

      <View style={styles.row}>
        <View style={styles.cover}>
          {current.cover ? (
            <Image source={{ uri: current.cover }} style={styles.coverImg} />
          ) : (
            <Text style={styles.coverFallback}>🎵</Text>
          )}
        </View>

        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{current.artist}</Text>
        </View>

        <Pressable onPress={toggle} style={styles.controlBtn}>
          <Ionicons name={playing ? 'pause' : 'play'} size={22} color={theme.accent} />
        </Pressable>
        <Pressable onPress={next} style={styles.controlBtn}>
          <Ionicons name="play-skip-forward" size={20} color={theme.textMuted} />
        </Pressable>
        <Pressable onPress={close} style={styles.controlBtn}>
          <Ionicons name="close" size={20} color={theme.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96, // sits just above the floating tab bar
    backgroundColor: theme.surface,
    borderRadius: radius.l,
    elevation: 6,
    shadowColor: theme.sky,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  progressTrack: {
    height: 3,
    backgroundColor: theme.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: theme.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  cover: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: theme.sacredTint,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  coverImg: { width: '100%', height: '100%' },
  coverFallback: { fontSize: 16 },
  text: { flex: 1 },
  title: { color: theme.text, fontSize: 13, fontWeight: '600' },
  artist: { color: theme.textMuted, fontSize: 11 },
  controlBtn: { padding: spacing.xs },
});
