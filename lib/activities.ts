import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

const ACTIVITIES_COLLECTION = 'activities';
const RADIUS_KM = 15;

/** Distance between two points (lat/long) in km - Haversine formula */
function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface ActivityCreateInput {
  activity: string;
  level: string;
  date: string;
  time: string;
  /** Venue/place name user types (e.g. "Central Park Ground", "F-9 Park") */
  location: string;
  /** Activity location coordinates (from geocoding the address) */
  locationLat: number;
  locationLong: number;
  notes?: string;
  videoUri?: string | null;
  /** Creator's current position - for 15km radius filter */
  creatorLat: number;
  creatorLong: number;
  /** Creator's display name from profile (preferred over Auth) */
  creatorName?: string;
}

export interface ActivityDoc {
  id: string;
  creatorUid: string;
  creatorName: string;
  creatorEmail: string | null;
  creatorLat: number;
  creatorLong: number;
  location: string;
  locationLat: number;
  locationLong: number;
  activity: string;
  level: string;
  date: string;
  time: string;
  notes: string;
  videoUri: string | null;
  createdAt: string;
}

export async function saveActivity(
  user: User,
  input: ActivityCreateInput
): Promise<string> {
  try {
    // Validate user is authenticated
    if (!user || !user.uid) {
      throw new Error('User must be authenticated to create activity');
    }
    
    console.log('Saving activity with creatorUid:', user.uid);
    
    const activityData: any = {
      creatorUid: user.uid, // Must match request.auth.uid for security rules
      creatorName: input.creatorName?.trim() || user.displayName || user.email || 'User',
      creatorEmail: user.email || null,
      creatorLat: input.creatorLat,
      creatorLong: input.creatorLong,
      location: input.location.trim(),
      locationLat: input.locationLat,
      locationLong: input.locationLong,
      activity: input.activity,
      level: input.level,
      date: input.date,
      time: input.time,
      notes: (input.notes || '').trim(),
      createdAt: serverTimestamp(),
    };
    
    // Only include videoUri if it has a value (Firebase doesn't accept undefined)
    if (input.videoUri !== undefined && input.videoUri !== null && input.videoUri.trim() !== '') {
      activityData.videoUri = input.videoUri;
    } else {
      activityData.videoUri = null;
    }
    
    console.log('Activity data to save:', {
      creatorUid: activityData.creatorUid,
      activity: activityData.activity,
      location: activityData.location,
    });
    
    const ref = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData);
    console.log('Activity saved successfully with ID:', ref.id);
    return ref.id;
  } catch (error: any) {
    console.error('Error saving activity:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    throw error;
  }
}

const ACTIVITIES_FETCH_LIMIT = 50;

export async function getActivitiesWithinRadius(
  userLat: number,
  userLong: number,
  radiusKm: number = RADIUS_KM,
  excludeUserId?: string
): Promise<ActivityDoc[]> {
  const q = query(
    collection(db, ACTIVITIES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(ACTIVITIES_FETCH_LIMIT)
  );
  const snapshot = await getDocs(q);
  const list: ActivityDoc[] = [];
  snapshot.forEach((doc) => {
    const d = doc.data();
    const creatorUid = d.creatorUid ?? '';
    
    // Exclude user's own activities if excludeUserId is provided
    if (excludeUserId && creatorUid === excludeUserId) {
      return;
    }
    
    const creatorLat = d.creatorLat as number;
    const creatorLong = d.creatorLong as number;
    const activityLat = d.locationLat as number | undefined;
    const activityLong = d.locationLong as number | undefined;
    // Use activity location if available, otherwise use creator location
    const lat = activityLat ?? creatorLat;
    const lon = activityLong ?? creatorLong;
    
    const distance = haversineDistanceKm(
      userLat,
      userLong,
      lat,
      lon
    );
    if (distance <= radiusKm) {
      const createdAt = d.createdAt as Timestamp | null;
      list.push({
        id: doc.id,
        creatorUid,
        creatorName: d.creatorName ?? 'User',
        creatorEmail: d.creatorEmail ?? null,
        creatorLat,
        creatorLong,
        location: d.location ?? '',
        locationLat: (d.locationLat as number | undefined) ?? creatorLat,
        locationLong: (d.locationLong as number | undefined) ?? creatorLong,
        activity: d.activity ?? '',
        level: d.level ?? '',
        date: d.date ?? '',
        time: d.time ?? '',
        notes: d.notes ?? '',
        videoUri: d.videoUri ?? null,
        createdAt: createdAt ? createdAt.toDate().toISOString() : '',
      });
    }
  });
  list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  return list;
}

export async function getUserActivities(userId: string): Promise<ActivityDoc[]> {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('creatorUid', '==', userId)
    );
    const snapshot = await getDocs(q);
    const list: ActivityDoc[] = [];
    snapshot.forEach((doc) => {
      const d = doc.data();
      const createdAt = d.createdAt as Timestamp | null;
      list.push({
        id: doc.id,
        creatorUid: d.creatorUid ?? '',
        creatorName: d.creatorName ?? 'User',
        creatorEmail: d.creatorEmail ?? null,
        creatorLat: d.creatorLat ?? 0,
        creatorLong: d.creatorLong ?? 0,
        location: d.location ?? '',
        locationLat: d.locationLat ?? d.creatorLat ?? 0,
        locationLong: d.locationLong ?? d.creatorLong ?? 0,
        activity: d.activity ?? '',
        level: d.level ?? '',
        date: d.date ?? '',
        time: d.time ?? '',
        notes: d.notes ?? '',
        videoUri: d.videoUri ?? null,
        createdAt: createdAt ? createdAt.toDate().toISOString() : '',
      });
    });
    list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return list;
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
}

export async function getActivityById(activityId: string): Promise<ActivityDoc | null> {
  try {
    const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const d = docSnap.data();
    const createdAt = d.createdAt as Timestamp | null;
    
    return {
      id: docSnap.id,
      creatorUid: d.creatorUid ?? '',
      creatorName: d.creatorName ?? 'User',
      creatorEmail: d.creatorEmail ?? null,
      creatorLat: d.creatorLat ?? 0,
      creatorLong: d.creatorLong ?? 0,
      location: d.location ?? '',
      locationLat: d.locationLat ?? d.creatorLat ?? 0,
      locationLong: d.locationLong ?? d.creatorLong ?? 0,
      activity: d.activity ?? '',
      level: d.level ?? '',
      date: d.date ?? '',
      time: d.time ?? '',
      notes: d.notes ?? '',
      videoUri: d.videoUri ?? null,
      createdAt: createdAt ? createdAt.toDate().toISOString() : '',
    };
  } catch (error) {
    console.error('Error fetching activity by ID:', error);
    throw error;
  }
}
