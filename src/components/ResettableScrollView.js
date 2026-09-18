import React, { useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function ResettableScrollView({ children, ...props }) {
    const ref = useRef(null);

    useFocusEffect(
        useCallback(() => {
            ref.current?.scrollTo({ y: 0, animated: false });
        }, [])
    );

    return (
        <ScrollView ref={ref} {...props}>
            {children}
        </ScrollView>
    );
}