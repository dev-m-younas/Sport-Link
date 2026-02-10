import { Stack } from 'expo-router';

export default function OnboardingLayout() {
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
