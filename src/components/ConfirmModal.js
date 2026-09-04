import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { theme, spacing, radius } from '../screens/theme';

const VARIANTS = {
    normal: {
        icon: '?',
        iconBg: theme.accentTint,
        iconColor: theme.accent,
        confirmBg: theme.accent,
    },
    error: {
        icon: '!',
        iconBg: theme.errorTint,
        iconColor: theme.error,
        confirmBg: theme.error,
    },
    warning: {
        icon: '!',
        iconBg: theme.sacredTint,
        iconColor: theme.sacredMuted,
        confirmBg: theme.sacred,
    },
};

export default function ConfirmModal({
    visible,
    type = 'normal', // 'normal' | 'error' | 'warning'
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    onRequestClose,
}) {
    const v = VARIANTS[type] ?? VARIANTS.normal;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onRequestClose ?? onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={[styles.iconWrap, { backgroundColor: v.iconBg }]}>
                        <Text style={[styles.icon, { color: v.iconColor }]}>{v.icon}</Text>
                    </View>

                    {!!title && <Text style={styles.title}>{title}</Text>}
                    {!!message && <Text style={styles.message}>{message}</Text>}

                    <View style={styles.actions}>
                        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onCancel}>
                            <Text style={styles.btnSecondaryText}>{cancelLabel}</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.btn, { backgroundColor: v.confirmBg }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(4,44,83,0.11)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.surface,
        borderRadius: radius.l,
        padding: spacing.xl,
        alignItems: 'center',
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: radius.pill,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.base,
    },
    icon: {
        fontSize: 26,
        fontWeight: '700',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    message: {
        fontSize: 14,
        color: theme.textMuted,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
        width: '100%',
    },
    btn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radius.m,
        alignItems: 'center',
    },
    btnSecondary: {
        backgroundColor: theme.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.border,
    },
    btnSecondaryText: {
        color: theme.text,
        fontWeight: '600',
        fontSize: 14,
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});