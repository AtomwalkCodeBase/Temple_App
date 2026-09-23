// FestivalsScreen.js — lists all FESTIVAL-type events across the next 12 months.
// User can search by name and toggle "add to my calendar" per festival.
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, FlatList, Pressable, Image, TextInput, StyleSheet, ActivityIndicator,
    ScrollView,
} from 'react-native';
import dayjs from 'dayjs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { theme, spacing, radius, fontSize } from '../../theme/theme';
import Screen from '../../components/Screen';
import {
    getMonthsEvents, trackReligiousEvent, untrackReligiousEvent,
} from '../../services/api';
import { scheduleEventReminders, cancelEventReminders } from '../../services/notifications';
import StatusModal from '../../components/StatusModal';
import { REMINDER_OPTIONS } from '../../constants/constant';
import Header from '../../components/Header';
import { extractErrorMessage } from '../../utils/date';

export default function FestivalsScreen({ navigation }) {
    const listRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [festivals, setFestivals] = useState([]);
    const [search, setSearch] = useState('');
    const [trackingIds, setTrackingIds] = useState({});
    const [expandedCode, setExpandedCode] = useState(null);
    const [reminderSelections, setReminderSelections] = useState({});
    const [monthFilter, setMonthFilter] = useState(null);
    const [statusModal, setStatusModal] = useState({ visible: false, type: 'error', title: '', message: '' });

    const showStatus = (type, title, message) => setStatusModal({ visible: true, type, title, message });
    const hideStatus = () => setStatusModal((prev) => ({ ...prev, visible: false }));

    const monthOptions = useMemo(() => {
        const currentYear = dayjs().year();
        return Array.from({ length: 12 }, (_, m) =>
            dayjs(`${currentYear}-01-01`).month(m).format('YYYY-MM')
        );
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const currentYear = dayjs().year();
            const merged = [];
            for (let m = 0; m < 12; m++) {
                const cursor = dayjs(`${currentYear}-01-01`).month(m);
                const res = await getMonthsEvents(cursor.format('MM-YYYY'));
                merged.push(...(res?.events ?? []));
            }

            // const onlyFestivals = merged.filter((ev) => ev.event_type === 'FESTIVAL');
            const onlyFestivals = merged.filter((ev) => ev.kind === 'religious');

            const byId = new Map(onlyFestivals.map((ev) => [ev.id, ev]));
            const deduped = Array.from(byId.values()).sort((a, b) =>
                dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
            );

            setFestivals(deduped);
        } catch (e) {
            showError('Could not load festivals', extractErrorMessage(e));
            setFestivals([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (loading || sections.length === 0) return;
        if (monthFilter) return; // only auto-scroll in the "All" grouped view

        const currentLabel = dayjs().format('MMMM YYYY');
        const index = sections.findIndex((s) => s.title === currentLabel);
        if (index > 0) {
            // slight delay lets the list finish its initial layout first
            setTimeout(() => {
                listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
            }, 50);
        }
    }, [loading, sections, monthFilter]);

    const openReminderPicker = (item) => {
        setReminderSelections((prev) => ({ ...prev, [item.code]: prev[item.code] ?? [1440] }));
        setExpandedCode(item.code);
    };

    const toggleReminderOption = (code, minutes) => {
        setReminderSelections((prev) => {
            const current = prev[code] ?? [1440];
            const next = current.includes(minutes)
                ? current.filter((m) => m !== minutes)
                : [...current, minutes];
            return { ...prev, [code]: next };
        });
    };

    const confirmAddToCalendar = async (item) => {
        const minutes = reminderSelections[item.code] ?? [1440];
        if (minutes.length === 0) {
            showStatus('error', 'Pick a reminder', 'Select at least one reminder option.');
            return;
        }
        if (trackingIds[item.code]) return;

        setTrackingIds((prev) => ({ ...prev, [item.code]: true }));
        try {
            const created = await trackReligiousEvent(item.code, { reminder_minutes: minutes });
            await scheduleEventReminders(
                { id: created.id, title: created.title, event_date: created.event_date, start_time: created.start_time },
                minutes
            );
            setFestivals((prev) =>
                prev.map((f) => (f.code === item.code ? { ...f, is_tracked: true, user_event_id: created.id } : f))
            );
            setExpandedCode(null);
            showStatus('success', 'Added', `${item.title} added to your calendar.`);
            setTimeout(() => {
                navigation.navigate('MyEventsScreen', { presetFilter: 'FESTIVAL' });
            }, 3000);
        } catch (e) {
            showStatus('error', 'Something went wrong', extractErrorMessage(e));
        } finally {
            setTrackingIds((prev) => {
                const next = { ...prev };
                delete next[item.code];
                return next;
            });
        }
    };

    const removeFromCalendar = async (item) => {
        if (trackingIds[item.code]) return;
        setTrackingIds((prev) => ({ ...prev, [item.code]: true }));
        setFestivals((prev) => prev.map((f) => (f.code === item.code ? { ...f, is_tracked: false } : f)));

        try {
            if (item.user_event_id) await cancelEventReminders(item.user_event_id);
            await untrackReligiousEvent(item.code);
        } catch (e) {
            setFestivals((prev) => prev.map((f) => (f.code === item.code ? { ...f, is_tracked: true } : f)));
            showStatus('error', 'Something went wrong', extractErrorMessage(e));
        } finally {
            setTrackingIds((prev) => {
                const next = { ...prev };
                delete next[item.code];
                return next;
            });
        }
    };

    const filtered = useMemo(() => {
        let list = festivals;

        if (monthFilter) {
            list = list.filter((f) => dayjs(f.date).format('YYYY-MM') === monthFilter);
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((f) => f.title?.toLowerCase().includes(q));
        }

        return list;
    }, [festivals, search, monthFilter]);

    const sections = useMemo(() => {
        if (monthFilter) return [{ title: dayjs(monthFilter).format('MMMM YYYY'), data: filtered }];

        const byMonth = new Map();
        filtered.forEach((f) => {
            const key = dayjs(f.date).format('YYYY-MM');
            if (!byMonth.has(key)) byMonth.set(key, []);
            byMonth.get(key).push(f);
        });

        return Array.from(byMonth.entries())
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([key, data]) => ({ title: dayjs(key).format('MMMM YYYY'), data }));
    }, [filtered, monthFilter]);


    const handleToggleTrack = async (item) => {
        const code = item.code;
        if (trackingIds[code]) return;

        const wasTracked = !!item.is_tracked;

        // optimistic update
        setFestivals((prev) => prev.map((f) => (f.code === code ? { ...f, is_tracked: !wasTracked } : f)));
        setTrackingIds((prev) => ({ ...prev, [code]: true }));

        try {
            if (wasTracked) {
                if (item.user_event_id) await cancelEventReminders(item.user_event_id);
                await untrackReligiousEvent(code);
            } else {
                const created = await trackReligiousEvent(code, { reminder_minutes: [] });
                await scheduleEventReminders(
                    { id: created.id, title: created.title, event_date: created.event_date, start_time: created.start_time },
                    []
                );
                setFestivals((prev) =>
                    prev.map((f) => (f.code === code ? { ...f, user_event_id: created.id } : f))
                );
            }
        } catch (e) {
            setFestivals((prev) => prev.map((f) => (f.code === code ? { ...f, is_tracked: wasTracked } : f)));
            showError('Something went wrong', extractErrorMessage(e));
        } finally {
            setTrackingIds((prev) => {
                const next = { ...prev };
                delete next[code];
                return next;
            });
        }
    };

    return (
        <Screen edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Header title="Festivals" onBack={() => navigation.goBack()} />
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={16} color={theme.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search festival..."
                        placeholderTextColor={theme.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                        </Pressable>
                    )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthChipRow}>
                    <Pressable
                        style={[styles.monthChip, !monthFilter && styles.monthChipActive]}
                        onPress={() => setMonthFilter(null)}
                    >
                        <Text style={[styles.monthChipText, !monthFilter && styles.monthChipTextActive]}>All</Text>
                    </Pressable>
                    {monthOptions.map((m) => {
                        const active = monthFilter === m;
                        return (
                            <Pressable
                                key={m}
                                style={[styles.monthChip, active && styles.monthChipActive]}
                                onPress={() => setMonthFilter(m)}
                            >
                                <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                                    {dayjs(m).format('MMM YYYY')}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    ref={listRef}
                    data={sections}
                    keyExtractor={(s, index) => `${s.title}-${index}`}
                    contentContainerStyle={styles.list}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            listRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 });
                        }, 100);
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Ionicons name="sparkles-outline" size={28} color={theme.textMuted} />
                            <Text style={styles.emptyText}>
                                {search || monthFilter ? 'No festivals match your filters' : 'No festivals found'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item: section }) => (
                        <View>
                            <Text style={styles.monthLabel}>{section.title}</Text>
                            {section.data.map((item) => {
                                const busy = !!trackingIds[item.code];
                                const expanded = expandedCode === item.code;
                                const selected = reminderSelections[item.code] ?? [1440];

                                return (
                                    <View key={item.id} style={[styles.card, { marginBottom: spacing.sm }, expanded && styles.cardExpanded]}>
                                        <Pressable
                                            style={styles.cardRow}
                                            onPress={() => navigation.navigate('EventDetail', { code: item.code, date: item.date })}
                                        >
                                            <View style={styles.cardImageWrap}>
                                                {item.image ? (
                                                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                                                ) : (
                                                    <View style={styles.cardImageFallback}>
                                                        <Ionicons name="sparkles" size={22} color={theme.primary} />
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.cardText}>
                                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                                {!!item.subtitle && <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>}
                                                <Text style={styles.cardDate}>{dayjs(item.date).format('D MMM YYYY, dddd')}</Text>
                                            </View>

                                            <Pressable
                                                onPress={() => (item.is_tracked ? removeFromCalendar(item) : openReminderPicker(item))}
                                                disabled={busy}
                                                hitSlop={8}
                                                style={[styles.addBtn, item.is_tracked && styles.addBtnActive]}
                                            >
                                                <Ionicons
                                                    name={item.is_tracked ? 'checkmark' : 'add'}
                                                    size={18}
                                                    color={item.is_tracked ? theme.textOnPrimary : theme.primary}
                                                />
                                            </Pressable>
                                        </Pressable>

                                        {expanded && (
                                            <View style={styles.reminderPanel}>
                                                <View style={styles.reminderPanelHeader}>
                                                    <Text style={styles.reminderPanelLabel}>Remind me</Text>
                                                    <Pressable hitSlop={8} onPress={() => setExpandedCode(null)}>
                                                        <Ionicons name="close" size={16} color={theme.textMuted} />
                                                    </Pressable>
                                                </View>

                                                {REMINDER_OPTIONS.map((opt) => {
                                                    const on = selected.includes(opt.minutes);
                                                    return (
                                                        <Pressable
                                                            key={opt.minutes}
                                                            style={styles.checkboxRow}
                                                            onPress={() => toggleReminderOption(item.code, opt.minutes)}
                                                        >
                                                            <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18} color={on ? theme.primary : theme.textMuted} />
                                                            <Text style={styles.checkboxLabel}>{'  '}{opt.label}</Text>
                                                        </Pressable>
                                                    );
                                                })}

                                                <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.xs }}>
                                                    <Pressable
                                                        style={[styles.confirmBtn, busy && { opacity: 0.6 }, { flex: 1 }]}
                                                        onPress={() => confirmAddToCalendar(item)}
                                                        disabled={busy}
                                                    >
                                                        <Text style={styles.confirmBtnText}>{busy ? 'Adding...' : 'Add to Calendar'}</Text>
                                                    </Pressable>
                                                    <Pressable
                                                        style={styles.reminderCloseBtn}
                                                        disabled={busy}
                                                        onPress={() => setExpandedCode(null)}
                                                    >
                                                        <Text style={styles.reminderCloseText}>Close</Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )
                    }
                    ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                />
            )}

            <StatusModal
                visible={statusModal.visible}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                autoClose={statusModal.type === 'success'}
                onPrimary={hideStatus}
                onRequestClose={hideStatus}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: theme.primary,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.base,
        gap: spacing.sm,
        // borderBottomLeftRadius: radius.l,
        // borderBottomRightRadius: radius.l,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: theme.textOnPrimary, fontSize: fontSize.lg, fontWeight: '700' },

    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.surface, borderRadius: radius.m,
        paddingHorizontal: 10, paddingVertical: 8,
    },
    searchInput: { flex: 1, fontSize: fontSize.base, color: theme.text, padding: 0 },

    list: { padding: spacing.base, paddingBottom: spacing.xxl },
    emptyWrap: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
    emptyText: { color: theme.textMuted, fontSize: fontSize.base },

    card: {
        backgroundColor: theme.surface,
        borderRadius: radius.m,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    cardRow: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm,
    },
    cardImageWrap: {
        width: 48, height: 48, borderRadius: radius.m, overflow: 'hidden',
        backgroundColor: theme.primaryTint,
    },
    cardImage: { width: '100%', height: '100%' },
    cardImageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    cardText: { flex: 1 },
    cardTitle: { color: theme.text, fontSize: fontSize.md, fontWeight: '600' },
    cardSubtitle: { color: theme.textMuted, fontSize: fontSize.sm, marginTop: 1 },
    cardDate: { color: theme.primary, fontSize: fontSize.xs, marginTop: 3, fontWeight: '600' },

    addBtn: {
        width: 32, height: 32, borderRadius: radius.pill,
        borderWidth: 1, borderColor: theme.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    addBtnActive: { backgroundColor: theme.primary },
    reminderPanel: {
        borderTopWidth: 1, borderTopColor: theme.border,
        padding: spacing.sm, gap: spacing.xs,
    },
    reminderPanelLabel: { color: theme.text, fontSize: fontSize.sm, fontWeight: '700', marginBottom: 2 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    checkboxLabel: { color: theme.text, fontSize: fontSize.sm },
    confirmBtn: {
        marginTop: spacing.xs, backgroundColor: theme.primary, borderRadius: radius.m,
        paddingVertical: 10, alignItems: 'center',
    },
    confirmBtnText: { color: theme.textOnPrimary, fontWeight: '700', fontSize: fontSize.sm },
    monthChipRow: { gap: spacing.xs, paddingVertical: 2 },
    monthChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    monthChipActive: { backgroundColor: theme.surface, borderColor: theme.surface },
    monthChipText: { fontSize: fontSize.xs, fontWeight: '600', color: theme.textOnPrimary },
    monthChipTextActive: { color: theme.primary },

    monthLabel: {
        fontSize: fontSize.sm, fontWeight: '700', color: theme.text,
        marginTop: spacing.md, marginBottom: spacing.xs,
    },
    cardExpanded: {
        borderColor: theme.primary,
        borderWidth: 1.5,
        backgroundColor: theme.primaryTint,
    },
    reminderPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    reminderCloseBtn: {
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: radius.m, borderWidth: 1, borderColor: theme.border,
        backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center',
    },
    reminderCloseText: { color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
});