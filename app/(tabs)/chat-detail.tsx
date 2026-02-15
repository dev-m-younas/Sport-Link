import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToMessages,
  sendMessage,
  getConversationId,
  markMessagesAsRead,
  type MessageDoc,
} from '@/lib/chat';
import { getUserProfile } from '@/lib/userProfile';
import { showToast } from '@/lib/toast';

function MessageBubble({
  message,
  isFromMe,
  isDark,
}: {
  message: MessageDoc;
  isFromMe: boolean;
  isDark: boolean;
}) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View
      style={[
        styles.messageBubble,
        isFromMe ? styles.messageBubbleMe : styles.messageBubbleOther,
      ]}>
      <ThemedText
        style={[
          styles.messageText,
          isFromMe ? styles.messageTextMe : styles.messageTextOther,
        ]}>
        {message.text}
      </ThemedText>
      <ThemedText
        style={[
          styles.messageTime,
          isFromMe ? styles.messageTimeMe : styles.messageTimeOther,
        ]}>
        {formatTime(message.createdAt)}
      </ThemedText>
    </View>
  );
}

export default function ChatDetailScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const otherUserId = params.userId as string;
  const colors = useThemeColors();
  const isDark = colors.background === '#151718';
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUserProfile, setOtherUserProfile] = useState<{
    name: string;
    profileImage?: string;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user || !otherUserId) {
      router.back();
      return;
    }

    loadOtherUserProfile();

    const conversationId = getConversationId(user.uid, otherUserId);
    const unsubscribe = subscribeToMessages(conversationId, user.uid, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, otherUserId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when screen is focused
    if (user && otherUserId && messages.length > 0) {
      const conversationId = getConversationId(user.uid, otherUserId);
      markMessagesAsRead(conversationId, user.uid);
    }
  }, [user, otherUserId, messages]);

  const loadOtherUserProfile = async () => {
    try {
      const profile = await getUserProfile(otherUserId);
      if (profile) {
        setOtherUserProfile({
          name: profile.name,
          profileImage: profile.profileImage,
        });
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      router.back();
    }
  };

  const handleSend = async () => {
    if (!user || !otherUserId || !messageText.trim() || sending) return;

    try {
      setSending(true);
      
      const userProfile = await getUserProfile(user.uid);
      const conversationId = getConversationId(user.uid, otherUserId);

      await sendMessage(
        user,
        otherUserId,
        messageText.trim(),
        {
          name: userProfile?.name || user.displayName || user.email || 'User',
          profileImage: userProfile?.profileImage,
        }
      );

      setMessageText('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      showToast.error('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!otherUserProfile) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading chat...</ThemedText>
        </View>
      </ThemedView>
    );
  }

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
        <View style={styles.headerUser}>
          {otherUserProfile.profileImage ? (
            <Image
              source={{ uri: otherUserProfile.profileImage }}
              style={[styles.headerAvatar, { borderColor: colors.tint }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.chipBg, borderColor: colors.tint }]}>
              <MaterialCommunityIcons name="account" size={20} color={colors.tint} />
            </View>
          )}
          <ThemedText type="title" style={styles.headerName}>
            {otherUserProfile.name}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingMessages}>
              <ActivityIndicator size="small" color="#0a7ea4" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <MaterialCommunityIcons name="message-text-outline" size={48} color="#9BA1A6" />
              <ThemedText style={styles.emptyText}>No messages yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>Start the conversation!</ThemedText>
            </View>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.senderUid === user?.uid && styles.messageWrapperMe,
                ]}>
                <MessageBubble
                  message={message}
                  isFromMe={message.senderUid === user?.uid}
                  isDark={isDark}
                />
              </View>
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom + 8, 16), borderTopColor: colors.border },
          ]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input }]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.tint },
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
            activeOpacity={0.8}>
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 20,
  },
  loadingMessages: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    opacity: 0.8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
  messageWrapper: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageWrapperMe: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleMe: {
    backgroundColor: '#0a7ea4',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#F1F3F4',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#11181C',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeOther: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
