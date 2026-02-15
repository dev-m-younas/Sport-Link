import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { getUserProfile, type UserProfile } from '@/lib/userProfile';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = colors.background === '#151718';
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Force navigation to sign-in screen
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 8, 24) },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          {profile?.profileImage ? (
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
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonSecondary }]}
            onPress={() => router.push('/(tabs)/edit-profile')}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="account-edit" size={24} color={colors.tint} />
            <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonSecondary }]}
            onPress={() => router.push('/(tabs)/my-activities')}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={colors.tint} />
            <ThemedText style={styles.buttonText}>My Activities</ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonSecondary }]}
            onPress={() => router.push('/(tabs)/scheduled-activities')}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.tint} />
            <ThemedText style={styles.buttonText}>Scheduled Activities</ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonSecondary }]}
            onPress={() => router.push('/(tabs)/terms-policies')}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="file-document" size={24} color={colors.tint} />
            <ThemedText style={styles.buttonText}>Terms & Policies</ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonSecondary }]}
            onPress={() => router.push('/(tabs)/report-problem')}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.tint} />
            <ThemedText style={styles.buttonText}>Report a Problem</ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton, { backgroundColor: colors.errorBg }]}
            onPress={handleLogout}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
            <ThemedText style={[styles.buttonText, styles.logoutText, { color: colors.error }]}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 8,
  },
  logoutText: {},
});
