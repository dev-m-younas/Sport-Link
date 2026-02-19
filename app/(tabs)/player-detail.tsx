import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { getUserProfile, type UserProfile } from '@/lib/userProfile';
import { ACTIVITIES, EXPERTISE_LEVELS } from '@/constants/activities';
import { useAuth } from '@/contexts/AuthContext';

function getActivityName(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.name ?? activityId;
}

function getLevelLabel(level: string): string {
  return EXPERTISE_LEVELS.find((l) => l.value === level)?.label ?? level;
}

function getGenderLabel(gender: string): string {
  const labels: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
  };
  return labels[gender] || gender;
}

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

export default function PlayerDetailScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const playerId = params.id as string;
  const colors = useThemeColors();
  const isDark = colors.background === '#222831';
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleChat = () => {
    if (!user || !playerId) return;
    router.push({
      pathname: '/(tabs)/chat-detail',
      params: { userId: playerId },
    });
  };

  useEffect(() => {
    if (playerId) {
      loadPlayerProfile();
    }
  }, [playerId]);

  const loadPlayerProfile = async () => {
    try {
      setLoading(true);
      const playerProfile = await getUserProfile(playerId);
      if (playerProfile) {
        setProfile(playerProfile);
      } else {
        router.back();
      }
    } catch (error: any) {
      console.error('Error loading player profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ADB5" />
          <ThemedText style={styles.loadingText}>Loading player...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#E53935" />
          <ThemedText style={styles.errorText}>Player not found</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const age = calculateAge(profile.dateOfBirth);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Player Profile
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Profile Image & Name */}
        <View style={styles.profileHeader}>
          {profile.profileImage ? (
            <Image
              source={{ uri: profile.profileImage }}
              style={[styles.profileImage, { borderColor: colors.tint }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.chipBg, borderColor: colors.tint }]}>
              <MaterialCommunityIcons name="account" size={64} color={colors.tint} />
            </View>
          )}
          <ThemedText type="title" style={styles.playerName}>
            {profile.name}
          </ThemedText>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <ThemedText style={styles.sectionTitle}>Details</ThemedText>
          
          {/* Age & Gender */}
          {(age !== null || profile.gender) && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color="#00ADB5"
              />
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Age & Gender</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {age !== null ? `${age} years` : 'N/A'} · {getGenderLabel(profile.gender)}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color="#00ADB5"
            />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Location</ThemedText>
              <ThemedText style={styles.detailValue}>
                {profile.city ? `${profile.city}, ` : ''}{profile.country}
              </ThemedText>
            </View>
          </View>

          {/* Expertise Level */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="trophy"
              size={20}
              color="#00ADB5"
            />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Expertise Level</ThemedText>
              <ThemedText style={styles.detailValue}>
                {getLevelLabel(profile.expertiseLevel)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Activities Section */}
        {profile.activities && profile.activities.length > 0 && (
          <View style={styles.activitiesSection}>
            <ThemedText style={styles.sectionTitle}>Activities</ThemedText>
            <View style={styles.activitiesGrid}>
              {profile.activities.map((activityId) => {
                const activity = ACTIVITIES.find((a) => a.id === activityId);
                return (
                  <View
                    key={activityId}
                    style={[styles.activityChip, isDark && styles.activityChipDark]}>
                    <MaterialCommunityIcons
                      name={(activity?.icon as any) || 'run'}
                      size={20}
                      color="#00ADB5"
                    />
                    <ThemedText style={styles.activityChipText}>
                      {getActivityName(activityId)}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Chat Button - Only show if user is not viewing their own profile */}
      {user && user.uid !== playerId && (
        <View         style={[styles.chatButtonContainer, { paddingBottom: Math.max(insets.bottom + 16, 20), borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: colors.tint }]}
            onPress={handleChat}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="message-text" size={24} color="#fff" />
            <ThemedText style={styles.chatButtonText}>Chat</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding for chat button
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  playerName: {
    fontSize: 28,
    fontWeight: '700',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
  },
  activitiesSection: {
    marginBottom: 24,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,173,181,0.15)',
  },
  activityChipDark: {
    backgroundColor: 'rgba(0,173,181,0.2)',
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00ADB5',
  },
  backButtonText: {
    fontSize: 16,
    color: '#00ADB5',
    fontWeight: '600',
  },
  chatButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
