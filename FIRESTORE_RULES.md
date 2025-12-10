# Firestore Security Rules Setup

## Current Rules (Replace These)

Replace your current rules in Firebase Console → Firestore Database → Rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own caught Pokemon
    match /caughtPokemon/{document=**} {
      // Allow read if the document's userId matches the authenticated user's ID
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Allow create if the userId in the request matches the authenticated user's ID
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      // Allow update if the document's userId matches the authenticated user's ID
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Allow delete if the document's userId matches the authenticated user's ID
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Allow users to read and write their own achievements
    match /achievements/{document=**} {
      // Allow read if the document's userId matches the authenticated user's ID
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Allow create if the userId in the request matches the authenticated user's ID
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      // Allow update if the document's userId matches the authenticated user's ID
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Allow delete if the document's userId matches the authenticated user's ID
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Allow all authenticated users to read feed posts, but only create their own
    match /feed/{document=**} {
      // Allow read for all authenticated users (global feed)
      allow read: if request.auth != null;
      
      // Allow create if the userId in the request matches the authenticated user's ID
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      // Allow update if the document's userId matches the authenticated user's ID
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Allow delete if the document's userId matches the authenticated user's ID
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Allow users to read and write their own profile
    match /users/{userId} {
      // Allow read if the userId matches the authenticated user's ID
      allow read: if request.auth != null && userId == request.auth.uid;
      
      // Allow create if the userId matches the authenticated user's ID
      allow create: if request.auth != null && userId == request.auth.uid;
      
      // Allow update if the userId matches the authenticated user's ID
      allow update: if request.auth != null && userId == request.auth.uid;
      
      // Allow delete if the userId matches the authenticated user's ID
      allow delete: if request.auth != null && userId == request.auth.uid;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## How to Update

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab
5. Replace the entire rules section with the code above
6. Click **Publish**

## What These Rules Do

- ✅ **Authenticated users only**: All operations require `request.auth != null` (user must be logged in)
- ✅ **User-specific data**: Users can only read/write Pokemon where `userId` matches their own `uid`
- ✅ **Secure by default**: All other collections are denied access
- ✅ **No expiration**: Unlike the time-based rules, these work permanently

## Testing

After updating the rules, try catching a Pokemon again. The permission error should be resolved.

## Index Requirement

If you get an error about needing an index for the `orderBy('caughtAt')` query:

1. Click the link in the error message (Firebase will provide it)
2. Or manually create it:
   - Go to Firestore → **Indexes** tab
   - Click **Create Index**
   - Collection: `caughtPokemon`
   - Fields:
     - `userId` (Ascending)
     - `caughtAt` (Descending)
   - Click **Create**
