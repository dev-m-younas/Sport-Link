import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignInScreen() {
  const { signIn, signInWithGoogle, authError, clearError, onboardingCompleted } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    clearError();
    try {
      await signIn(email.trim(), password);
      // Navigation will be handled by auth state change in index.tsx
    } catch {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      await signInWithGoogle();
      // Navigation will be handled by auth state change
    } catch {
      // Error handled in context
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.logoCircle, isDark && styles.logoCircleDark]}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={48}
                  color="#0a7ea4"
                />
              </View>
              <ThemedText type="title" style={styles.title}>
                Welcome Back
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Sign in to continue to your account
              </ThemedText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {authError ? (
                <View style={styles.errorBanner}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#E53935" />
                  <Text style={styles.errorBannerText}>{authError}</Text>
                </View>
              ) : null}

              <AuthInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <AuthInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
              />

              <AuthButton
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                disabled={!email.trim() || !password}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
                <ThemedText style={styles.dividerText}>or continue with</ThemedText>
                <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
              </View>

              <AuthButton
                title="Continue with Google"
                variant="google"
                onPress={handleGoogleSignIn}
              />

              <View style={styles.footer}>
                <ThemedText>Don't have an account? </ThemedText>
                <Link href="/(auth)/sign-up" asChild>
                  <TouchableOpacity>
                    <ThemedText type="link">Sign Up</ThemedText>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircleDark: {
    backgroundColor: '#1D3D47',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.8,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    color: '#E53935',
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dadce0',
  },
  dividerLineDark: {
    backgroundColor: '#3C3E42',
  },
  dividerText: {
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
});
