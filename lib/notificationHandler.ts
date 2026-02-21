import Constants from 'expo-constants';
import { router } from 'expo-router';

function handleNotificationResponse(data: Record<string, unknown>) {
  const type = data?.type as string | undefined;
  if (!type) return;

  if (type === 'chat') {
    const senderUid = data?.senderUid as string | undefined;
    if (senderUid) {
      router.push({ pathname: '/(tabs)/chat-detail', params: { userId: senderUid } });
    }
  } else if (type === 'join_request') {
    router.push('/(tabs)/notifications');
  }
}

/**
 * Set up notification tap handling. Call from app root.
 */
export function setupNotificationHandlers(): () => void {
  if (Constants.appOwnership === 'expo') return () => {};

  let subscription: { remove: () => void } | null = null;

  import('expo-notifications').then((Notifications) => {
    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      handleNotificationResponse(data);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      setTimeout(() => handleNotificationResponse(data), 500);
    });
  }).catch(() => {});

  return () => {
    subscription?.remove();
  };
}
