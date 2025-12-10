/**
 * Firebase Configuration
 * 
 * IMPORTANT: You need to add your Firebase configuration files:
 * 
 * For Android:
 * - Download google-services.json from Firebase Console
 * - Place it in: android/app/google-services.json
 * 
 * For iOS:
 * - Download GoogleService-Info.plist from Firebase Console
 * - Place it in: ios/AwesomeProject/GoogleService-Info.plist
 * 
 * Then run:
 * - For iOS: cd ios && pod install
 * - For Android: The build will automatically pick up google-services.json
 */

import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Initialize Firebase Auth using modular API
export const firebaseAuth = getAuth(getApp());

// Configure Google Sign-In
// You'll need to get your web client ID from Firebase Console
// Go to: Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // Replace with your Web Client ID from Firebase Console
    webClientId: '1060774015394-diitt134tfleu3krfo7tjrir6tdiugul.apps.googleusercontent.com', // Get this from Firebase Console
  });
};

