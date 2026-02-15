import Constants from 'expo-constants';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const PROJECT_ID = 'e43b4585-40f0-4c72-b5d5-8387432f0972';

/**
 * Save user's Expo push token to Firestore (for push notifications)
 * Skip in Expo Go - push not supported
 */
export async function savePushToken(userId: string): Promise<void> {
  if (Constants.appOwnership === 'expo') return;
  try {
    const mod = await import('expo-notifications');
    const { getExpoPushTokenAsync } = mod;
    const { requestNotificationPermissions } = await import('./activityNotifications');
    const granted = await requestNotificationPermissions();
    if (!granted) return;
    const tokenData = await getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? PROJECT_ID,
    });
    const token = tokenData?.data;
    if (!token) return;
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { pushToken: token }, { merge: true });
  } catch (e) {
    // Ignore - push tokens optional
  }
}

/**
 * Get receiver's push token from Firestore
 */
async function getPushToken(userId: string): Promise<string | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const data = snap.data();
    return (data?.pushToken as string) || null;
  } catch {
    return null;
  }
}

/**
 * Send push notification to receiver when they get a new chat message
 */
export async function sendChatPushNotification(
  receiverUid: string,
  senderName: string,
  messageText: string
): Promise<void> {
  if (Constants.appOwnership === 'expo') return;
  try {
    const token = await getPushToken(receiverUid);
    if (!token) return;
    const body = messageText.length > 80 ? messageText.slice(0, 77) + '...' : messageText;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: senderName,
        body,
        sound: 'default',
        channelId: 'chat',
        data: { type: 'chat', receiverUid },
      }),
    });
  } catch (e) {
    // Fail silently
  }
}

/**
 * Send push notification when someone sends a join activity request
 */
export async function sendJoinRequestPushNotification(
  recipientUid: string,
  senderName: string,
  activityName: string
): Promise<void> {
  if (Constants.appOwnership === 'expo') return;
  try {
    const token = await getPushToken(recipientUid);
    if (!token) return;
    const body = `${senderName} wants to join: ${activityName}`;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: 'Join Activity Request',
        body,
        sound: 'default',
        channelId: 'join-request',
        data: { type: 'join_request', recipientUid },
      }),
    });
  } catch (e) {
    // Fail silently
  }
}
