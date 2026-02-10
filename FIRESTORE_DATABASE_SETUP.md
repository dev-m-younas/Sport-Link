# Firestore Database Setup - Important!

## Error: Database '(default)' not found

Agar aapko ye error aa raha hai, to Firebase Console mein Firestore Database properly setup nahi hua hai.

## Steps to Fix:

### 1. Firebase Console mein jayein
- https://console.firebase.google.com/ par jayein
- Apna project select karein

### 2. Firestore Database Create karein
- Left sidebar mein **"Firestore Database"** click karein
- Agar pehle se database nahi hai, to **"Create database"** button click karein

### 3. Database Mode Select karein
- **Test mode** (development ke liye) ya **Production mode** select karein
- **Test mode** recommended hai development ke liye

### 4. Location Select karein
- Apne region ke hisaab se location select karein
- Example: `asia-south1` (Mumbai), `us-central1`, etc.

### 5. Security Rules Setup (Important!)

Firestore Database → Rules tab mein ye rules add karein:

**For Production Mode (Recommended):**
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

**For Development (Test Mode - agar change karna ho):**
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

### 6. Environment Variables Check karein

`.env` file mein ye values honi chahiye:
```
EXPO_PUBLIC_FIREBASE_PROJECT_ID=sportlink-371f9
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
```

### 7. App Restart karein
- App ko completely close karein
- `npm start` ya `expo start` run karein
- Clear cache: `expo start -c`

## Verification

Database create hone ke baad:
1. Firebase Console → Firestore Database → Data tab
2. `users` collection automatically create hogi jab pehli baar data save hoga
3. Warnings disappear ho jayengi

## Common Issues:

1. **Database not found**: Database create nahi hua hai Firebase Console mein
2. **Permission denied**: Security rules check karein
3. **Network error**: Internet connection check karein
4. **Project ID mismatch**: `.env` file mein correct project ID check karein
