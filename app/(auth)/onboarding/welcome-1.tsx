import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WelcomeScreen1() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const handleNext = () => {
    router.push('/(auth)/onboarding/welcome-2');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Skip Button - Top Right */}
        <View style={styles.skipContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}>
            <ThemedText style={styles.skipText}>Skip</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon/Image */}
          <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
            <MaterialCommunityIcons
              name="soccer"
              size={120}
              color="#0a7ea4"
            />
          </View>

          {/* Title */}
          <ThemedText type="title" style={styles.title}>
            Welcome to Sport Link!
          </ThemedText>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <ThemedText style={styles.description}>
              Discover exciting games and sports activities
            </ThemedText>
            <ThemedText style={styles.description}>
              Find matches, tournaments, and events near you
            </ThemedText>
          </View>
        </View>

        {/* Next Button - Bottom Right */}
        <View style={styles.nextContainer}>
          <TouchableOpacity
            style={[styles.nextButton, isDark && styles.nextButtonDark]}
            onPress={handleNext}
            activeOpacity={0.8}>
            <MaterialCommunityIcons
              name="arrow-right"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skipContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainerDark: {
    backgroundColor: '#1D3D47',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  descriptionContainer: {
    alignItems: 'center',
    gap: 12,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 28,
  },
  nextContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'flex-end',
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  nextButtonDark: {
    backgroundColor: '#0a7ea4',
  },
});
