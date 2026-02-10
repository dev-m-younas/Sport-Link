import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';

export default function Index() {
  const { user, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ThemedView>
    );
  }

  if (user) {
    // Check if onboarding is completed
    if (onboardingCompleted === false) {
      return <Redirect href="/(auth)/onboarding/personal-info" />;
    }
    if (onboardingCompleted === true) {
      return <Redirect href="/(tabs)" />;
    }
    // If onboarding status is still loading (null), show loading
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ThemedView>
    );
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
