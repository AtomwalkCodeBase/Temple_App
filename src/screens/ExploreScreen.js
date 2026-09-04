// ExploreScreen.js — devotees discover/create Communities and Groups
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme, spacing, radius } from './theme';
import { getCommunities, getGroups } from '../services/api';
import GodsScreen from './GodsScreen';
// expected shapes:
// community: { id, name, description, cover, members_count, joined }
// group:     { id, name, description, cover, members_count, is_private, joined }

const DUMMY_COMMUNITIES = [
  { id: 1, name: 'Bhubaneswar Devotees', description: 'Local satsang & temple updates', cover: null, members_count: 342, is_private: false, joined: true },
  { id: 2, name: 'Jagannath Bhakti Circle', description: 'Daily aarti timings & prasad sharing', cover: null, members_count: 1204, is_private: false, joined: false },
  { id: 3, name: 'Shiva Sadhana', description: 'Weekly Rudrabhishek discussions', cover: null, members_count: 587, is_private: true, joined: false },
];

const DUMMY_GROUPS = [
  { id: 101, name: 'Family Puja Group', description: 'Planning our monthly family puja', cover: null, members_count: 8, is_private: true, joined: true },
  { id: 102, name: 'Office Ganesh Chaturthi', description: 'Coordinating pandal at work', cover: null, members_count: 22, is_private: false, joined: true },
  { id: 103, name: 'Neighbourhood Bhajan Mandali', description: 'Sunday evening bhajans', cover: null, members_count: 15, is_private: false, joined: false },
];

const TABS = [
  { key: 'songs', label: 'Songs' },
  { key: 'communities', label: 'Communities' },
  { key: 'groups', label: 'Groups' },
];

export default function ExploreScreen({ navigation }) {
  const [tab, setTab] = useState('communities');
  const [communities, setCommunities] = useState(null);
  const [groups, setGroups] = useState(null);

  // const load = useCallback(() => {
  //   getCommunities().then(setCommunities).catch(() => setCommunities([]));
  //   getGroups().then(setGroups).catch(() => setGroups([]));
  // }, []);

  const load = useCallback(() => {
    setTimeout(() => setCommunities(DUMMY_COMMUNITIES), 300);
    setTimeout(() => setGroups(DUMMY_GROUPS), 300);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  let data = null;
  if (tab === 'communities') data = communities;
  else if (tab === 'groups') data = groups;

  const loading = data === null && tab !== 'songs';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Find and create communities &amp; groups</Text>

        <View style={styles.segment}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.segmentItem, tab === t.key && styles.segmentItemActive]}
              onPress={() => setTab(t.key)}
            >
              <Text
                style={[styles.segmentLabel, tab === t.key && styles.segmentLabelActive]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'songs' ? (
        <GodsScreen navigation={navigation} hideHeader />
      ) : loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyNote}>
              No {tab} yet. Tap + to create the first one.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate(
                  tab === 'communities' ? 'CommunityDetail' : 'GroupDetail',
                  { id: item.id }
                )
              }
            >
              <View style={styles.cardCover}>
                {item.cover ? (
                  <Image source={{ uri: item.cover }} style={styles.cardCoverImg} />
                ) : (
                  <Text style={styles.cardCoverFallback}>
                    {tab === 'communities' ? '🛕' : '👥'}
                  </Text>
                )}
              </View>
              <View style={styles.cardText}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  {item.is_private && (
                    <Ionicons name="lock-closed" size={12} color={theme.textMuted} />
                  )}
                </View>
                <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.cardMeta}>{item.members_count} members</Text>
              </View>
              {item.joined ? (
                <View style={styles.joinedPill}>
                  <Text style={styles.joinedPillText}>Joined</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              )}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() =>
          navigation.navigate('CreateGroup', {
            type: tab === 'communities' ? 'community' : 'group',
          })
        }
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surfaceAlt },
  header: {
    backgroundColor: theme.sky,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
    borderBottomLeftRadius: radius.l,
    borderBottomRightRadius: radius.l,
  },
  headerTitle: { color: theme.skyText, fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: theme.skyMuted, fontSize: 13, marginTop: 2, marginBottom: spacing.base },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.skyChipBorder,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: theme.moon,
  },
  segmentLabel: { color: theme.skyMuted, fontSize: 13, fontWeight: '600' },
  segmentLabelActive: { color: theme.sky },

  list: { padding: spacing.base, paddingBottom: 110 },
  emptyNote: { textAlign: 'center', color: theme.textMuted, fontSize: 13, marginTop: spacing.xxl },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cardCover: {
    width: 48,
    height: 48,
    borderRadius: radius.m,
    backgroundColor: theme.sacredTint,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardCoverImg: { width: '100%', height: '100%' },
  cardCoverFallback: { fontSize: 20 },
  cardText: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTitle: { color: theme.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  cardDesc: { color: theme.textMuted, fontSize: 12, marginTop: 1 },
  cardMeta: { color: theme.accent, fontSize: 11, marginTop: 3, fontWeight: '600' },
  joinedPill: {
    backgroundColor: theme.accentTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  joinedPillText: { color: theme.accent, fontSize: 11, fontWeight: '600' },

  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: theme.accentDeep,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
