# Firestore Database Setup Guide

## Firebase Console mein Firestore Setup

### 1. Firestore Database Create karein
- Firebase Console → Firestore Database → Create Database
- **Test mode** ya **Production mode** select karein (development ke liye test mode theek hai)
- Location select karein (apne region ke hisaab se)

### 2. Security Rules Setup (Important!)

Firebase Console → Firestore Database → Rules tab mein ye rules add karein:

**Production Mode Rules (Recommended - Secure):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Development/Test Mode Rules (agar change karna ho):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

⚠️ **Important:** Production mode mein strict rules use karein taake data secure rahe.

### 3. Indexes (Agar zarurat ho)
- Agar queries complex hain to Firebase automatically index create karega
- Indexes tab mein check karein

### 4. Environment Variables Check karein
`.env` file mein ye values honi chahiye:
- EXPO_PUBLIC_FIREBASE_PROJECT_ID
- EXPO_PUBLIC_FIREBASE_API_KEY
- etc.

### 5. Test karein
App run karke sign-up karein aur check karein ke data Firestore mein save ho raha hai.

## Data Structure

App automatically `users` collection create karega with structure:
```
users/
  {userId}/
    - uid: string
    - name: string
    - email: string
    - phoneNumber: string
    - dateOfBirth: string
    - gender: "male" | "female" | "other"
    - country: string
    - city: string
    - activities: string[]
    - expertiseLevel: "beginner" | "intermediate" | "pro"
    - onboardingCompleted: boolean
    - createdAt: string
    - updatedAt: string
```
