# Firestore Production Mode Security Rules

## Production Mode ke liye Security Rules

Aapne production mode select kiya hai, isliye ye secure rules use karein:

### Copy aur Paste karein Firebase Console mein:

Firebase Console → Firestore Database → Rules tab → Ye rules paste karein:

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

### Rules ka matlab:

1. **`allow read`**: User sirf apna data read kar sakta hai
2. **`allow create`**: User sirf apna profile create kar sakta hai
3. **`allow update`**: User sirf apna profile update kar sakta hai
4. **`allow delete`**: User sirf apna profile delete kar sakta hai

### Security Features:

✅ **Secure**: Har user sirf apna data access kar sakta hai
✅ **Authenticated Only**: Sirf logged-in users hi access kar sakte hain
✅ **Production Ready**: Production environment ke liye safe hai

### Rules Publish karein:

1. Rules paste karne ke baad **"Publish"** button click karein
2. Confirmation message aayega
3. Rules immediately apply ho jayengi

### Testing:

Rules publish karne ke baad:
1. App mein sign-up karein
2. Onboarding complete karein
3. Firebase Console → Firestore Database → Data tab mein check karein
4. Data properly save hona chahiye

### Agar koi issue aaye:

- **Permission denied**: Check karein ke user logged in hai
- **Rules not working**: Rules publish karne ke baad app restart karein
- **Data not saving**: Firebase Console mein rules properly paste kiye hain ya nahi check karein
