import React, { useEffect, useRef } from 'react';
import {
    View, Text, Pressable, ScrollView, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import dayjs from 'dayjs';
import { theme, radius, spacing, fontSize } from '../theme/theme';
import SlideDrawer from './SlideDrawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.82);

export default function MonthAgendaDrawer({
    visible, monthLabel, festivals, personalEvents, onClose, onSelectDate,
}) {
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef(null);
    const todayYRef = useRef(null);

    useEffect(() => {
        Animated.timing(overlayAnim, {
            toValue: visible ? 1 : 0,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    useEffect(() => {
        // Jump to the first today/upcoming row once the drawer opens and layout is known
        if (visible && todayYRef.current != null) {
            const y = todayYRef.current;
            requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: false });
            });
        }
    }, [visible, festivals, personalEvents]);

    const today = dayjs().format('YYYY-MM-DD');
    let firstRelevantCaptured = false;

    const captureFirstRelevantY = (date, y) => {
        if (!firstRelevantCaptured && date >= today) {
            todayYRef.current = y;
            firstRelevantCaptured = true;
        }
    };

    return (
        <>
            {visible && (
                <Animated.View style={[styles.backdrop, { opacity: overlayAnim }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>
            )}

            <SlideDrawer visible={visible} onClose={onClose} from="right">
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{monthLabel}</Text>
                    <Pressable onPress={onClose} hitSlop={10}>
                        <Ionicons name="close" size={22} color={theme.text} />
                    </Pressable>
                </View>

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.sectionTitle}>Festivals</Text>
                    {festivals.length === 0 ? (
                        <Text style={styles.emptyNote}>No festivals this month.</Text>
                    ) : (
                        festivals.map((ev) => {
                            const isToday = ev.date === today;
                            const isPast = dayjs(ev.date).isBefore(dayjs(), 'day');
                            return (
                                <View
                                    key={`fest-${ev.id}`}
                                    onLayout={(e) => captureFirstRelevantY(ev.date, e.nativeEvent.layout.y)}
                                >
                                    <Pressable
                                        style={[
                                            styles.row, styles.rowFestival,
                                            isPast && styles.rowMuted, isToday && styles.rowToday,
                                        ]}
                                        onPress={() => { onSelectDate(ev.date); onClose(); }}
                                        disabled={isPast}
                                    >
                                        {isToday ? (
                                            <View style={styles.todayPill}><Text style={styles.todayPillText}>TODAY</Text></View>
                                        ) : (
                                            <Text style={styles.rowDate}>{dayjs(ev.date).format('D MMM')}</Text>
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.rowTitle, isPast && styles.textMuted]}>{ev.title}</Text>
                                            <Text style={[styles.rowSub, isPast && styles.textMuted]}>{ev.subtitle}</Text>
                                        </View>
                                    </Pressable>
                                </View>
                            );
                        })
                    )}

                    <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Personal Events</Text>
                    {personalEvents.length === 0 ? (
                        <Text style={styles.emptyNote}>No personal events this month.</Text>
                    ) : (
                        personalEvents.map((ev) => {
                            const isToday = ev.date === today;
                            const isPast = dayjs(ev.date).isBefore(dayjs(), 'day');
                            return (
                                <View
                                    key={`evt-${ev.id}`}
                                    onLayout={(e) => captureFirstRelevantY(ev.date, e.nativeEvent.layout.y)}
                                >
                                    <Pressable
                                        style={[
                                            styles.row, styles.rowPersonal,
                                            isPast && styles.rowMuted, isToday && styles.rowToday,
                                        ]}
                                        onPress={() => { onSelectDate(ev.date); onClose(); }}
                                    >
                                        {isToday ? (
                                            <View style={styles.todayPill}><Text style={styles.todayPillText}>TODAY</Text></View>
                                        ) : (
                                            <Text style={styles.rowDate}>{dayjs(ev.date).format('D MMM')}</Text>
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.rowTitle, isPast && styles.textMuted]}>{ev.title}</Text>
                                            <Text style={[styles.rowSub, isPast && styles.textMuted]}>{ev.subtitle}</Text>
                                        </View>
                                    </Pressable>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </SlideDrawer>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(4,44,83,0.4)',
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.base, paddingTop: spacing.xxl, paddingBottom: spacing.base,
        borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: theme.text },
    content: { padding: spacing.base, paddingBottom: spacing.xxl },
    sectionTitle: { fontSize: fontSize.sm, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.xs },
    emptyNote: { fontSize: fontSize.base, color: theme.textMuted, marginBottom: spacing.sm },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        borderLeftWidth: 3, borderRadius: radius.sm,
        paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.xs,
    },
    rowFestival: { borderLeftColor: theme.sacred, backgroundColor: theme.sacredTint + '40' },
    rowPersonal: { borderLeftColor: theme.accent, backgroundColor: theme.accentTint + '40' },
    rowToday: { borderLeftWidth: 4, backgroundColor: theme.accentTint + '70' },
    rowDate: { fontSize: fontSize.sm, fontWeight: '700', color: theme.accent, minWidth: 42 },
    todayPill: {
        minWidth: 42, paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: radius.pill, backgroundColor: theme.accent, alignItems: 'center',
    },
    todayPillText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
    rowTitle: { fontSize: fontSize.base, fontWeight: '600', color: theme.text },
    rowSub: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 1 },
    rowMuted: { opacity: 0.55 },
    textMuted: { color: theme.textMuted },
});