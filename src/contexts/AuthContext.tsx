import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { firebaseAuth, configureGoogleSignIn } from '../config/firebase.config';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    try {
      // Configure Google Sign-In on mount
      configureGoogleSignIn();

      // Subscribe to auth state changes using modular API
      unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser: FirebaseAuthTypes.User | null) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      // Handle specific Firebase error codes
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled.');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to sign in. Please try again.');
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      // Handle specific Firebase error codes
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to sign up. Please try again.');
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const response = await GoogleSignin.signIn();
      
      // Check if sign-in was successful
      if (!isSuccessResponse(response)) {
        throw new Error('Google Sign-In was cancelled');
      }
      
      // Get tokens - this is more reliable than using response.data.idToken
      const tokens = await GoogleSignin.getTokens();
      
      if (!tokens.idToken) {
        throw new Error('Failed to get ID token from Google Sign-In');
      }
      
      // Create a Google credential with the token using modular API
      const googleCredential = GoogleAuthProvider.credential(tokens.idToken);
      
      // Sign-in the user with the credential
      await signInWithCredential(firebaseAuth, googleCredential);
    } catch (error: any) {
      console.error('Google Sign-In Error Details:', error);
      
      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === '12501') {
        throw new Error('Sign in was cancelled');
      } else if (error.code === 'IN_PROGRESS' || error.code === '10') {
        throw new Error('Sign in is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE' || error.code === '12500') {
        throw new Error('Google Play Services not available');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/internal-error') {
        throw new Error('Internal error. Please try again.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to sign in with Google. Please try again.');
      }
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await firebaseSignOut(firebaseAuth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

