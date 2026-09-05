// ProfileScreen.js
import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    Pressable,
    StyleSheet,
} from 'react-native';
import { theme, spacing, radius } from '../screens/theme';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigation } from '@react-navigation/native';
import { getMyProfile, AUTH_LOGOUT_URL } from '../services/api';
import { LANGUAGES } from './SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '../components/Screen';
import { useUser } from '../context/UserContext';

// Simple row for settings-style list items
function Row({ icon, label, value, onPress, danger }) {
    return (
        <Pressable style={styles.row} onPress={onPress}>
            <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>{icon}</Text>
                <Text style={[styles.rowLabel, danger && { color: theme.error }]}>
                    {label}
                </Text>
            </View>
            <View style={styles.rowRight}>
                {!!value && <Text style={styles.rowValue}>{value}</Text>}
                {!danger && <Text style={styles.chevron}>›</Text>}
            </View>
        </Pressable>
    );
}

export default function ProfileScreen({ stats = { events: 0, reminders: 0, streak: 0 }, onSignOut, }) {

    const navigation = useNavigation()
    const { profile, refreshProfile } = useUser();
    const [showSignOut, setShowSignOut] = useState(false);

    const handleSignOut = async () => {
        const token = await AsyncStorage.getItem('auth_token');

        try {
            await fetch(AUTH_LOGOUT_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
        } catch (e) {
            console.warn('Server-side logout failed:', e.message);
        }

        await AsyncStorage.removeItem('auth_token');
        onSignOut?.();
    };

    const languageLabel = LANGUAGES.find((l) => l.code === profile?.language)?.label || '—';
    const panjiLabel = profile ? `${profile.calendar_name} · ${profile.location_name}` : '—';

    const user = {
        name: profile?.name || 'Devotee',
        username: profile?.phone ? `+${profile.phone}` : '',
        avatar: profile?.avatar || null,
    };

    return (
        <Screen>
            {/* Night-sky header, echoes the hero section */}
            <View style={styles.hero}>
                <View style={styles.starRow}>
                    <Text style={styles.star}>✦</Text>
                    <Text style={styles.star}>✧</Text>
                    <Text style={styles.star}>✦</Text>
                </View>

                <View style={styles.avatarWrap}>
                    {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarInitial}>
                                {user.name?.charAt(0)?.toUpperCase() || 'D'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.moonBadge}>
                        <Text style={styles.moonBadgeText}>🪔</Text>
                    </View>
                </View>

                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.username}>{user.username}</Text>

                {/* <Pressable style={styles.editBtn} onPress={onEditProfile}>
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </Pressable> */}
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Devotional stats strip */}
                {/* <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.events}</Text>
                        <Text style={styles.statLabel}>Personal Events</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.reminders}</Text>
                        <Text style={styles.statLabel}>Reminders</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.sacred }]}>
                            {stats.streak}
                        </Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                </View> */}

                {/* Preferences */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    <Row icon="🌐" label="Language" value={languageLabel} onPress={() => navigation.navigate('Settings')} />
                    <View style={styles.divider} />
                    <Row
                        icon="📍"
                        label="Panji / Location"
                        value={panjiLabel}
                        onPress={() => navigation.navigate('Settings')}
                    />
                </View>

                {/* Discover */}
                {/* <Text style={styles.sectionTitle}>Discover</Text>
                <View style={styles.card}>
                    <Row icon="🔍" label="Explore Communities & Songs" onPress={() => navigation.navigate('Explore')} />
                </View> */}

                {/* My devotional activity */}
                {/* <Text style={styles.sectionTitle}>My Activity</Text>
                <View style={styles.card}>
                    <Row icon="🗓️" label="Personal Events" onPress={() => navigation.navigate('MyEventsScreen')} /> */}
                {/* <View style={styles.divider} />
                    <Row icon="🔔" label="Reminders" onPress={onReminders} />
                    <View style={styles.divider} />
                    <Row icon="🔕" label="Notification Settings" onPress={onNotifications} />
                    <View style={styles.divider} /> */}
                {/* </View> */}

                {/* Sign out */}
                <View style={styles.card}>
                    <Row
                        icon="🚪"
                        label="Sign Out"
                        danger
                        onPress={() => setShowSignOut(true)}
                    />
                </View>

                <Text style={styles.footerNote}>Agam Mandira · Your daily devotional companion</Text>
            </ScrollView>

            <ConfirmModal
                visible={showSignOut}
                type="normal"
                title="Sign out?"
                message="Are you sure you want to sign out?"
                confirmLabel="Sign out"
                cancelLabel="Cancel"
                onConfirm={() => {
                    setShowSignOut(false);
                    handleSignOut();
                }}
                onCancel={() => setShowSignOut(false)}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.surfaceAlt,
    },

    // Hero
    hero: {
        backgroundColor: theme.sky,
        paddingTop: spacing.xxl,
        paddingBottom: spacing.xl,
        alignItems: 'center',
        borderBottomLeftRadius: radius.l,
        borderBottomRightRadius: radius.l,
    },
    starRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing.sm,
    },
    star: {
        color: theme.star,
        fontSize: 12,
    },
    avatarWrap: {
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: radius.pill,
        borderWidth: 2,
        borderColor: theme.moon,
    },
    avatarFallback: {
        backgroundColor: theme.skyLine,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: theme.moon,
        fontSize: 32,
        fontWeight: '700',
    },
    moonBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: radius.pill,
        backgroundColor: theme.moon,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.sky,
    },
    moonBadgeText: {
        fontSize: 13,
    },
    name: {
        color: theme.skyText,
        fontSize: 20,
        fontWeight: '700',
    },
    username: {
        color: theme.skyMuted,
        fontSize: 13,
        marginTop: 2,
        marginBottom: spacing.base,
    },
    editBtn: {
        borderWidth: 1,
        borderColor: theme.skyChipBorder,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.base,
        borderRadius: radius.pill,
    },
    editBtnText: {
        color: theme.skyText,
        fontSize: 13,
        fontWeight: '600',
    },

    // Body
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: spacing.base,
        paddingBottom: spacing.xxl,
    },

    // Stats
    statsCard: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderRadius: radius.l,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing.base,
        marginTop: -spacing.xl,
        marginBottom: spacing.lg,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: theme.border,
        marginVertical: spacing.xs,
    },
    statValue: {
        color: theme.accent,
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        color: theme.textMuted,
        fontSize: 11,
        marginTop: 2,
        textAlign: 'center',
    },

    // Sections
    sectionTitle: {
        color: theme.textMuted,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    card: {
        backgroundColor: theme.surface,
        borderRadius: radius.l,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        backgroundColor: theme.border,
        marginLeft: spacing.base + 24 + spacing.sm, // align past icon
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.base,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    rowIcon: {
        fontSize: 18,
        width: 24,
        textAlign: 'center',
    },
    rowLabel: {
        color: theme.text,
        fontSize: 15,
        fontWeight: '500',
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    rowValue: {
        color: theme.textMuted,
        fontSize: 13,
    },
    chevron: {
        color: theme.textMuted,
        fontSize: 18,
    },

    footerNote: {
        textAlign: 'center',
        color: theme.textMuted,
        fontSize: 11,
        marginTop: spacing.sm,
    },
});