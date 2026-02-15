import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { getActivityById, type ActivityDoc } from './activities';

const SCHEDULED_ACTIVITIES_COLLECTION = 'scheduledActivities';

export interface ScheduledActivityDoc {
  id: string;
  activityId: string;
  userId: string; // User who has this scheduled
  partnerUserId: string; // The other user in this scheduled activity
  partnerName: string;
  partnerProfileImage?: string;
  activityName: string;
  activityDate: string; // ISO date string
  activityTime: string; // ISO time string
  location: string;
  locationLat: number;
  locationLong: number;
  level: string;
  notes?: string;
  notificationSent: boolean; // Whether 1-hour notification has been sent
  notificationId?: string; // Local notification ID
  createdAt: string;
}

export interface CreateScheduledActivityInput {
  activityId: string;
  userId1: string; // Activity creator
  userId2: string; // User who joined
  user1Name: string;
  user2Name: string;
  user1ProfileImage?: string;
  user2ProfileImage?: string;
}

/**
 * Create scheduled activities for both users when join request is accepted
 */
export async function createScheduledActivityForBothUsers(
  input: CreateScheduledActivityInput
): Promise<void> {
  try {
    // Get activity details
    const activity = await getActivityById(input.activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    const now = new Date().toISOString();

    // Create scheduled activity for User 1 (creator)
    const scheduledActivity1: any = {
      activityId: input.activityId,
      userId: input.userId1,
      partnerUserId: input.userId2,
      partnerName: input.user2Name,
      activityName: activity.activity,
      activityDate: activity.date,
      activityTime: activity.time,
      location: activity.location,
      locationLat: activity.locationLat,
      locationLong: activity.locationLong,
      level: activity.level,
      notes: activity.notes || undefined,
      notificationSent: false,
      notificationId: undefined,
      createdAt: serverTimestamp(),
    };

    if (input.user2ProfileImage) {
      scheduledActivity1.partnerProfileImage = input.user2ProfileImage;
    }

    // Create scheduled activity for User 2 (joiner)
    const scheduledActivity2: any = {
      activityId: input.activityId,
      userId: input.userId2,
      partnerUserId: input.userId1,
      partnerName: input.user1Name,
      activityName: activity.activity,
      activityDate: activity.date,
      activityTime: activity.time,
      location: activity.location,
      locationLat: activity.locationLat,
      locationLong: activity.locationLong,
      level: activity.level,
      notes: activity.notes || undefined,
      notificationSent: false,
      notificationId: undefined,
      createdAt: serverTimestamp(),
    };

    if (input.user1ProfileImage) {
      scheduledActivity2.partnerProfileImage = input.user1ProfileImage;
    }

    // Check if scheduled activity already exists to avoid duplicates
    const existingQuery1 = query(
      collection(db, SCHEDULED_ACTIVITIES_COLLECTION),
      where('activityId', '==', input.activityId),
      where('userId', '==', input.userId1)
    );
    const existingQuery2 = query(
      collection(db, SCHEDULED_ACTIVITIES_COLLECTION),
      where('activityId', '==', input.activityId),
      where('userId', '==', input.userId2)
    );

    const [existing1, existing2] = await Promise.all([
      getDocs(existingQuery1),
      getDocs(existingQuery2),
    ]);

    // Only create if they don't already exist
    let scheduled1: ScheduledActivityDoc | null = null;
    let scheduled2: ScheduledActivityDoc | null = null;

    if (existing1.empty) {
      const ref1 = await addDoc(collection(db, SCHEDULED_ACTIVITIES_COLLECTION), scheduledActivity1);
      scheduled1 = {
        id: ref1.id,
        ...scheduledActivity1,
        createdAt: new Date().toISOString(),
      } as ScheduledActivityDoc;
    }

    if (existing2.empty) {
      const ref2 = await addDoc(collection(db, SCHEDULED_ACTIVITIES_COLLECTION), scheduledActivity2);
      scheduled2 = {
        id: ref2.id,
        ...scheduledActivity2,
        createdAt: new Date().toISOString(),
      } as ScheduledActivityDoc;
    }

    // Schedule notifications for both users
    const { scheduleActivityNotification } = await import('./activityNotifications');
    if (scheduled1) {
      await scheduleActivityNotification(scheduled1);
    }
    if (scheduled2) {
      await scheduleActivityNotification(scheduled2);
    }
  } catch (error: any) {
    console.error('Error creating scheduled activities:', error);
    throw error;
  }
}

/**
 * Get all scheduled activities for a user
 */
export async function getUserScheduledActivities(
  userId: string
): Promise<ScheduledActivityDoc[]> {
  try {
    const q = query(
      collection(db, SCHEDULED_ACTIVITIES_COLLECTION),
      where('userId', '==', userId),
      orderBy('activityDate', 'asc'),
      orderBy('activityTime', 'asc')
    );

    const snapshot = await getDocs(q);
    const scheduledActivities: ScheduledActivityDoc[] = [];

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const createdAt = d.createdAt as Timestamp | null;

      scheduledActivities.push({
        id: docSnap.id,
        activityId: d.activityId ?? '',
        userId: d.userId ?? '',
        partnerUserId: d.partnerUserId ?? '',
        partnerName: d.partnerName ?? 'User',
        partnerProfileImage: d.partnerProfileImage ?? undefined,
        activityName: d.activityName ?? '',
        activityDate: d.activityDate ?? '',
        activityTime: d.activityTime ?? '',
        location: d.location ?? '',
        locationLat: d.locationLat ?? 0,
        locationLong: d.locationLong ?? 0,
        level: d.level ?? '',
        notes: d.notes ?? undefined,
        notificationSent: d.notificationSent ?? false,
        notificationId: d.notificationId ?? undefined,
        createdAt: createdAt ? createdAt.toDate().toISOString() : '',
      });
    });

    // Sort by date and time
    scheduledActivities.sort((a, b) => {
      const dateA = new Date(`${a.activityDate}T${a.activityTime}`);
      const dateB = new Date(`${b.activityDate}T${b.activityTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    return scheduledActivities;
  } catch (error) {
    console.error('Error fetching scheduled activities:', error);
    throw error;
  }
}

/**
 * Get activities that need notification (1 hour before)
 * This would typically be called by a scheduled job/cloud function
 */
export async function getActivitiesNeedingNotification(): Promise<ScheduledActivityDoc[]> {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    const q = query(
      collection(db, SCHEDULED_ACTIVITIES_COLLECTION),
      where('notificationSent', '==', false)
    );

    const snapshot = await getDocs(q);
    const activities: ScheduledActivityDoc[] = [];

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const createdAt = d.createdAt as Timestamp | null;

      const activityDateTime = new Date(`${d.activityDate}T${d.activityTime}`);
      
      // Check if activity is within 1 hour
      if (activityDateTime >= now && activityDateTime <= oneHourLater) {
        activities.push({
          id: docSnap.id,
          activityId: d.activityId ?? '',
          userId: d.userId ?? '',
          partnerUserId: d.partnerUserId ?? '',
          partnerName: d.partnerName ?? 'User',
          partnerProfileImage: d.partnerProfileImage ?? undefined,
          activityName: d.activityName ?? '',
          activityDate: d.activityDate ?? '',
          activityTime: d.activityTime ?? '',
          location: d.location ?? '',
          locationLat: d.locationLat ?? 0,
          locationLong: d.locationLong ?? 0,
          level: d.level ?? '',
          notes: d.notes ?? undefined,
          notificationSent: d.notificationSent ?? false,
          notificationId: d.notificationId ?? undefined,
          createdAt: createdAt ? createdAt.toDate().toISOString() : '',
        });
      }
    });

    return activities;
  } catch (error) {
    console.error('Error fetching activities needing notification:', error);
    throw error;
  }
}
