// MonthAgendaDrawer.js — slides in from the right; lists every festival and
// personal event for the month currently shown, in two separate sections.
import React, { useEffect, useRef } from 'react';
import {
    View, Text, Pressable, ScrollView, StyleSheet, Animated, Dimensions,
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

    return (
        <SlideDrawer visible={visible} onClose={onClose} from="right">
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{monthLabel}</Text>
                <Pressable onPress={onClose} hitSlop={10}>
                    <Ionicons name="close" size={22} color={theme.text} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Festivals</Text>
                {festivals.length === 0 ? (
                    <Text style={styles.emptyNote}>No festivals this month.</Text>
                ) : (
                    festivals.map((ev) => (
                        <Pressable
                            key={`fest-${ev.id}`}
                            style={[styles.row, styles.rowFestival]}
                            onPress={() => { onSelectDate(ev.date); onClose(); }}
                        >
                            <Text style={styles.rowDate}>{dayjs(ev.date).format('D MMM')}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>{ev.title}</Text>
                                <Text style={styles.rowSub}>{ev.subtitle}</Text>
                            </View>
                        </Pressable>
                    ))
                )}

                <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Personal Events</Text>
                {personalEvents.length === 0 ? (
                    <Text style={styles.emptyNote}>No personal events this month.</Text>
                ) : (
                    personalEvents.map((ev) => (
                        <Pressable
                            key={`evt-${ev.id}`}
                            style={[styles.row, styles.rowPersonal]}
                            onPress={() => { onSelectDate(ev.date); onClose(); }}
                        >
                            <Text style={styles.rowDate}>{dayjs(ev.date).format('D MMM')}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>{ev.title}</Text>
                                <Text style={styles.rowSub}>{ev.subtitle}</Text>
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </SlideDrawer >
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,44,83,0.4)' },
    drawer: {
        position: 'absolute', right: 0, top: 0, bottom: 0, width: DRAWER_WIDTH,
        backgroundColor: theme.surface, elevation: 12,
        shadowColor: theme.sky, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: -2, height: 0 },
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
    rowDate: { fontSize: fontSize.sm, fontWeight: '700', color: theme.accent, minWidth: 42 },
    rowTitle: { fontSize: fontSize.base, fontWeight: '600', color: theme.text },
    rowSub: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 1 },
});