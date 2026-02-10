import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence,
  type Auth 
} from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration - Replace with your Firebase project config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "YOUR_PROJECT.appspot.com",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : (getApps()[0] as FirebaseApp);

// Initialize Auth with AsyncStorage persistence for React Native
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error: any) {
    // If auth is already initialized, use the existing instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

// Initialize Firestore with custom database ID
const db: Firestore = getFirestore(app, 'sport-link');

// Enable offline persistence for web
if (Platform.OS === 'web') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence already enabled in another tab');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
      console.warn('Firestore persistence is not supported in this browser');
    }
  });
}

export { app, auth, db };
