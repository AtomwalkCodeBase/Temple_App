import Ionicons from '@react-native-vector-icons/ionicons'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { theme, fontSize } from '../theme/theme'

const Header = ({ title, onBack, rightComponent }) => {
    return (
        <View style={styles.header}>
            <View style={styles.side}>
                {onBack && (
                    <Pressable onPress={onBack} hitSlop={8}>
                        <Ionicons name="chevron-back" size={22} color={theme.textOnPrimary} />
                    </Pressable>
                )}
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <View style={[styles.side, styles.sideRight]}>
                {rightComponent}
            </View>
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    header: {
        backgroundColor: theme.primary,
        paddingTop: 14,
        paddingBottom: 10,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    side: {
        minWidth: 22,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    sideRight: {
        alignItems: 'flex-end',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        color: theme.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: '600',
    },
})