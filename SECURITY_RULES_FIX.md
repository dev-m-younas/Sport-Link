# Firestore Security Rules Fix - Missing Permissions Error

## Error: Missing or insufficient permissions

Agar aapko ye error aa raha hai, to Firebase Console mein security rules properly set nahi hain.

## Solution: Security Rules Update karein

### Step 1: Firebase Console mein jayein
1. https://console.firebase.google.com/ par jayein
2. Apna project `sportlink-371f9` select karein
3. Left sidebar se **Firestore Database** click karein
4. **Rules** tab par click karein

### Step 2: Ye Rules Copy-Paste karein

**Important:** Agar aapne custom database ID `sport-link` use kiya hai, to pehle database select karein:

1. Top par database dropdown mein `sport-link` select karein
2. Phir Rules tab mein ye rules paste karein:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own data
    match /users/{userId} {
      // Read: User can only read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Create: User can only create their own profile
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Update: User can only update their own profile
      allow update: if request.auth != null && request.auth.uid == userId;
      
      // Delete: User can only delete their own profile
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 3: Rules Publish karein

1. Rules paste karne ke baad **"Publish"** button click karein
2. Confirmation message aayega
3. Rules immediately apply ho jayengi

### Step 4: Verification

Rules publish karne ke baad:
1. App restart karein (Ctrl+C then `npm start`)
2. Sign-up karein
3. Onboarding complete karein
4. Error disappear ho jayega

## Alternative: Temporary Test Rules (Development Only)

Agar abhi bhi issue ho, to temporarily ye rules use kar sakte hain (sirf development ke liye):

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

⚠️ **Warning:** Production mein pehli wali strict rules use karein.

## Common Issues:

1. **Rules not published**: Rules paste karne ke baad "Publish" button click karna zaroori hai
2. **Wrong database selected**: Top par `sport-link` database select karein
3. **User not authenticated**: Sign-up/sign-in ke baad hi data access hoga
4. **Rules syntax error**: Rules copy-paste karte waqt syntax check karein

## Quick Fix Checklist:

- [ ] Firebase Console mein `sport-link` database select kiya
- [ ] Rules tab mein correct rules paste kiye
- [ ] "Publish" button click kiya
- [ ] App restart kiya
- [ ] User sign-up/sign-in kiya
