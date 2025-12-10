# Troubleshooting Authentication Issues

## Network Error (auth/network-request-failed)

If you're getting network errors when signing up or signing in:

### 1. Add SHA Certificate Fingerprints to Firebase

**This is REQUIRED for Google Sign-In to work!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll to **Your apps** section
5. Click on your Android app
6. Scroll to **SHA certificate fingerprints**
7. Add these fingerprints:

**Debug SHA-1:**
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

**Debug SHA-256:**
```
FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

8. Click **Save**
9. Download the updated `google-services.json`
10. Replace the file in `android/app/google-services.json`
11. Rebuild the app

### 2. Check Internet Connection

- Ensure your device/emulator has internet access
- Try switching between Wi-Fi and mobile data
- Check if you can access other network services

### 3. Verify Firebase Configuration

- Make sure `google-services.json` is in `android/app/google-services.json`
- Make sure `GoogleService-Info.plist` is in `ios/AwesomeProject/GoogleService-Info.plist` and added to Xcode
- Verify the package name in `google-services.json` matches: `labubumatchalatte.pokeexplorer`

## Google Sign-In Stuck on "Checking info..."

### 1. Clear Google Play Services Cache

On your Android device/emulator:
1. Go to **Settings** > **Apps** > **Google Play Services**
2. Tap **Storage** > **Clear Cache**
3. Tap **Manage Space** > **Clear All Data**
4. Restart the app

### 2. Update Google Play Services

1. Open **Google Play Store**
2. Search for "Google Play Services"
3. Update if available
4. Restart the app

### 3. Verify OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** > **OAuth consent screen**
4. Make sure it's configured (at least in Testing mode)
5. Add your email as a test user if in Testing mode

### 4. Check Web Client ID

1. Go to Firebase Console > **Authentication** > **Sign-in method** > **Google**
2. Copy the **Web client ID**
3. Verify it matches the one in `src/config/firebase.config.ts`

### 5. Test on Physical Device

If testing on an emulator, try a physical device. Some emulators have issues with Google Play Services.

## Quick Fixes

1. **Rebuild the app:**
   ```bash
   # Android
   cd android && ./gradlew clean && cd ..
   npm run android
   
   # iOS
   cd ios && pod install && cd ..
   npm run ios
   ```

2. **Clear app data:**
   - Uninstall and reinstall the app
   - Or clear app data from device settings

3. **Check Firebase Console:**
   - Verify Authentication is enabled
   - Verify Email/Password is enabled
   - Verify Google Sign-In is enabled

## Still Having Issues?

1. Check the console logs for detailed error messages
2. Verify all Firebase config files are correct
3. Make sure you're using the latest versions of Firebase packages
4. Check if there are any firewall or network restrictions

