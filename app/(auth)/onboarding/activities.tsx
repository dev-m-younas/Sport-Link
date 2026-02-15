import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthButton } from '@/components/auth/AuthButton';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ACTIVITIES } from '@/constants/activities';

export default function ActivitiesScreen() {
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const toggleActivity = (activityId: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleNext = () => {
    if (selectedActivities.length === 0) return;
    router.push({
      pathname: '/(auth)/onboarding/expertise',
      params: {
        ...params,
        activities: JSON.stringify(selectedActivities),
      },
    });
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
                name="soccer"
                size={40}
                color="#0a7ea4"
              />
            </View>
            <ThemedText type="title" style={styles.title}>
              Select Activities
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Choose your favorite sports and activities
            </ThemedText>
          </View>

          {/* Activities Grid */}
          <View style={styles.activitiesContainer}>
            {ACTIVITIES.map((activity) => {
              const isSelected = selectedActivities.includes(activity.id);
              return (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityCard,
                    isSelected && styles.activityCardSelected,
                    isDark && styles.activityCardDark,
                    isSelected && isDark && styles.activityCardSelectedDark,
                  ]}
                  onPress={() => toggleActivity(activity.id)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerSelected,
                      isDark && styles.iconContainerDark,
                    ]}>
                    <MaterialCommunityIcons
                      name={activity.icon as any}
                      size={32}
                      color={isSelected ? '#fff' : '#0a7ea4'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.activityName,
                      isSelected && styles.activityNameSelected,
                      isDark && styles.activityNameDark,
                    ]}>
                    {activity.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color="#0a7ea4"
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
              title="Continue"
              onPress={handleNext}
              disabled={selectedActivities.length === 0}
            />
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}>
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
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircleDark: {
    backgroundColor: '#1D3D47',
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
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  activityCard: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: 16,
    backgroundColor: '#F1F3F4',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  activityCardDark: {
    backgroundColor: '#2C2E31',
  },
  activityCardSelected: {
    backgroundColor: '#E6F4FE',
    borderColor: '#0a7ea4',
  },
  activityCardSelectedDark: {
    backgroundColor: '#1D3D47',
    borderColor: '#0a7ea4',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainerDark: {
    backgroundColor: '#3C3E42',
  },
  iconContainerSelected: {
    backgroundColor: '#0a7ea4',
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    textAlign: 'center',
  },
  activityNameDark: {
    color: '#ECEDEE',
  },
  activityNameSelected: {
    color: '#0a7ea4',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
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
