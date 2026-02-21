import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useEvent } from 'expo';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ACTIVITIES, EXPERTISE_LEVELS } from '@/constants/activities';
import { getActivityById, type ActivityDoc } from '@/lib/activities';
import { getJoinedCount } from '@/lib/activityParticipants';
import { useAuth } from '@/contexts/AuthContext';
import { createJoinRequest } from '@/lib/notifications';
import { getUserProfile } from '@/lib/userProfile';
import { showToast } from '@/lib/toast';

function getActivityName(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.name ?? activityId;
}

function getLevelLabel(level: string): string {
  return EXPERTISE_LEVELS.find((l) => l.value === level)?.label ?? level;
}

function ActivityVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={styles.videoContainer}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="contain"
      />
      {!isPlaying && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="play" size={48} color="#fff" />
        </TouchableOpacity>
      )}
      {isPlaying && (
        <TouchableOpacity
          style={styles.pauseOverlay}
          onPress={handlePlayPause}
          activeOpacity={0.8}>
          <View style={styles.pauseButton}>
            <MaterialCommunityIcons name="pause" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ActivityDetailScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const activityId = params.id as string;
  const colors = useThemeColors();
  const isDark = colors.background === '#222831';
  const insets = useSafeAreaInsets();
  
  const [activity, setActivity] = useState<ActivityDoc | null>(null);
  const [creatorDisplayName, setCreatorDisplayName] = useState<string | null>(null);
  const [joinedCount, setJoinedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true);
      const found = await getActivityById(activityId);
      if (found) {
        setActivity(found);
        const count = await getJoinedCount(activityId);
        setJoinedCount(count);
        if (found.creatorName?.includes('@')) {
          const profile = await getUserProfile(found.creatorUid);
          setCreatorDisplayName(profile?.name || 'User');
        } else {
          setCreatorDisplayName(null);
        }
      } else {
        router.back();
      }
    } catch (error: any) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (activityId) loadActivity();
  }, [activityId, loadActivity]);

  useFocusEffect(
    useCallback(() => {
      if (activityId) loadActivity();
    }, [activityId, loadActivity])
  );

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

  const requiredMembers = activity?.requiredMembers ?? 1;
  const isFull = joinedCount >= requiredMembers;

  const handleJoin = async () => {
    if (!user || !activity) return;

    if (user.uid === activity.creatorUid) {
      showToast.error('Cannot join', 'You cannot join your own activity');
      return;
    }

    if (isFull) {
      showToast.error('Full', 'This activity has reached maximum participants');
      return;
    }

    try {
      setJoining(true);
      
      // Get user profile for sender info
      const userProfile = await getUserProfile(user.uid);
      const activityName = getActivityName(activity.activity);
      
      await createJoinRequest({
        activityId: activity.id,
        activityName,
        recipientUid: activity.creatorUid,
        senderUid: user.uid,
        senderName: userProfile?.name || user.displayName || user.email || 'User',
        senderProfileImage: userProfile?.profileImage,
      });
      
      showToast.success('Join request sent', 'The activity creator will be notified');
    } catch (error: any) {
      console.error('Error joining activity:', error);
      showToast.error(
        'Failed to join',
        error.message || 'Please try again later'
      );
    } finally {
      setJoining(false);
    }
  };

  const isCreator = user?.uid === activity?.creatorUid;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ADB5" />
          <ThemedText style={styles.loadingText}>Loading activity...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!activity) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#E53935" />
          <ThemedText style={styles.errorText}>Activity not found</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ThemedText style={[styles.backButtonText, { color: colors.tint }]}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const activityName = getActivityName(activity.activity);
  const levelLabel = getLevelLabel(activity.level);

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
          Activity Details
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Activity Icon & Name */}
        <View style={styles.activityHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.chipBg }]}>
            <MaterialCommunityIcons
              name={
                ACTIVITIES.find((a) => a.id === activity.activity)?.icon as any || 'run'
              }
              size={48}
              color="#00ADB5"
            />
          </View>
          <ThemedText type="title" style={styles.activityTitle}>
            {activityName}
          </ThemedText>
          <ThemedText style={styles.levelText}>{levelLabel}</ThemedText>
        </View>

        {/* Video Section */}
        {activity.videoUri ? (
          <View style={styles.videoSection}>
            <ThemedText style={styles.sectionTitle}>Video</ThemedText>
            <ActivityVideoPlayer uri={activity.videoUri} />
          </View>
        ) : null}

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <ThemedText style={styles.sectionTitle}>Details</ThemedText>
          
          {/* Date & Time */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color="#00ADB5"
            />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Date & Time</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(activity.date)} at {formatTime(activity.time)}
              </ThemedText>
            </View>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color="#00ADB5"
            />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Location</ThemedText>
              <ThemedText style={styles.detailValue}>{activity.location}</ThemedText>
              {activity.locationLat && activity.locationLong && (
                <ThemedText style={styles.coordinatesText}>
                  {activity.locationLat.toFixed(6)}, {activity.locationLong.toFixed(6)}
                </ThemedText>
              )}
            </View>
          </View>

          {/* Required members / joined count */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color="#00ADB5"
            />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Members</ThemedText>
              <ThemedText style={styles.detailValue}>
                {joinedCount} of {requiredMembers} joined
                {isFull ? " (Full)" : ""}
              </ThemedText>
            </View>
          </View>

          {/* Creator */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="account"
              size={20}
              color="#00ADB5"
            />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Created By</ThemedText>
              <ThemedText style={styles.detailValue}>
                {creatorDisplayName ?? activity.creatorName}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        {activity.notes ? (
          <View style={styles.notesSection}>
            <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
            <ThemedText style={styles.notesText}>{activity.notes}</ThemedText>
          </View>
        ) : null}
      </ScrollView>

      {/* Join Button - Only show if user is not the creator and activity not full */}
      {!isCreator && user && !isFull && (
        <View style={[styles.joinButtonContainer, { paddingBottom: Math.max(insets.bottom + 16, 20), borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: colors.tint }, joining && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.8}>
            {joining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="account-plus" size={24} color="#fff" />
                <ThemedText style={styles.joinButtonText}>Join Activity</ThemedText>
              </>
            )}
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
    paddingBottom: 100, // Extra padding for join button
  },
  activityHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  videoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsSection: {
    marginBottom: 24,
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
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.6,
    marginTop: 4,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  joinButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
  },
  joinButton: {
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
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
