import Constants from 'expo-constants';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const PROJECT_ID = 'e43b4585-40f0-4c72-b5d5-8387432f0972';

/**
 * Get push token for current device (Expo/FCM). Returns null in Expo Go or on failure.
 */
export async function getPushToken(): Promise<string | null> {
  if (Constants.appOwnership === 'expo') {
    if (__DEV__) console.warn('[Push] Skipped: Expo Go does not support push notifications. Use EAS build.');
    return null;
  }
  try {
    const { requestNotificationPermissions } = await import('./activityNotifications');
    const granted = await requestNotificationPermissions();
    if (!granted) {
      if (__DEV__) console.warn('[Push] Permission denied');
      return null;
    }
    const mod = await import('expo-notifications');
    const { getExpoPushTokenAsync } = mod;
    const tokenData = await getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? PROJECT_ID,
    });
    const token = tokenData?.data ?? null;
    if (__DEV__ && token) console.log('[Push] Token obtained');
    return token;
  } catch (e) {
    if (__DEV__) console.warn('[Push] getPushToken failed:', e);
    return null;
  }
}

/**
 * Save push token to users collection. Call after profile exists.
 */
export async function savePushToken(userId: string): Promise<boolean> {
  const token = await getPushToken();
  if (!token) return false;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { pushToken: token }, { merge: true });
    if (__DEV__) console.log('[Push] Token saved for user', userId.slice(0, 8) + '...');
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[Push] savePushToken failed:', e);
    return false;
  }
}

/**
 * Get receiver's push token from Firestore
 */
async function getReceiverPushToken(userId: string): Promise<string | null> {
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
  senderUid: string,
  senderName: string,
  messageText: string
): Promise<void> {
  if (Constants.appOwnership === 'expo') return;
  try {
    const token = await getReceiverPushToken(receiverUid);
    if (!token) {
      if (__DEV__) console.warn('[Push] No token for receiver', receiverUid.slice(0, 8) + '...');
      return;
    }
    const body = messageText.length > 80 ? messageText.slice(0, 77) + '...' : messageText;
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: senderName,
        body,
        sound: 'default',
        channelId: 'chat',
        data: { type: 'chat', receiverUid, senderUid },
      }),
    });
    const json = await res.json();
    if (json.data?.[0]?.status === 'error' && __DEV__) {
      console.warn('[Push] Expo API error:', json.data[0].message);
    }
  } catch (e) {
    if (__DEV__) console.warn('[Push] sendChatPushNotification failed:', e);
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
    const token = await getReceiverPushToken(recipientUid);
    if (!token) {
      if (__DEV__) console.warn('[Push] No token for recipient', recipientUid.slice(0, 8) + '...');
      return;
    }
    const body = `${senderName} wants to join: ${activityName}`;
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
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
    const json = await res.json();
    if (json.data?.[0]?.status === 'error' && __DEV__) {
      console.warn('[Push] Expo API error (join):', json.data[0].message);
    }
  } catch (e) {
    if (__DEV__) console.warn('[Push] sendJoinRequestPushNotification failed:', e);
  }
}
