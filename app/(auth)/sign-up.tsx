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
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignUpScreen() {
  const { signUp, signInWithGoogle, authError, clearError } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isValid = email.trim() && password.length >= 6 && passwordsMatch;

  const handleSignUp = async () => {
    if (!isValid) return;
    setLoading(true);
    clearError();
    try {
      await signUp(email.trim(), password);
      router.replace('/(auth)/onboarding/personal-info');
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
              <Image
                source={require('@/assets/images/Logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
              <ThemedText type="title" style={styles.title}>
                Create Account
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Sign up to get started
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
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                showPasswordToggle
                isPasswordVisible={showPassword}
                onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
              />
              <AuthInput
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
                showPasswordToggle
                isPasswordVisible={showConfirmPassword}
                onTogglePasswordVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                error={
                  confirmPassword && !passwordsMatch
                    ? 'Passwords do not match'
                    : undefined
                }
              />

              <AuthButton
                title="Sign Up"
                onPress={handleSignUp}
                loading={loading}
                disabled={!isValid}
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
                <ThemedText>Already have an account? </ThemedText>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity>
                    <ThemedText type="link">Sign In</ThemedText>
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
  logo: {
    width: 200,
    height: 120,
    marginBottom: 24,
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
