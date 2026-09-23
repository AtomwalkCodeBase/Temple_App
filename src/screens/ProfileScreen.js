// ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Share } from 'react-native';
import { theme, spacing, radius } from '../theme/theme';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigation } from '@react-navigation/native';
import { LANGUAGES } from './SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '../components/Screen';
import { useUser } from '../context/UserContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import ResettableScrollView from '../components/ResettableScrollView';
import Constants from 'expo-constants';


const APP_SHARE_URL = ' https://play.google.com/store/apps/details?id=com.agam.app'; // TODO: replace with real link/deep link
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';


// Simple row for settings-style list items
function Row({ icon, label, value, onPress, danger, highlight }) {
    return (
        <Pressable style={styles.row} onPress={onPress}>
            <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, highlight && styles.iconWrapHighlight]}>
                    <Text style={styles.rowIcon}>{icon}</Text>
                </View>
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


export default function ProfileScreen({ onSignOut }) {


    const navigation = useNavigation();
    const { profile } = useUser();
    const [showSignOut, setShowSignOut] = useState(false);


    const handleSignOut = async () => {
        await AsyncStorage.removeItem('auth_token');
        onSignOut?.();
    };


    const handleInvite = async () => {
        try {
            await Share.share({
                message: `I've been using Agam Mandira for daily panchang, tithis & festival reminders — thought you'd like it too. Download here: ${APP_SHARE_URL}`,
                url: APP_SHARE_URL, // used on iOS
                title: 'Try Agam Mandira',
            });
        } catch (e) {
            console.warn(e);
        }
    };


    const languageLabel = LANGUAGES.find((l) => l.code === profile?.language)?.label || '—';
    const panjiLabel = profile ? `${profile.calendar_name} · ${profile.location_name}` : '—';


    const user = {
        name: profile?.first_name || 'Devotee',
        username: profile?.phone ? `${profile.phone}` : '',
        avatar: profile?.avatar || null,
    };


    return (
        <Screen>
            <View style={styles.hero}>
                <View style={styles.heroShapeOne} />
                <View style={styles.heroShapeTwo} />
                <View style={styles.heroDotGrid}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <View key={i} style={[styles.heroDot, { opacity: 0.15 + i * 0.08 }]} />
                    ))}
                </View>


                {/* <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')} hitSlop={10}>
                    <Ionicons name="settings-outline" size={18} color={theme.skyMuted} />
                </Pressable> */}


                <View style={styles.avatarRing}>
                    <View style={styles.avatarRingInner}>
                        {user.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarFallback]}>
                                <Text style={styles.avatarInitial}>
                                    {user.name?.charAt(0)?.toUpperCase() || 'D'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>


                <Text style={styles.name}>{user.name}</Text>


                {!!user.username && (
                    <View style={styles.phoneChip}>
                        <Ionicons name="call-outline" size={12} color={theme.skyText} />
                        <Text style={styles.phoneChipText}>{user.username}</Text>
                    </View>
                )}
            </View>


            <ResettableScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Invite card — the star of the redesign */}
                <Pressable style={styles.inviteCard} onPress={handleInvite}>
                    <View style={styles.inviteIconWrap}>
                        <Text style={styles.inviteIcon}>🎁</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inviteTitle}>Invite Friends & Family</Text>
                        <Text style={styles.inviteSub}>
                            Share tithis, festivals & reminders with people you care about
                        </Text>
                    </View>
                    <View style={styles.inviteArrow}>
                        <Text style={styles.inviteArrowText}>
                            <Ionicons name="arrow-forward-sharp" size={16} color="white" />
                        </Text>
                    </View>
                </Pressable>


                {/* Preferences */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    <Row icon="🌐" label="Language" value={languageLabel} onPress={() => navigation.navigate('Settings', { section: 'language' })} />
                    <View style={styles.divider} />


                    <Row icon="📍" label="Panji / Location  " value={panjiLabel} onPress={() => navigation.navigate('Settings', { section: 'panji' })} />
                    <View style={styles.divider} />


                    {/* <Row icon="🎨" label="Theme" value={themes[activeThemeId]?.label || 'Default'} onPress={() => setThemeModalVisible(true)} />
                    <View style={styles.divider} /> */}


                    {/* <Row icon="🔔" label="Explore" onPress={() => navigation.navigate('Explore')} /> */}
                </View>


                {/* Support / About */}
                {/* <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.card}>
                    <Row icon="💬" label="Send Feedback" onPress={handleInvite && (() => { })} />
                    <View style={styles.divider} />
                    <Row icon="⭐" label="Rate the App" onPress={() => { }} />
                    <View style={styles.divider} />
                    <Row icon="ℹ️" label="About" value={`v${APP_VERSION}`} onPress={() => { }} />
                </View> */}


                {/* Sign out */}
                <View style={styles.card}>
                    <Row icon="🚪" label="Sign Out" danger onPress={() => setShowSignOut(true)} />
                </View>


                <Text style={styles.footerNote}>Agam Mandira · Your daily devotional companion</Text>
            </ResettableScrollView>


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
    username: {
        color: theme.skyMuted,
        fontSize: 13,
        marginTop: 2,
        marginBottom: spacing.base,
    },
    heroGlow: {
        position: 'absolute',
        top: -60,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: theme.skyLine,
        opacity: 0.25,
    },
    heroTop: {
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    starRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.md,
    },
    star: {
        color: theme.star,
        fontSize: 12,
    },
    avatarWrap: {
        marginBottom: spacing.md,
    },
    avatar: {
        width: 92,
        height: 92,
        borderRadius: radius.pill,
        borderWidth: 3,
        borderColor: theme.moon,
    },
    avatarFallback: {
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: theme.moon,
        fontSize: 34,
        fontWeight: '700',
    },
    moonBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 30,
        height: 30,
        borderRadius: radius.pill,
        backgroundColor: theme.moon,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.sky,
    },
    moonBadgeText: {
        fontSize: 14,
    },
    name: {
        color: theme.textOnPrimary,
        fontSize: 21,
        fontWeight: '700',
    },
    phoneChip: {
        marginTop: spacing.xs,
        borderWidth: 1,
        borderColor: theme.textMuted,
        backgroundColor: theme.sky,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 3,
        borderRadius: radius.pill,
    },
    phoneChipText: {
        color: theme.skyMuted,
        fontSize: 12,
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


    // Invite card
    inviteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: theme.sacredTint,
        borderRadius: radius.l,
        borderWidth: 1,
        borderColor: theme.sacred + '55',
        padding: spacing.base,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    inviteIconWrap: {
        width: 44,
        height: 44,
        borderRadius: radius.pill,
        backgroundColor: theme.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteIcon: { fontSize: 20 },
    inviteTitle: {
        color: theme.sacredText,
        fontSize: 15,
        fontWeight: '700',
    },
    inviteSub: {
        color: theme.sacredMuted,
        fontSize: 12,
        marginTop: 2,
        lineHeight: 16,
    },
    inviteArrow: {
        width: 30,
        height: 30,
        borderRadius: radius.pill,
        backgroundColor: theme.sacred,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteArrowText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
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
        marginLeft: spacing.base + 32 + spacing.sm, // align past icon wrap
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.base,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: radius.md,
        backgroundColor: theme.accentTint,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapHighlight: {
        backgroundColor: theme.sacredTint,
    },
    rowIcon: {
        fontSize: 15,
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


    hero: {
        backgroundColor: theme.primary,
        paddingTop: spacing.xxl + spacing.sm,
        paddingBottom: spacing.xxl,
        alignItems: 'center',
        // borderBottomLeftRadius: radius.l * 2,
        // borderBottomRightRadius: radius.l * 2,
        overflow: 'hidden',
    },
    heroShapeOne: {
        position: 'absolute',
        top: -90,
        right: -60,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: theme.primaryDark,
        opacity: 0.35,
    },
    heroShapeTwo: {
        position: 'absolute',
        bottom: -70,
        left: -50,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: theme.primaryDark,
        opacity: 0.4,
    },
    heroDotGrid: {
        position: 'absolute',
        top: spacing.xl,
        left: spacing.lg,
        flexDirection: 'row',
        gap: 6,
    },
    heroDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.star,
    },
    settingsBtn: {
        position: 'absolute',
        top: spacing.xl,
        right: spacing.lg,
        width: 34,
        height: 34,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarRing: {
        width: 106,
        height: 106,
        borderRadius: radius.pill,
        borderWidth: 2,
        borderColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarRingInner: {
        width: 94,
        height: 94,
        borderRadius: radius.pill,
        padding: 3,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moonBadge: {
        position: 'absolute',
        bottom: 4,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: radius.pill,
        backgroundColor: theme.moon,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.accentDeep,
    },
    phoneChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 5,
        borderRadius: radius.pill,
    },
    phoneChipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(4,44,83,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    themeModalCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.surface,
        borderRadius: radius.l,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    themeModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    themeList: {
        marginBottom: spacing.md,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    themeOptionActive: {
        backgroundColor: theme.surfaceAlt,
        borderRadius: radius.sm,
        borderBottomWidth: 0,
    },
    themeColorPreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: theme.border,
    },
    themeOptionText: {
        fontSize: 15,
        color: theme.text,
    },
    themeOptionTextActive: {
        fontWeight: '700',
        color: theme.accent,
    },
    themeModalClose: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        backgroundColor: theme.surfaceAlt,
        borderRadius: radius.m,
        marginTop: spacing.sm,
    },
    themeModalCloseText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
    },
});

