import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getActivityById } from "./activities";
import { createScheduledActivityForAllParticipants } from "./scheduledActivities";

const PARTICIPANTS_COLLECTION = "activityParticipants";

export interface ActivityParticipantDoc {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  status: "accepted";
  createdAt: string;
}

/**
 * Add a participant when creator accepts a join request
 */
export async function addParticipant(
  activityId: string,
  userId: string,
  userName: string,
  userProfileImage?: string
): Promise<{ isFull: boolean; shouldCreateScheduled: boolean }> {
  // Check if already added
  const existing = query(
    collection(db, PARTICIPANTS_COLLECTION),
    where("activityId", "==", activityId),
    where("userId", "==", userId)
  );
  const existingSnap = await getDocs(existing);
  if (!existingSnap.empty) {
    return { isFull: false, shouldCreateScheduled: false };
  }

  await addDoc(collection(db, PARTICIPANTS_COLLECTION), {
    activityId,
    userId,
    userName,
    userProfileImage: userProfileImage || null,
    status: "accepted",
    createdAt: serverTimestamp(),
  });

  const activity = await getActivityById(activityId);
  if (!activity) return { isFull: false, shouldCreateScheduled: false };

  const requiredMembers = activity.requiredMembers ?? 1;
  const participants = await getActivityParticipants(activityId);
  const joinedCount = participants.length;

  const isFull = joinedCount >= requiredMembers;
  return { isFull, shouldCreateScheduled: isFull };
}

/**
 * Get all accepted participants for an activity
 */
export async function getActivityParticipants(
  activityId: string
): Promise<ActivityParticipantDoc[]> {
  const q = query(
    collection(db, PARTICIPANTS_COLLECTION),
    where("activityId", "==", activityId),
    where("status", "==", "accepted")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const d = docSnap.data();
    const createdAt = d.createdAt as Timestamp | null;
    return {
      id: docSnap.id,
      activityId: d.activityId ?? "",
      userId: d.userId ?? "",
      userName: d.userName ?? "User",
      userProfileImage: d.userProfileImage ?? undefined,
      status: "accepted" as const,
      createdAt: createdAt ? createdAt.toDate().toISOString() : "",
    };
  });
}

/**
 * Get joined count for an activity (for display)
 */
export async function getJoinedCount(activityId: string): Promise<number> {
  const participants = await getActivityParticipants(activityId);
  return participants.length;
}
