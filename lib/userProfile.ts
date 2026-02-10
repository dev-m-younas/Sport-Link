import { doc, setDoc, getDoc, type Firestore } from "firebase/firestore";
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
  city: string;
  activities: string[]; // Selected sports/activities
  expertiseLevel: ExpertiseLevel;
  onboardingCompleted: boolean;
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
  const profile: UserProfile = {
    uid: user.uid,
    name: profileData.name || user.displayName || "",
    email: profileData.email || user.email || "",
    phoneNumber: profileData.phoneNumber || "",
    dateOfBirth: profileData.dateOfBirth || "",
    gender: profileData.gender || "other",
    country: profileData.country || "",
    city: profileData.city || "",
    activities: profileData.activities || [],
    expertiseLevel: profileData.expertiseLevel || "beginner",
    onboardingCompleted: profileData.onboardingCompleted ?? false,
    createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
    updatedAt: now,
  };

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
