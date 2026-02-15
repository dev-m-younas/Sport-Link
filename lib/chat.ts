import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Generate a consistent conversation ID from two user IDs
 * Always sorts IDs to ensure same conversation ID regardless of order
 */
export function getConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

export interface MessageDoc {
  id: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  senderProfileImage?: string;
  receiverUid: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface ConversationDoc {
  id: string;
  userId1: string;
  userId2: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSenderUid?: string;
  unreadCount?: number;
  updatedAt: string;
}

/**
 * Send a message
 */
export async function sendMessage(
  sender: User,
  receiverUid: string,
  text: string,
  senderProfile?: { name: string; profileImage?: string }
): Promise<string> {
  try {
    if (!text.trim()) {
      throw new Error('Message cannot be empty');
    }

    const conversationId = getConversationId(sender.uid, receiverUid);
    const senderName = senderProfile?.name || sender.displayName || sender.email || 'User';

    // Create/update conversation
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    const conversationData: any = {
      userId1: conversationId.split('_')[0],
      userId2: conversationId.split('_')[1],
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
      lastMessageSenderUid: sender.uid,
      updatedAt: serverTimestamp(),
    };

    if (!conversationSnap.exists()) {
      // New conversation - set unread count for receiver
      conversationData.unreadCount = 1;
    } else {
      const existing = conversationSnap.data();
      // If last message was from receiver, increment unread count for sender
      // Otherwise, increment for receiver
      if (existing.lastMessageSenderUid === receiverUid) {
        conversationData.unreadCount = (existing.unreadCount || 0) + 1;
      } else {
        // Reset unread count for receiver since sender is sending new message
        conversationData.unreadCount = 1;
      }
    }

    await setDoc(conversationRef, conversationData, { merge: true });

    // Create message
    const messageData: any = {
      conversationId,
      senderUid: sender.uid,
      senderName,
      receiverUid,
      text: text.trim(),
      read: false,
      createdAt: serverTimestamp(),
    };

    if (senderProfile?.profileImage) {
      messageData.senderProfileImage = senderProfile.profileImage;
    }

    const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

    // Send push notification to receiver (non-blocking)
    import('./chatPushNotifications').then(({ sendChatPushNotification }) => {
      sendChatPushNotification(receiverUid, senderName, messageText.trim()).catch(() => {});
    });

    return messageRef.id;
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<ConversationDoc[]> {
  try {
    const q1 = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('userId1', '==', userId)
    );
    const q2 = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('userId2', '==', userId)
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
    ]);

    const conversations: ConversationDoc[] = [];

    snapshot1.forEach((docSnap) => {
      const d = docSnap.data();
      const updatedAt = d.updatedAt as Timestamp | null;
      const lastMessageTime = d.lastMessageTime as Timestamp | null;

      conversations.push({
        id: docSnap.id,
        userId1: d.userId1 ?? '',
        userId2: d.userId2 ?? '',
        lastMessage: d.lastMessage ?? '',
        lastMessageTime: lastMessageTime ? lastMessageTime.toDate().toISOString() : undefined,
        lastMessageSenderUid: d.lastMessageSenderUid ?? undefined,
        unreadCount: d.unreadCount ?? 0,
        updatedAt: updatedAt ? updatedAt.toDate().toISOString() : '',
      });
    });

    snapshot2.forEach((docSnap) => {
      const d = docSnap.data();
      const updatedAt = d.updatedAt as Timestamp | null;
      const lastMessageTime = d.lastMessageTime as Timestamp | null;

      conversations.push({
        id: docSnap.id,
        userId1: d.userId1 ?? '',
        userId2: d.userId2 ?? '',
        lastMessage: d.lastMessage ?? '',
        lastMessageTime: lastMessageTime ? lastMessageTime.toDate().toISOString() : undefined,
        lastMessageSenderUid: d.lastMessageSenderUid ?? undefined,
        unreadCount: d.unreadCount ?? 0,
        updatedAt: updatedAt ? updatedAt.toDate().toISOString() : '',
      });
    });

    // Sort by updatedAt descending (most recent first)
    conversations.sort((a, b) => {
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Subscribe to messages in a conversation (real-time updates)
 * Single query - requires index: conversationId (ASC) + createdAt (ASC)
 */
export function subscribeToMessages(
  conversationId: string,
  _userId: string,
  callback: (messages: MessageDoc[]) => void
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: MessageDoc[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const createdAt = d.createdAt as Timestamp | null;
        messages.push({
          id: docSnap.id,
          conversationId: (d.conversationId ?? '') as string,
          senderUid: (d.senderUid ?? '') as string,
          senderName: (d.senderName ?? 'User') as string,
          senderProfileImage: d.senderProfileImage as string | undefined,
          receiverUid: (d.receiverUid ?? '') as string,
          text: (d.text ?? '') as string,
          read: (d.read ?? false) as boolean,
          createdAt: createdAt ? createdAt.toDate().toISOString() : '',
        });
      });
      callback(messages);
    },
    (err) => {
      console.warn('Chat listener error:', err?.code, err?.message);
      callback([]);
    }
  );
}

/**
 * Get messages for a conversation (one-time fetch)
 */
export async function getMessages(conversationId: string): Promise<MessageDoc[]> {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const messages: MessageDoc[] = [];

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const createdAt = d.createdAt as Timestamp | null;

      messages.push({
        id: docSnap.id,
        conversationId: d.conversationId ?? '',
        senderUid: d.senderUid ?? '',
        senderName: d.senderName ?? 'User',
        senderProfileImage: d.senderProfileImage ?? undefined,
        receiverUid: d.receiverUid ?? '',
        text: d.text ?? '',
        read: d.read ?? false,
        createdAt: createdAt ? createdAt.toDate().toISOString() : '',
      });
    });

    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      where('receiverUid', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = snapshot.docs.map((docSnap) => {
      return doc(db, MESSAGES_COLLECTION, docSnap.id);
    });

    // Update each message
    await Promise.all(
      batch.map((docRef) => updateDoc(docRef, { read: true }))
    );

    // Update conversation unread count
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, { unreadCount: 0 });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    // Don't throw - this is not critical
  }
}
