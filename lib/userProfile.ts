import { doc, setDoc, getDoc, collection, getDocs, type Firestore } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";

export type Gender = "male" | "female" | "other";
export type ExpertiseLevel = "beginner" | "intermediate" | "pro";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO date string
  gender: Gender;
  country: string;
  countryCode?: string; // ISO country code (e.g., 'US', 'PK', 'IN')
  city: string;
  activities: string[]; // Selected sports/activities
  expertiseLevel: ExpertiseLevel;
  profileImage?: string; // Profile image URL
  onboardingCompleted: boolean;
  latitude?: number; // User's current location latitude
  longitude?: number; // User's current location longitude
  createdAt: string;
  updatedAt: string;
}

export async function saveUserProfile(
  user: User,
  profileData: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const existingDoc = await getDoc(userRef);

  const now = new Date().toISOString();
  const existingData = existingDoc.exists() ? existingDoc.data() : {};
  
  // Handle profileImage: Firebase doesn't accept undefined, so we only include it if it has a value
  let profileImage: string | undefined;
  if (profileData.profileImage !== undefined && profileData.profileImage !== null && profileData.profileImage !== '') {
    profileImage = profileData.profileImage;
  } else if (existingData.profileImage !== undefined && existingData.profileImage !== null && existingData.profileImage !== '') {
    profileImage = existingData.profileImage;
  }
  // If both are undefined/null/empty, profileImage will remain undefined and won't be included in the document
  
  const profile: any = {
    uid: user.uid,
    name: profileData.name || existingData.name || user.displayName || "",
    email: profileData.email || existingData.email || user.email || "",
    phoneNumber: profileData.phoneNumber || existingData.phoneNumber || "",
    dateOfBirth: profileData.dateOfBirth || existingData.dateOfBirth || "",
    gender: profileData.gender || existingData.gender || "other",
    country: profileData.country || existingData.country || "",
    countryCode: profileData.countryCode || existingData.countryCode || undefined,
    city: profileData.city || existingData.city || "",
    activities: profileData.activities || existingData.activities || [],
    expertiseLevel: profileData.expertiseLevel || existingData.expertiseLevel || "beginner",
    onboardingCompleted: profileData.onboardingCompleted !== undefined 
      ? profileData.onboardingCompleted 
      : (existingData.onboardingCompleted ?? false),
    createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
    updatedAt: now,
  };
  
  // Only add profileImage if it has a value (Firebase doesn't accept undefined)
  if (profileImage !== undefined) {
    profile.profileImage = profileImage;
  }
  
  // Handle latitude and longitude - preserve existing values if not provided
  if (profileData.latitude !== undefined && profileData.latitude !== null) {
    profile.latitude = profileData.latitude;
  } else if (existingData.latitude !== undefined && existingData.latitude !== null) {
    profile.latitude = existingData.latitude;
  }
  
  if (profileData.longitude !== undefined && profileData.longitude !== null) {
    profile.longitude = profileData.longitude;
  } else if (existingData.longitude !== undefined && existingData.longitude !== null) {
    profile.longitude = existingData.longitude;
  }

  await setDoc(userRef, profile, { merge: true });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as UserProfile;
  } catch (error: any) {
    // Handle offline errors gracefully
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Firestore is offline, returning null');
      return null;
    }
    throw error;
  }
}

export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return profile?.onboardingCompleted ?? false;
  } catch (error: any) {
    // If offline or error, default to false (needs onboarding)
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Cannot check onboarding status (offline), defaulting to false');
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

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

export interface NearbyPlayer {
  uid: string;
  name: string;
  profileImage?: string;
  activities: string[];
  expertiseLevel: ExpertiseLevel;
  country: string;
  city: string;
  gender: Gender;
  dateOfBirth: string;
  distance: number; // Distance in km
}

/**
 * Get nearby players within radius
 * Uses users + activities in parallel; builds player list from cached user data (no extra fetches)
 */
export async function getNearbyPlayers(
  userLat: number,
  userLong: number,
  radiusKm: number = 30,
  excludeUserId?: string
): Promise<NearbyPlayer[]> {
  try {
    // Fetch users and activities in parallel
    const [usersSnapshot, activitiesSnapshot] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "activities")),
    ]);

    const userDataMap = new Map<string, Record<string, any>>();
    usersSnapshot.forEach((d) => {
      const data = d.data();
      const uid = (data.uid as string) || d.id;
      userDataMap.set(uid, data);
    });

    const playerMap = new Map<string, { lat: number; long: number }>();

    usersSnapshot.forEach((d) => {
      const data = d.data();
      const uid = (data.uid as string) || d.id;
      if (excludeUserId && (uid === excludeUserId || d.id === excludeUserId)) return;
      const hasLocation =
        data.latitude != null && data.longitude != null;
      if (data.onboardingCompleted && hasLocation) {
        const lat = data.latitude as number;
        const long = data.longitude as number;
        if (haversineDistanceKm(userLat, userLong, lat, long) <= radiusKm) {
          playerMap.set(uid, { lat, long });
        }
      }
    });

    activitiesSnapshot.forEach((d) => {
      const data = d.data();
      const creatorUid = data.creatorUid as string;
      if (excludeUserId && creatorUid === excludeUserId) return;
      if (playerMap.has(creatorUid)) return;
      const creatorLat = data.creatorLat as number;
      const creatorLong = data.creatorLong as number;
      if (haversineDistanceKm(userLat, userLong, creatorLat, creatorLong) <= radiusKm) {
        playerMap.set(creatorUid, { lat: creatorLat, long: creatorLong });
      }
    });

    const players: NearbyPlayer[] = [];
    playerMap.forEach((loc, uid) => {
      const data = userDataMap.get(uid);
      if (!data || !data.onboardingCompleted) return;
      const distance = haversineDistanceKm(userLat, userLong, loc.lat, loc.long);
      players.push({
        uid: (data.uid as string) || uid,
        name: (data.name as string) || "User",
        profileImage: data.profileImage ?? undefined,
        activities: (data.activities as string[]) ?? [],
        expertiseLevel: (data.expertiseLevel as ExpertiseLevel) ?? "beginner",
        country: (data.country as string) ?? "",
        city: (data.city as string) ?? "",
        gender: (data.gender as Gender) ?? "other",
        dateOfBirth: (data.dateOfBirth as string) ?? "",
        distance: Math.round(distance * 10) / 10,
      });
    });

    players.sort((a, b) => a.distance - b.distance);
    return players;
  } catch (error: any) {
    console.error("Error fetching nearby players:", error);
    throw error;
  }
}
