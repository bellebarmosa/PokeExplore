# 🚀 Quick Start - Firebase Setup

## Step 1: Download Firebase Config Files

### Android Config File
1. Go to Firebase Console → Your Project → Project Settings
2. Scroll to "Your apps" section
3. Click on your Android app (or add one with package name: `labubumatchalatte.pokeexplorer`)
4. Download `google-services.json`
5. **Place it here:** 
   ```
   android/app/google-services.json
   ```

### iOS Config File
1. Go to Firebase Console → Your Project → Project Settings
2. Scroll to "Your apps" section  
3. Click on your iOS app (or add one with your bundle ID)
4. Download `GoogleService-Info.plist`
5. **Place it here:**
   ```
   ios/AwesomeProject/GoogleService-Info.plist
   ```
6. **Don't forget:** Add it to Xcode project (drag & drop into Xcode)

## Step 2: Get Web Client ID

1. Firebase Console → **Authentication** → **Sign-in method**
2. Click on **Google** (should show "Enabled")
3. Look for **"Web SDK configuration"** section
4. Copy the **Web client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)

## Step 3: Update Config File

Open: `src/config/firebase.config.ts`

Find this line:
```typescript
webClientId: 'YOUR_WEB_CLIENT_ID_HERE',
```

Replace `YOUR_WEB_CLIENT_ID_HERE` with the Web Client ID you copied.

## Step 4: Install iOS Dependencies

```bash
cd ios && pod install && cd ..
```

## Step 5: Test!

```bash
npm run ios
# or
npm run android
```

---

## ✅ You're Done!

Your authentication should now work with:
- ✅ Email/Password (already enabled)
- ✅ Google Sign-In (already enabled)

