# Firebase Setup Instructions

This guide will help you connect your React Native app to your Firebase project.

## Prerequisites

1. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Firebase Authentication enabled in your Firebase Console
3. Google Sign-In method enabled (if using Google authentication)

## Step 1: Android Setup

### 1.1 Download google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have an Android app, click "Add app" and select Android
7. Enter your package name: `com.awesomeproject` (or check your `android/app/build.gradle` for the actual package name)
8. Download the `google-services.json` file
9. Place it in: `android/app/google-services.json`

### 1.2 Enable Google Sign-In (for Android)

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Google** as a sign-in provider
3. Note down the **Web client ID** (you'll need this for the app config)

## Step 2: iOS Setup

### 2.1 Download GoogleService-Info.plist

1. In Firebase Console, go to Project settings
2. Under "Your apps", find or add an iOS app
3. Enter your bundle ID: `com.awesomeproject` (or check your `ios/AwesomeProject/Info.plist` for the actual bundle ID)
4. Download the `GoogleService-Info.plist` file
5. Place it in: `ios/AwesomeProject/GoogleService-Info.plist`
6. Make sure it's added to your Xcode project (drag and drop into Xcode)

### 2.2 Install iOS Pods

```bash
cd ios
pod install
cd ..
```

### 2.3 Enable Google Sign-In (for iOS)

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Google** as a sign-in provider
3. Note down the **Web client ID** (you'll need this for the app config)

## Step 3: Configure Google Sign-In

1. Open `src/config/firebase.config.ts`
2. Replace `YOUR_WEB_CLIENT_ID_HERE` with your Web Client ID from Firebase Console
   - You can find this in Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration

## Step 4: Enable Authentication Methods

In Firebase Console:
1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Enable **Google** authentication (if using Google Sign-In)

## Step 5: Test the Setup

1. Run the app:
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   ```

2. Try signing up with email/password
3. Try signing in with Google (if configured)

## Troubleshooting

### Android Issues

- **"google-services.json not found"**: Make sure the file is in `android/app/google-services.json`
- **Build errors**: Clean and rebuild:
  ```bash
  cd android
  ./gradlew clean
  cd ..
  npm run android
  ```

### iOS Issues

- **"GoogleService-Info.plist not found"**: Make sure the file is in `ios/AwesomeProject/GoogleService-Info.plist` and added to Xcode
- **Pod installation errors**: 
  ```bash
  cd ios
  pod deintegrate
  pod install
  cd ..
  ```

### Google Sign-In Issues

- Make sure you've enabled Google Sign-In in Firebase Console
- Verify the Web Client ID is correct in `firebase.config.ts`
- For iOS, make sure you've added the REVERSED_CLIENT_ID URL scheme to Info.plist (this should be done automatically by the Google Sign-In library)

## Next Steps

Once authentication is working, you can proceed with:
- Pokedex Core (API Integration)
- Geolocation-Based Discovery
- AR/VR Camera Integration

