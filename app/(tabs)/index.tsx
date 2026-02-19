import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { getActivitiesWithinRadius, type ActivityDoc } from '@/lib/activities';
import { ACTIVITIES, getActivityConfig } from '@/constants/activities';
import { showToast } from '@/lib/toast';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { getUserProfile, type UserProfile } from '@/lib/userProfile';

function getActivityName(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.name ?? activityId;
}

function ActivityCard({
  item,
  isDark,
  iconColor,
}: {
  item: ActivityDoc;
  isDark: boolean;
  iconColor: string;
}) {
  const activityName = getActivityName(item.activity);
  const dateObj = new Date(item.date);
  const timeStr = new Date(item.time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handlePress = () => {
    router.push({
      pathname: '/(tabs)/activity-detail',
      params: { id: item.id },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}>
      <ThemedView
        style={[
          styles.card,
          { backgroundColor: isDark ? '#393E46' : '#EEEEEE' },
        ]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(0,173,181,0.2)' : 'rgba(0,173,181,0.15)' }]}>
            <MaterialCommunityIcons
              name={
                ACTIVITIES.find((a) => a.id === item.activity)?.icon as any ||
                'run'
              }
              size={24}
              color="#00ADB5"
            />
          </View>
          <View style={styles.cardTitleBlock}>
            <ThemedText style={styles.cardTitle}>{activityName}</ThemedText>
            <ThemedText style={styles.cardMeta}>
              {item.creatorName} · {item.level}
              {(item.maxPlayers ?? getActivityConfig(item.activity)?.maxPlayers)
                ? ` · Max ${item.maxPlayers ?? getActivityConfig(item.activity)?.maxPlayers}`
                : (item.minPlayersPerTeam ?? getActivityConfig(item.activity)?.minPlayersPerTeam)
                  ? ` · ${item.minPlayersPerTeam ?? getActivityConfig(item.activity)?.minPlayersPerTeam}/team`
                  : ""}
            </ThemedText>
          </View>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons
            name="map-marker"
            size={16}
            color={iconColor}
          />
          <ThemedText style={styles.cardLocation}>{item.location}</ThemedText>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={iconColor}
          />
          <ThemedText style={styles.cardDate}>
            {dateStr} at {timeStr}
          </ThemedText>
        </View>
        {item.notes ? (
          <ThemedText style={styles.cardNotes} numberOfLines={2}>
            {item.notes}
          </ThemedText>
        ) : null}
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const colors = useThemeColors();
  const isDark = colors.background === '#222831';
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;
    loadProfileImage();
    // Retry once after delay in case profile doc isn't ready yet (e.g. right after sign-up)
    const t = setTimeout(loadProfileImage, 800);
    return () => clearTimeout(t);
  }, [user]);

  const loadProfileImage = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.profileImage) {
        setProfileImage(profile.profileImage);
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
      setProfileImage(null);
    }
  };

  const fetchNearby = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setActivities([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setLocationDenied(false);
      // Try cached location first (instant) - fallback to GPS (slow)
      let pos = await Location.getLastKnownPositionAsync({});
      if (!pos) {
        pos = await Location.getCurrentPositionAsync({
          maximumAge: 60000,
          accuracy: Location.Accuracy.Balanced,
        });
      }

      // Update location in background - don't block activity loading
      if (user?.uid) {
        import('@/lib/userProfile').then(({ saveUserProfile }) =>
          saveUserProfile(user, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).catch(() => {})
        );
      }

      const list = await getActivitiesWithinRadius(
        pos.coords.latitude,
        pos.coords.longitude,
        30, // 30KM radius
        user.uid // Exclude current user's own activities
      );
      setActivities(list);
    } catch (e) {
      showToast.error(
        'Could not load activities',
        (e as Error)?.message || 'Please try again.'
      );
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNearby();
      // Refetch profile image when home is focused so header avatar stays in sync (e.g. after edit profile)
      if (user) loadProfileImage();
    }, [fetchNearby, user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNearby();
  }, [fetchNearby]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24), borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.profileBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {profileImage ? (
            <Image
              key={profileImage}
              source={{ uri: profileImage }}
              style={[styles.profileImage, { borderColor: colors.tint }]}
              contentFit="cover"
            />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={32} color={colors.tint} />
          )}
        </TouchableOpacity>
        <View style={styles.centerTitle}>
          <ThemedText type="title" style={styles.centerTitleText}>Activities</ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      {locationDenied && (
        <View style={[styles.banner, { backgroundColor: colors.errorBg }]}>
          <MaterialCommunityIcons name="map-marker-off" size={24} color={colors.error} />
          <ThemedText style={[styles.bannerText, { color: colors.errorText }]}>
            Turn on location to see activities near you (within 30km).
          </ThemedText>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading activities...</ThemedText>
        </View>
      ) : activities.length === 0 && !locationDenied ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="run" size={64} color={colors.icon} />
          <ThemedText style={styles.emptyTitle}>No activities nearby</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Activities within 30km will show here. Create one with the + button!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActivityCard item={item} isDark={isDark} iconColor={colors.textSecondary} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  profileBtn: {
    padding: 4,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00ADB5',
  },
  centerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  centerTitleText: {
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardLocation: {
    fontSize: 14,
    flex: 1,
  },
  cardDate: {
    fontSize: 14,
  },
  cardNotes: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
