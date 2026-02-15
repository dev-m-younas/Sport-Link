import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
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
  getUserNotifications,
  acceptJoinRequest,
  declineJoinRequest,
  type NotificationDoc,
} from '@/lib/notifications';
import { showToast } from '@/lib/toast';

function NotificationItem({
  notification,
  isDark,
  colors,
  onAccept,
  onDecline,
  onPress,
}: {
  notification: NotificationDoc;
  isDark: boolean;
  colors: ReturnType<typeof useThemeColors>;
  onAccept: () => void;
  onDecline: () => void;
  onPress: () => void;
}) {
  const isPending = notification.status === 'pending';
  const isAccepted = notification.status === 'accepted';
  const isDeclined = notification.status === 'declined';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[styles.notificationCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.notificationHeader}>
        {notification.senderProfileImage ? (
          <Image
            source={{ uri: notification.senderProfileImage }}
            style={[styles.avatar, { borderColor: colors.tint }]}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.chipBg, borderColor: colors.tint }]}>
            <MaterialCommunityIcons name="account" size={24} color={colors.tint} />
          </View>
        )}
        <View style={styles.notificationContent}>
          <ThemedText style={styles.notificationTitle}>
            {notification.senderName} wants to join
          </ThemedText>
          <ThemedText style={styles.notificationActivity}>
            {notification.activityName}
          </ThemedText>
          <ThemedText style={styles.notificationTime}>
            {formatDate(notification.createdAt)}
          </ThemedText>
        </View>
        {isPending && (
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={colors.tint}
          />
        )}
        {isAccepted && (
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
        )}
        {isDeclined && (
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
        )}
      </View>

      {isPending && (
        <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={onAccept}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="check" size={18} color="#fff" />
            <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton, { backgroundColor: colors.error }]}
            onPress={onDecline}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
            <ThemedText style={styles.declineButtonText}>Decline</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const isDark = colors.background === '#151718';
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const notifs = await getUserNotifications(user.uid);
      setNotifications(notifs);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      showToast.error('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleAccept = async (notification: NotificationDoc) => {
    if (!user || processingId) return;

    try {
      setProcessingId(notification.id);
      
      // Get user profile for scheduled activity creation
      const { getUserProfile } = await import('@/lib/userProfile');
      const userProfile = await getUserProfile(user.uid);
      
      await acceptJoinRequest(notification.id, {
        uid: user.uid,
        name: userProfile?.name || user.displayName || user.email || 'User',
        profileImage: userProfile?.profileImage,
      });
      
      showToast.success('Accepted', `${notification.senderName} can now join the activity`);
      await loadNotifications();
    } catch (error: any) {
      console.error('Error accepting request:', error);
      showToast.error('Error', 'Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (notification: NotificationDoc) => {
    if (!user || processingId) return;

    try {
      setProcessingId(notification.id);
      await declineJoinRequest(notification.id);
      showToast.success('Declined', 'Join request declined');
      await loadNotifications();
    } catch (error: any) {
      console.error('Error declining request:', error);
      showToast.error('Error', 'Failed to decline request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotificationPress = (notification: NotificationDoc) => {
    router.push({
      pathname: '/(tabs)/player-detail',
      params: { id: notification.senderUid },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24), borderBottomColor: colors.border }]}>
        <ThemedText type="title">Notifications</ThemedText>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading notifications...</ThemedText>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="bell-outline" size={64} color={colors.icon} />
          <ThemedText style={styles.emptyTitle}>No notifications</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            You're all caught up!
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
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isDark={isDark}
              colors={colors}
              onAccept={() => handleAccept(notification)}
              onDecline={() => handleDecline(notification)}
              onPress={() => handleNotificationPress(notification)}
            />
          ))}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  notificationActivity: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acceptButton: {},
  declineButton: {},
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
