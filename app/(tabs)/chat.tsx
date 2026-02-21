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
import { subscribeToUserConversations, getUserConversations, type ConversationDoc } from '@/lib/chat';
import { getUserProfile } from '@/lib/userProfile';
import { showToast } from '@/lib/toast';

function ConversationItem({
  conversation,
  currentUserId,
  isDark,
  colors,
  onPress,
}: {
  conversation: ConversationDoc;
  currentUserId: string;
  isDark: boolean;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const [otherUserProfile, setOtherUserProfile] = useState<{
    name: string;
    profileImage?: string;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const otherUserId = conversation.userId1 === currentUserId 
    ? conversation.userId2 
    : conversation.userId1;

  useEffect(() => {
    loadOtherUserProfile();
  }, [otherUserId]);

  const loadOtherUserProfile = async () => {
    try {
      const profile = await getUserProfile(otherUserId);
      if (profile) {
        setOtherUserProfile({
          name: profile.name,
          profileImage: profile.profileImage,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
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

  const isFromMe = conversation.lastMessageSenderUid === currentUserId;
  const myUnreadCount = !isFromMe ? (conversation.unreadCount ?? 0) : 0;
  const displayName = otherUserProfile?.name || 'User';
  const displayImage = otherUserProfile?.profileImage;

  return (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.conversationHeader}>
        {displayImage ? (
          <Image
            source={{ uri: displayImage }}
            style={[styles.avatar, { borderColor: colors.tint }]}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.chipBg, borderColor: colors.tint }]}>
            <MaterialCommunityIcons name="account" size={24} color={colors.tint} />
          </View>
        )}
        <View style={styles.conversationContent}>
          <View style={styles.conversationTitleRow}>
            <ThemedText style={styles.conversationName} numberOfLines={1}>
              {displayName}
            </ThemedText>
            {conversation.lastMessageTime && (
              <ThemedText style={styles.conversationTime}>
                {formatDate(conversation.lastMessageTime)}
              </ThemedText>
            )}
          </View>
          <View style={styles.lastMessageRow}>
            <ThemedText 
              style={[
                styles.lastMessage,
                isFromMe && styles.lastMessageFromMe,
              ]}
              numberOfLines={1}>
              {isFromMe ? 'You: ' : ''}{conversation.lastMessage || 'No messages yet'}
            </ThemedText>
            {myUnreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.tint }]}>
                <ThemedText style={styles.unreadText}>
                  {myUnreadCount > 9 ? '9+' : myUnreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const isDark = colors.background === '#222831';
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const unsub = subscribeToUserConversations(user.uid, (convos) => {
        setConversations(convos);
        setLoading(false);
      });
      return () => unsub();
    }, [user?.uid])
  );

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    try {
      const convos = await getUserConversations(user.uid);
      setConversations(convos);
    } catch {
      // Subscription will keep data fresh
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid]);

  const handleConversationPress = (conversation: ConversationDoc) => {
    const otherUserId = conversation.userId1 === user?.uid 
      ? conversation.userId2 
      : conversation.userId1;
    
    router.push({
      pathname: '/(tabs)/chat-detail',
      params: { userId: otherUserId },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 24), borderBottomColor: colors.border }]}>
        <ThemedText type="title">Chat</ThemedText>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading conversations...</ThemedText>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="message-text" size={64} color={colors.icon} />
          <ThemedText style={styles.emptyTitle}>No messages yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Start chatting with other users from activities!
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
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={user!.uid}
              isDark={isDark}
              colors={colors}
              onPress={() => handleConversationPress(conversation)}
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
  conversationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 8,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  lastMessageFromMe: {
    opacity: 0.6,
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
