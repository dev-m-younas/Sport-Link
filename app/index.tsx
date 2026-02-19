import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';

export default function Index() {
  const { user, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <ThemedView style={styles.loading}>
        <Image
          source={require('@/assets/images/Logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <ActivityIndicator size="large" color="#00ADB5" style={styles.spinner} />
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
    // If onboarding status is still loading (null), wait a bit then redirect to tabs
    // This prevents infinite loading if onboarding check fails
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 32,
  },
  spinner: {
    marginTop: 16,
  },
});
