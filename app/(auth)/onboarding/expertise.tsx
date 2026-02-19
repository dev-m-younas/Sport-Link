import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthButton } from '@/components/auth/AuthButton';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { saveUserProfile, type ExpertiseLevel } from '@/lib/userProfile';

const EXPERTISE_LEVELS: { level: ExpertiseLevel; label: string; icon: string; description: string }[] = [
  {
    level: 'beginner',
    label: 'Beginner',
    icon: 'star-outline',
    description: 'Just starting out',
  },
  {
    level: 'intermediate',
    label: 'Intermediate',
    icon: 'star-half-full',
    description: 'Some experience',
  },
  {
    level: 'pro',
    label: 'Pro',
    icon: 'star',
    description: 'Advanced level',
  },
];

export default function ExpertiseScreen() {
  const params = useLocalSearchParams();
  const { user, refreshOnboardingStatus } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [selectedLevel, setSelectedLevel] = useState<ExpertiseLevel | null>(null);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!selectedLevel || !user) return;

    setLoading(true);
    try {
      const activities = JSON.parse((params.activities as string) || '[]');
      
      await saveUserProfile(user, {
        name: params.name as string,
        email: params.email as string,
        phoneNumber: params.phoneNumber as string,
        dateOfBirth: params.dateOfBirth as string,
        gender: params.gender as any,
        country: params.country as string,
        countryCode: params.countryCode as string,
        city: params.city as string,
        activities,
        expertiseLevel: selectedLevel,
        // Only include profileImage if it exists and is not empty
        ...(params.profileImage && (params.profileImage as string).trim() !== ''
          ? { profileImage: params.profileImage as string }
          : {}),
        onboardingCompleted: true,
      });

      // Save push token to DB (for join requests, chat notifications)
      const { savePushToken } = await import('@/lib/chatPushNotifications');
      savePushToken(user.uid).catch(() => {});

      // Refresh onboarding status
      await refreshOnboardingStatus();

      // Redirect to welcome screens
      router.replace('/(auth)/onboarding/welcome-1');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
              <MaterialCommunityIcons
                name="trophy"
                size={40}
                color="#00ADB5"
              />
            </View>
            <ThemedText type="title" style={styles.title}>
              Expertise Level
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Select your skill level
            </ThemedText>
          </View>

          {/* Expertise Levels */}
          <View style={styles.levelsContainer}>
            {EXPERTISE_LEVELS.map((item) => {
              const isSelected = selectedLevel === item.level;
              return (
                <TouchableOpacity
                  key={item.level}
                  style={[
                    styles.levelCard,
                    isSelected && styles.levelCardSelected,
                    isDark && styles.levelCardDark,
                    isSelected && isDark && styles.levelCardSelectedDark,
                  ]}
                  onPress={() => setSelectedLevel(item.level)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerSelected,
                      isDark && styles.iconContainerDark,
                    ]}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={48}
                      color={isSelected ? '#fff' : '#00ADB5'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.levelLabel,
                      isSelected && styles.levelLabelSelected,
                      isDark && styles.levelLabelDark,
                    ]}>
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.levelDescription,
                      isDark && styles.levelDescriptionDark,
                    ]}>
                    {item.description}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={28}
                        color="#00ADB5"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <AuthButton
              title={loading ? 'Completing...' : 'Complete Setup'}
              onPress={handleComplete}
              disabled={!selectedLevel || loading}
              loading={loading}
            />
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={loading}>
              <ThemedText type="link">Back</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,173,181,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircleDark: {
    backgroundColor: 'rgba(0,173,181,0.2)',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    opacity: 0.8,
    textAlign: 'center',
    fontSize: 16,
  },
  levelsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  levelCard: {
    borderRadius: 20,
    backgroundColor: '#F1F3F4',
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  levelCardDark: {
    backgroundColor: '#393E46',
  },
  levelCardSelected: {
    backgroundColor: 'rgba(0,173,181,0.15)',
    borderColor: '#00ADB5',
  },
  levelCardSelectedDark: {
    backgroundColor: 'rgba(0,173,181,0.2)',
    borderColor: '#00ADB5',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerDark: {
    backgroundColor: '#3C3E42',
  },
  iconContainerSelected: {
    backgroundColor: '#00ADB5',
  },
  levelLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 8,
  },
  levelLabelDark: {
    color: '#ECEDEE',
  },
  levelLabelSelected: {
    color: '#00ADB5',
  },
  levelDescription: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
  },
  levelDescriptionDark: {
    color: '#9BA1A6',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
});
