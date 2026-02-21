import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingLayout() {
  const { user } = useAuth();

  // Request notification permission & save push token to users collection (for FCM/Expo push)
  useEffect(() => {
    if (!user?.uid) return;
    import('@/lib/chatPushNotifications').then(({ savePushToken }) => {
      savePushToken(user.uid).catch(() => {});
    });
  }, [user?.uid]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}>
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="activities" />
      <Stack.Screen name="expertise" />
      <Stack.Screen name="welcome-1" />
      <Stack.Screen name="welcome-2" />
    </Stack>
  );
}
