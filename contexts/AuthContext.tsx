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

  const [request, response, promptAsync] = Google.useAuthRequest({
    // Use your own webClientId from Google Cloud Console for production
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const completed = await checkOnboardingStatus(user.uid);
          setOnboardingCompleted(completed);
        } catch (error: any) {
          // Handle offline errors gracefully - default to false (needs onboarding)
          if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
            console.warn("Offline: Cannot check onboarding status, defaulting to false");
            setOnboardingCompleted(false);
          } else {
            console.error("Error checking onboarding status:", error);
            setOnboardingCompleted(false);
          }
        }
      } else {
        setOnboardingCompleted(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential).catch((error) => {
          setAuthError(error.message || "Google sign-in failed");
        });
      }
    } else if (response?.type === "error") {
      setAuthError("Google sign-in was cancelled or failed");
    }
  }, [response]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
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
    if (Platform.OS === "web" && !request?.redirectUri) {
      setAuthError("Google Sign-In requires configuration on web");
      return;
    }
    await promptAsync();
  };

  const signOut = async () => {
    setAuthError(null);
    await firebaseSignOut(auth);
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
