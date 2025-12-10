# Firebase Configuration - Quick Guide

## 📍 Where to Put Firebase Config Files

### For Android:
**File:** `google-services.json`  
**Location:** `android/app/google-services.json`

1. Download `google-services.json` from Firebase Console
2. Place it directly in the `android/app/` folder
3. The file should be at: `/Users/bellelastimosa/Documents/Repos/PokeExplore/android/app/google-services.json`

### For iOS:
**File:** `GoogleService-Info.plist`  
**Location:** `ios/AwesomeProject/GoogleService-Info.plist`

1. Download `GoogleService-Info.plist` from Firebase Console
2. Place it in the `ios/AwesomeProject/` folder
3. The file should be at: `/Users/bellelastimosa/Documents/Repos/PokeExplore/ios/AwesomeProject/GoogleService-Info.plist`
4. **IMPORTANT:** You must also add it to your Xcode project:
   - Open Xcode
   - Right-click on the `AwesomeProject` folder in the project navigator
   - Select "Add Files to AwesomeProject..."
   - Select the `GoogleService-Info.plist` file
   - Make sure "Copy items if needed" is checked
   - Click "Add"

## 🔑 Where to Find Web Client ID in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Authentication** in the left sidebar
4. Click on **Sign-in method** tab
5. Click on **Google** provider (it should show as "Enabled")
6. You'll see a section called **Web SDK configuration**
7. Copy the **Web client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
8. Open `src/config/firebase.config.ts` in your project
9. Replace `YOUR_WEB_CLIENT_ID_HERE` with the Web Client ID you copied

## 📦 Package Name for Firebase Setup

When adding your Android app to Firebase Console, use:
- **Package name:** `labubumatchalatte.pokeexplorer`

When adding your iOS app to Firebase Console, check your bundle ID in:
- Xcode → Project Settings → General → Bundle Identifier
- Or check `ios/AwesomeProject/Info.plist` → `CFBundleIdentifier`

## ✅ Verification Checklist

- [ ] `google-services.json` is in `android/app/google-services.json`
- [ ] `GoogleService-Info.plist` is in `ios/AwesomeProject/GoogleService-Info.plist`
- [ ] `GoogleService-Info.plist` is added to Xcode project
- [ ] Web Client ID is added to `src/config/firebase.config.ts`
- [ ] Email/Password authentication is enabled in Firebase Console
- [ ] Google Sign-In is enabled in Firebase Console

## 🚀 After Configuration

For iOS, run:
```bash
cd ios && pod install && cd ..
```

Then test the app:
```bash
npm run ios
# or
npm run android
```

