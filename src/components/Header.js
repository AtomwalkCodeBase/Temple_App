import Ionicons from '@react-native-vector-icons/ionicons'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { theme, fontSize } from '../theme/theme'

const Header = ({ title, onBack }) => {
    return (
        <View style={styles.headerRow}>
            <Pressable onPress={onBack} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={theme.textOnPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={{ width: 22 }} />
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: theme.textOnPrimary, fontSize: fontSize.lg, fontWeight: '700' },

})