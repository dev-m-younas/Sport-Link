import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserScheduledActivities,
  type ScheduledActivityDoc,
} from '@/lib/scheduledActivities';
import { ACTIVITIES, EXPERTISE_LEVELS } from '@/constants/activities';
import { showToast } from '@/lib/toast';

function getActivityName(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.name ?? activityId;
}

function getLevelLabel(level: string): string {
  return EXPERTISE_LEVELS.find((l) => l.value === level)?.label ?? level;
}

function ScheduledActivityCard({
  activity,
  isDark,
  colors,
  onPress,
}: {
  activity: ScheduledActivityDoc;
  isDark: boolean;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activityDateTime = new Date(`${activity.activityDate}T${activity.activityTime}`);
  const now = new Date();
  const isUpcoming = activityDateTime > now;
  const isPast = activityDateTime < now;

  return (
    <TouchableOpacity
      style={[styles.activityCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: colors.chipBg }]}>
          <MaterialCommunityIcons
            name={
              ACTIVITIES.find((a) => a.id === activity.activityName)?.icon as any || 'run'
            }
            size={24}
            color="#0a7ea4"
          />
        </View>
        <View style={styles.cardTitleBlock}>
          <ThemedText style={styles.cardTitle}>
            {getActivityName(activity.activityName)}
          </ThemedText>
          <ThemedText style={styles.cardMeta}>
            with {activity.partnerName} · {getLevelLabel(activity.level)}
          </ThemedText>
        </View>
        {isUpcoming && (
          <View style={styles.upcomingBadge}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#0a7ea4" />
          </View>
        )}
        {isPast && (
          <View style={styles.pastBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
          </View>
        )}
      </View>

        <View style={styles.cardRow}>
        <MaterialCommunityIcons
          name="calendar"
          size={16}
          color={colors.textSecondary}
        />
        <ThemedText style={styles.cardText}>
          {formatDate(activity.activityDate)} at {formatTime(activity.activityTime)}
        </ThemedText>
      </View>

        <View style={styles.cardRow}>
        <MaterialCommunityIcons
          name="map-marker"
          size={16}
          color={colors.textSecondary}
        />
        <ThemedText style={styles.cardText}>{activity.location}</ThemedText>
      </View>

      {activity.partnerProfileImage && (
        <View style={[styles.partnerSection, { borderTopColor: colors.border }]}>
          <Image
            source={{ uri: activity.partnerProfileImage }}
            style={[styles.partnerAvatar, { borderColor: colors.tint }]}
            contentFit="cover"
          />
          <ThemedText style={styles.partnerText}>
            Partner: {activity.partnerName}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ScheduledActivitiesScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const isDark = colors.background === '#151718';
  const insets = useSafeAreaInsets();

  const [activities, setActivities] = useState<ScheduledActivityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivities = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const scheduled = await getUserScheduledActivities(user.uid);
      setActivities(scheduled);
    } catch (error: any) {
      console.error('Error loading scheduled activities:', error);
      showToast.error('Error', 'Failed to load scheduled activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadActivities();
      
      // Skip notifications in Expo Go - not supported there
      if (Constants.appOwnership !== 'expo') {
        const { checkAndSendNotifications } = require('@/lib/activityNotifications');
        checkAndSendNotifications();
      }
    }, [loadActivities])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivities();
  }, [loadActivities]);

  const handleActivityPress = (activity: ScheduledActivityDoc) => {
    router.push({
      pathname: '/(tabs)/activity-detail',
      params: { id: activity.activityId },
    });
  };

  const upcomingActivities = activities.filter((a) => {
    const activityDateTime = new Date(`${a.activityDate}T${a.activityTime}`);
    return activityDateTime > new Date();
  });

  const pastActivities = activities.filter((a) => {
    const activityDateTime = new Date(`${a.activityDate}T${a.activityTime}`);
    return activityDateTime <= new Date();
  });

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Scheduled Activities
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading activities...</ThemedText>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="calendar-clock" size={64} color={colors.icon} />
          <ThemedText style={styles.emptyTitle}>No scheduled activities</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Activities you accept will appear here
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
            />
          }>
          {upcomingActivities.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Upcoming</ThemedText>
              {upcomingActivities.map((activity) => (
                <ScheduledActivityCard
                  key={activity.id}
                  activity={activity}
                  isDark={isDark}
                  colors={colors}
                  onPress={() => handleActivityPress(activity)}
                />
              ))}
            </View>
          )}

          {pastActivities.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Past</ThemedText>
              {pastActivities.map((activity) => (
                <ScheduledActivityCard
                  key={activity.id}
                  activity={activity}
                  isDark={isDark}
                  colors={colors}
                  onPress={() => handleActivityPress(activity)}
                />
              ))}
            </View>
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  activityCard: {
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
  upcomingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    flex: 1,
  },
  partnerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  partnerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  partnerText: {
    fontSize: 14,
    opacity: 0.8,
  },
});
