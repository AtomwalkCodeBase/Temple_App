// components/FloatingActionMenu.js
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { theme, radius } from '../theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FloatingActionMenu({ actions = [], bottomOffset }) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false); // keeps menu rendered during close animation
    const anim = useRef(new Animated.Value(0)).current;
    const GAP_ABOVE_TAB = 10;

    const bottom = bottomOffset ?? GAP_ABOVE_TAB;
    const isFocused = useIsFocused();


    const directionRef = useRef('closed'); // 'open' | 'closed' — guards stale callbacks

    useEffect(() => {
        if (isFocused) return;

        directionRef.current = 'closed';
        anim.stopAnimation();
        anim.setValue(0);
        setOpen(false);
        setMounted(false);
    }, [anim, isFocused]);

    const toggle = () => {
        const next = !open;
        directionRef.current = next ? 'open' : 'closed';
        if (next) setMounted(true);
        setOpen(next);
        Animated.spring(anim, {
            toValue: next ? 1 : 0,
            friction: 7,
            tension: 60,
            useNativeDriver: true,
        }).start(({ finished }) => {
            // Only unmount after a clean, uninterrupted close animation
            if (finished && directionRef.current === 'closed') setMounted(false);
        });
    };

    const close = () => {
        if (!open) return;
        directionRef.current = 'closed';
        setOpen(false);
        Animated.spring(anim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true })
            .start(({ finished }) => {
                if (finished && directionRef.current === 'closed') setMounted(false);
            });
    };

    return (
        <>
            {open && <Pressable style={StyleSheet.absoluteFill} onPress={close} />}

            <View style={[styles.container, { bottom }]} pointerEvents="box-none">
                <View style={styles.row} pointerEvents="box-none">
                    {mounted && actions.map((action, i) => (
                        <Animated.View
                            key={action.key ?? i}
                            style={[
                                styles.item,
                                {
                                    opacity: anim,
                                    elevation: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }),
                                    transform: [
                                        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                                        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                                    ],
                                },
                            ]}
                            pointerEvents={open ? 'auto' : 'none'}
                        >
                            <Text style={styles.label} numberOfLines={1}>{action.label}</Text>
                            <AnimatedPressable
                                style={[styles.itemButton, {
                                    elevation: anim.interpolate({ inputRange: [0, 0], outputRange: [0, 0] }),
                                }]}
                                onPress={() => { close(); action.onPress?.(); }}
                            >
                                <Ionicons name={action.icon} size={20} color="#fff" />
                            </AnimatedPressable>
                        </Animated.View>
                    ))}

                    <Pressable style={styles.fab} onPress={toggle}>
                        <Animated.View
                            style={{
                                transform: [{
                                    rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }),
                                }],
                            }}
                        >
                            <Ionicons name="add" size={28} color="#fff" />
                        </Animated.View>
                    </Pressable>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute', right: 20, zIndex: 20,
    },
    row: {
        flexDirection: 'column', alignItems: 'flex-end', gap: 15
    },
    fab: {
        width: 56, height: 56, borderRadius: radius.pill,
        backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25,
        shadowRadius: 6, elevation: 6,
    },
    item: {
        flexDirection: 'row', alignItems: 'center', marginRight: 6,
    },
    itemButton: {
        width: 44, height: 44, borderRadius: radius.pill,
        backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2,
        shadowRadius: 4, elevation: 5,
    },
    label: {
        backgroundColor: theme.text, color: '#fff', fontSize: 12, fontWeight: '600',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, marginRight: 6,
        overflow: 'hidden',
    },
});