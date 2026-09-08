// components/SlideDrawer.js — reusable slide-in panel + fading overlay.
// Use for any drawer/sheet: MonthAgendaDrawer, filters, notifications, etc.
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SlideDrawer({
    visible,
    onClose,
    from = 'right', // 'right' | 'left' | 'bottom'
    size,           // width (right/left) or height (bottom); defaults below
    children,
}) {
    const panelSize = size ?? (from === 'bottom' ? SCREEN_HEIGHT * 0.6 : Math.min(320, SCREEN_WIDTH * 0.82));
    const offscreen = from === 'left' ? -panelSize : panelSize;

    const [mounted, setMounted] = useState(visible);
    const translate = useRef(new Animated.Value(offscreen)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setMounted(true);
            Animated.parallel([
                Animated.timing(translate, { toValue: 0, duration: 260, useNativeDriver: true }),
                Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
            ]).start();
        } else if (mounted) {
            Animated.parallel([
                Animated.timing(translate, { toValue: offscreen, duration: 220, useNativeDriver: true }),
                Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]).start(() => setMounted(false)); // unmount only after the animation finishes
        }
    }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!mounted) return null;

    const panelStyle =
        from === 'bottom'
            ? { left: 0, right: 0, bottom: 0, height: panelSize, transform: [{ translateY: translate }] }
            : from === 'left'
                ? { left: 0, top: 0, bottom: 0, width: panelSize, transform: [{ translateX: translate }] }
                : { right: 0, top: 0, bottom: 0, width: panelSize, transform: [{ translateX: translate }] };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>
            <Animated.View style={[styles.panel, panelStyle]}>{children}</Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,44,83,0.4)' },
    panel: {
        position: 'absolute', backgroundColor: '#FFFFFF', elevation: 12,
        shadowColor: '#042C53', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: -2, height: 0 },
    },
});