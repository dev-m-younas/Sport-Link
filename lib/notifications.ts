import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

const NOTIFICATIONS_COLLECTION = 'notifications';

export type NotificationType = 'join_request';

export type NotificationStatus = 'pending' | 'accepted' | 'declined';

export interface NotificationDoc {
  id: string;
  recipientUid: string; // User who receives the notification (activity creator)
  senderUid: string; // User who sent the request (person wanting to join)
  senderName: string;
  senderProfileImage?: string;
  activityId: string;
  activityName: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJoinRequestInput {
  activityId: string;
  activityName: string;
  recipientUid: string; // Activity creator's UID
  senderUid: string; // User requesting to join
  senderName: string;
  senderProfileImage?: string;
}

/**
 * Create a join request notification
 */
export async function createJoinRequest(
  input: CreateJoinRequestInput
): Promise<string> {
  try {
    // Check if a pending request already exists
    const existingQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientUid', '==', input.recipientUid),
      where('senderUid', '==', input.senderUid),
      where('activityId', '==', input.activityId),
      where('status', '==', 'pending')
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('You have already sent a join request for this activity');
    }

    const notificationData: any = {
      recipientUid: input.recipientUid,
      senderUid: input.senderUid,
      senderName: input.senderName,
      activityId: input.activityId,
      activityName: input.activityName,
      type: 'join_request' as NotificationType,
      status: 'pending' as NotificationStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only include senderProfileImage if it exists
    if (input.senderProfileImage) {
      notificationData.senderProfileImage = input.senderProfileImage;
    }

    const ref = await addDoc(
      collection(db, NOTIFICATIONS_COLLECTION),
      notificationData
    );

    // Send push notification to recipient
    import('./chatPushNotifications').then(({ sendJoinRequestPushNotification }) => {
      sendJoinRequestPushNotification(
        input.recipientUid,
        input.senderName,
        input.activityName
      ).catch(() => {});
    });

    return ref.id;
  } catch (error: any) {
    console.error('Error creating join request:', error);
    throw error;
  }
}

/**
 * Get all notifications for a user (recipient)
 */
export async function getUserNotifications(
  userId: string
): Promise<NotificationDoc[]> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientUid', '==', userId)
    );
    const snapshot = await getDocs(q);
    const notifications: NotificationDoc[] = [];
    
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const createdAt = d.createdAt as Timestamp | null;
      const updatedAt = d.updatedAt as Timestamp | null;
      
      notifications.push({
        id: docSnap.id,
        recipientUid: d.recipientUid ?? '',
        senderUid: d.senderUid ?? '',
        senderName: d.senderName ?? 'User',
        senderProfileImage: d.senderProfileImage ?? undefined,
        activityId: d.activityId ?? '',
        activityName: d.activityName ?? '',
        type: (d.type as NotificationType) ?? 'join_request',
        status: (d.status as NotificationStatus) ?? 'pending',
        createdAt: createdAt ? createdAt.toDate().toISOString() : '',
        updatedAt: updatedAt ? updatedAt.toDate().toISOString() : '',
      });
    });
    
    // Sort by createdAt descending (newest first)
    notifications.sort((a, b) => {
      return b.createdAt.localeCompare(a.createdAt);
    });
    
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Accept a join request
 * Adds participant; when required members join, creates scheduled activities for ALL
 */
export async function acceptJoinRequest(
  notificationId: string,
  recipientUser?: { uid: string; name: string; profileImage?: string }
): Promise<void> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const notificationSnap = await getDoc(notificationRef);

    if (!notificationSnap.exists()) {
      throw new Error('Notification not found');
    }

    const notificationData = notificationSnap.data();

    await updateDoc(notificationRef, {
      status: 'accepted' as NotificationStatus,
      updatedAt: serverTimestamp(),
    });

    if (!recipientUser) return;

    const { addParticipant, getActivityParticipants } = await import('./activityParticipants');
    const { createScheduledActivityForAllParticipants } = await import('./scheduledActivities');
    const { getActivityById } = await import('./activities');

    await addParticipant(
      notificationData.activityId,
      notificationData.senderUid,
      notificationData.senderName,
      notificationData.senderProfileImage,
    );

    const participants = await getActivityParticipants(notificationData.activityId);
    const activity = await getActivityById(notificationData.activityId);
    const requiredMembers = activity?.requiredMembers ?? 1;
    const isFull = participants.length >= requiredMembers;

    if (isFull) {
      await createScheduledActivityForAllParticipants(
        notificationData.activityId,
        notificationData.recipientUid,
        recipientUser.name,
        recipientUser.profileImage,
        participants.map((p) => ({
          userId: p.userId,
          userName: p.userName,
          userProfileImage: p.userProfileImage,
        })),
      );
    }
  } catch (error) {
    console.error('Error accepting join request:', error);
    throw error;
  }
}

/**
 * Decline a join request
 */
export async function declineJoinRequest(
  notificationId: string
): Promise<void> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      status: 'declined' as NotificationStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error declining join request:', error);
    throw error;
  }
}

/**
 * Get a notification by ID
 */
export async function getNotificationById(
  notificationId: string
): Promise<NotificationDoc | null> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const d = docSnap.data();
    const createdAt = d.createdAt as Timestamp | null;
    const updatedAt = d.updatedAt as Timestamp | null;
    
    return {
      id: docSnap.id,
      recipientUid: d.recipientUid ?? '',
      senderUid: d.senderUid ?? '',
      senderName: d.senderName ?? 'User',
      senderProfileImage: d.senderProfileImage ?? undefined,
      activityId: d.activityId ?? '',
      activityName: d.activityName ?? '',
      type: (d.type as NotificationType) ?? 'join_request',
      status: (d.status as NotificationStatus) ?? 'pending',
      createdAt: createdAt ? createdAt.toDate().toISOString() : '',
      updatedAt: updatedAt ? updatedAt.toDate().toISOString() : '',
    };
  } catch (error) {
    console.error('Error fetching notification by ID:', error);
    throw error;
  }
}
