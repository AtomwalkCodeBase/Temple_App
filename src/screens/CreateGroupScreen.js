// CreateGroupScreen.js — two steps: details, then add members from contacts.
// route.params.type is 'community' | 'group'
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, Image, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { theme, spacing, radius } from './theme';
import { createGroup, createCommunity, matchContactsToUsers } from '../services/api';
// matchContactsToUsers(phoneNumbers) -> [{ phone, user_id, name, avatar }] for numbers on the app

export default function CreateGroupScreen({ route, navigation }) {
  const { type } = route.params; // 'community' | 'group'
  const isCommunity = type === 'community';

  const [step, setStep] = useState('details'); // 'details' | 'members'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [contacts, setContacts] = useState(null);
  const [matched, setMatched] = useState([]); // app users resolved from contacts
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (step !== 'members' || contacts !== null) return;
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setContacts([]);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
      });
      const withPhones = data.filter((c) => c.phoneNumbers?.length);
      setContacts(withPhones);

      const numbers = withPhones.map((c) => c.phoneNumbers[0].number.replace(/\D/g, ''));
      try {
        const users = await matchContactsToUsers(numbers);
        setMatched(users);
      } catch (e) {
        console.warn(e);
        setMatched([]);
      }
    })();
  }, [step]);

  const filtered = useMemo(() => {
    if (!search) return matched;
    const q = search.toLowerCase();
    return matched.filter((u) => u.name?.toLowerCase().includes(q));
  }, [matched, search]);

  const toggleSelect = (userId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', `Please enter a ${type} name.`);
      return;
    }
    setCreating(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        is_private: isPrivate,
        member_ids: Array.from(selected),
      };
      const created = isCommunity ? await createCommunity(payload) : await createGroup(payload);
      navigation.replace(isCommunity ? 'CommunityDetail' : 'GroupDetail', { id: created.id });
    } catch (e) {
      Alert.alert('Could not create', e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (step === 'members' ? setStep('details') : navigation.goBack())}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={theme.skyText} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {step === 'details'
            ? `New ${isCommunity ? 'Community' : 'Group'}`
            : `Add Members${selected.size ? ` (${selected.size})` : ''}`}
        </Text>
      </View>

      {step === 'details' ? (
        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder={isCommunity ? 'e.g. Bhubaneswar Devotees' : 'e.g. Family Puja Group'}
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is this about?"
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Pressable style={styles.privacyRow} onPress={() => setIsPrivate((p) => !p)}>
            <View>
              <Text style={styles.label}>Private {isCommunity ? 'community' : 'group'}</Text>
              <Text style={styles.privacyNote}>
                {isPrivate ? 'Only invited members can join' : 'Anyone can find and join'}
              </Text>
            </View>
            <View style={[styles.toggle, isPrivate && styles.toggleOn]}>
              <View style={[styles.toggleKnob, isPrivate && styles.toggleKnobOn]} />
            </View>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, !name.trim() && styles.primaryBtnDisabled]}
            disabled={!name.trim()}
            onPress={() => setStep('members')}
          >
            <Text style={styles.primaryBtnText}>Next: Add Members</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts"
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {contacts === null ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
          ) : matched.length === 0 ? (
            <Text style={styles.emptyNote}>
              None of your contacts are on Agam Mandira yet. You can still create the{' '}
              {type} and invite people later.
            </Text>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.user_id)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const isSelected = selected.has(item.user_id);
                return (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => toggleSelect(item.user_id)}
                  >
                    <View style={styles.avatar}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarFallback}>
                          {item.name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? theme.accent : theme.border}
                    />
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
            />
          )}

          <Pressable
            style={[styles.primaryBtn, styles.stickyBtn, creating && styles.primaryBtnDisabled]}
            disabled={creating}
            onPress={handleCreate}
          >
            {creating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                Create {isCommunity ? 'Community' : 'Group'}
                {selected.size ? ` · ${selected.size} invited` : ''}
              </Text>
            )}
          </Pressable>
        </>
      )}
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
  backBtn: { marginBottom: spacing.sm },
  headerTitle: { color: theme.skyText, fontSize: 18, fontWeight: '700' },

  form: { padding: spacing.base },
  label: { color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  input: {
    backgroundColor: theme.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: theme.text,
    fontSize: 14,
    marginBottom: spacing.base,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.sm,
    marginBottom: spacing.xl,
  },
  privacyNote: { color: theme.textMuted, fontSize: 12, marginTop: 2, maxWidth: 220 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: theme.border,
    padding: 3,
  },
  toggleOn: { backgroundColor: theme.accent },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobOn: { marginLeft: 18 },

  primaryBtn: {
    backgroundColor: theme.accent,
    borderRadius: radius.m,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stickyBtn: { margin: spacing.base },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: theme.border,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, color: theme.text, fontSize: 14 },

  list: { padding: spacing.base, paddingBottom: spacing.xl },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: theme.accentTint,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { color: theme.accent, fontSize: 14, fontWeight: '700' },
  contactName: { flex: 1, color: theme.text, fontSize: 14, fontWeight: '500' },
  divider: { height: spacing.xs },

  emptyNote: {
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 13,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
});
