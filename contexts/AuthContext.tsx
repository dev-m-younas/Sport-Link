import { auth } from "@/lib/firebase";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
    GoogleAuthProvider,
    User,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    type UserCredential,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { checkOnboardingStatus } from "@/lib/userProfile";

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean | null;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
  authError: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Redirect URI must match exactly what you add in Google Cloud Console → Credentials → Web client → Authorized redirect URIs.
  // Add: https://auth.expo.io/@younas.qayyum/my-app (see GOOGLE_SIGNIN_FIX_400.md)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri: "https://auth.expo.io/@younas.qayyum/my-app",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user?.uid || 'null');
      setUser(user);
      
      if (user) {
        // Set loading to false immediately for navigation
        setLoading(false);
        // Save push token for chat notifications (non-blocking)
        import('@/lib/chatPushNotifications').then(({ savePushToken }) => {
          savePushToken(user.uid).catch(() => {});
        });
        // Check onboarding status asynchronously without blocking
        checkOnboardingStatus(user.uid)
          .then((completed) => {
            console.log('Onboarding status:', completed);
            setOnboardingCompleted(completed);
          })
          .catch((error: any) => {
            // Handle offline errors gracefully - default to false (needs onboarding)
            if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
              console.warn("Offline: Cannot check onboarding status, defaulting to false");
              setOnboardingCompleted(false);
            } else {
              console.error("Error checking onboarding status:", error);
              // If profile doesn't exist, user needs onboarding
              setOnboardingCompleted(false);
            }
          });
      } else {
        setOnboardingCompleted(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential).catch((error) => {
          console.error('Google credential sign-in error:', error);
          const errorMessage = error.message || "Google sign-in failed";
          // Provide more specific error messages
          if (errorMessage.includes('blocked') || errorMessage.includes('access_denied')) {
            setAuthError("Google sign-in blocked. Please check OAuth consent screen settings in Google Cloud Console or contact support.");
          } else if (errorMessage.includes('invalid_client')) {
            setAuthError("Google sign-in configuration error. Please check your Google OAuth client IDs.");
          } else {
            setAuthError(errorMessage);
          }
        });
      } else {
        setAuthError("Google sign-in failed: No ID token received");
      }
    } else if (response?.type === "error") {
      const errorCode = response.error?.code;
      const errorMessage = response.error?.message || "Google sign-in was cancelled or failed";
      const errorParams = response.error?.params || {};
      console.error('Google OAuth error:', response.error);
      
      // Provide specific error messages based on error codes
      if (errorCode === 'access_denied' || errorMessage.includes('blocked') || errorParams.error === 'access_denied') {
        setAuthError("Google sign-in blocked. The app may be in testing mode. Please add your email as a test user in Google Cloud Console or contact support.");
      } else if (errorCode === 'invalid_request' || errorParams.error === 'invalid_request' || errorMessage.includes('invalid_request')) {
        setAuthError("Google OAuth configuration error: Privacy Policy and Terms of Service URLs are required. Please configure them in Google Cloud Console → OAuth consent screen. See QUICK_FIX_GOOGLE_OAUTH.md for details.");
      } else if (errorCode === 'invalid_client') {
        setAuthError("Google sign-in configuration error. Please verify your Google OAuth client IDs in .env file.");
      } else if (errorCode === 'redirect_uri_mismatch') {
        setAuthError("Google sign-in configuration error. Redirect URI mismatch. Please check Google Cloud Console settings.");
      } else {
        setAuthError(`Google sign-in failed: ${errorMessage || errorCode || 'Unknown error'}`);
      }
    } else if (response?.type === "dismiss") {
      // User dismissed the OAuth screen
      console.log('Google sign-in dismissed by user');
    }
  }, [response]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      console.log('Firebase sign in attempt...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign in success:', result.user.uid);
      return result;
    } catch (error: unknown) {
      console.error('Firebase sign in error:', error);
      const err = error as { code?: string; message?: string };
      const message =
        err.code === "auth/user-not-found"
          ? "No account found with this email"
          : err.code === "auth/wrong-password"
            ? "Incorrect password"
            : err.code === "auth/invalid-email"
              ? "Invalid email address"
              : err.message || "Sign in failed";
      setAuthError(message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    setAuthError(null);
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const message =
        err.code === "auth/email-already-in-use"
          ? "An account already exists with this email"
          : err.code === "auth/weak-password"
            ? "Password should be at least 6 characters"
            : err.code === "auth/invalid-email"
              ? "Invalid email address"
              : err.message || "Sign up failed";
      setAuthError(message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    
    // Check if Google client IDs are configured
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      setAuthError("Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.");
      return;
    }
    
    if (Platform.OS === "web" && !request?.redirectUri) {
      setAuthError("Google Sign-In requires configuration on web");
      return;
    }
    
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Error prompting Google sign-in:', error);
      setAuthError(error?.message || "Failed to start Google sign-in. Please try again.");
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setOnboardingCompleted(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthError(error.message || 'Failed to sign out');
      throw error;
    }
  };

  const clearError = () => setAuthError(null);

  const refreshOnboardingStatus = async () => {
    if (user) {
      try {
        const completed = await checkOnboardingStatus(user.uid);
        setOnboardingCompleted(completed);
      } catch (error: any) {
        // Handle offline errors gracefully
        if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
          console.warn("Offline: Cannot refresh onboarding status");
          // Keep current status if offline
        } else {
          console.error("Error refreshing onboarding status:", error);
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        onboardingCompleted,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshOnboardingStatus,
        authError,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
