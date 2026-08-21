// src/screens/OnboardingScreen.js
import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { Calendar, Bell, Heart, Settings } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n';
import AppText from '../components/AppText';
import Button from '../components/Button';
import Screen from '../components/Screen';

const SLIDE_ICONS = [Calendar, Bell, Heart, Settings];

export default function OnboardingScreen({ onComplete }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  const SLIDES = [
    {
      key: 'welcome',
      icon: SLIDE_ICONS[0],
      title: t('obSlide1Title'),
      description: t('obSlide1Desc'),
    },
    {
      key: 'reminders',
      icon: SLIDE_ICONS[1],
      title: t('obSlide2Title'),
      description: t('obSlide2Desc'),
    },
    {
      key: 'personalize',
      icon: SLIDE_ICONS[2],
      title: t('obSlide3Title'),
      description: t('obSlide3Desc'),
    },
    {
      key: 'preferences',
      icon: SLIDE_ICONS[3],
      title: t('obSlide4Title'),
      description: t('obSlide4Desc'),
      isLast: true,
    },
  ];

  const goNext = () => {
    if (index === SLIDES.length - 1) {
      onComplete?.();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} style={styles(theme).container}>
      <View style={styles(theme).topRow}>
        <View style={{ width: 44 }} />
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={[styles(theme).slide, { width }]}>
              <View style={styles(theme).iconCircle}>
                <Icon size={40} color={theme.color.primary} />
              </View>
              <AppText variant="h2" style={styles(theme).title}>
                {item.title}
              </AppText>
              <AppText variant="body" color="textSecondary" style={styles(theme).description}>
                {item.description}
              </AppText>
            </View>
          );
        }}
      />

      <View style={styles(theme).dotsRow}>
        {SLIDES.map((slide, i) => (
          <View key={slide.key} style={[styles(theme).dot, i === index && styles(theme).dotActive]} />
        ))}
      </View>

      <View style={styles(theme).footer}>
        <Button label={index === SLIDES.length - 1 ? t('obGetStarted') : t('obNext')} onPress={goNext} />
        {index < SLIDES.length - 1 && (
          <Button label={t('obSkip')} variant="text" onPress={() => onComplete?.()} style={{ marginTop: theme.spacing.sm }} />
        )}
      </View>
    </Screen>
  );
}

const styles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.color.background },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.base,
      paddingTop: theme.spacing.lg,
    },
    slide: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xxl,
    },
    iconCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.color.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xxl,
    },
    title: { textAlign: 'center', marginBottom: theme.spacing.md },
    description: { textAlign: 'center' },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: theme.spacing.lg },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.color.border,
      marginHorizontal: 4,
    },
    dotActive: { backgroundColor: theme.color.primary, width: 20 },
    footer: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xl },
  });
