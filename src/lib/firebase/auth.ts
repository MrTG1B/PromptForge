// src/lib/firebase/auth.ts
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  type UserCredential,
  type AuthError,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from './config'; // Firebase app initialized with auth

// Define a simpler User type or use FirebaseUser directly
export type User = FirebaseUser | null;

export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during Google Sign-In:", error);
    throw error; // Re-throw to handle in UI
  }
};

export const signInWithFacebook = async (): Promise<User | null> => {
  const provider = new FacebookAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during Facebook Sign-In:", error);
    throw error; // Re-throw to handle in UI
  }
};

export const signUpWithEmailPassword = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error during Email/Password Sign-Up:", error);
    throw error; // Re-throw to handle in UI
  }
};

export const signInWithEmailPassword = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error during Email/Password Sign-In:", error);
    throw error; // Re-throw to handle in UI
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error; // Re-throw to handle in UI
  }
};

export const onAuthStateChanged = (callback: (user: User) => void): (() => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

// Helper to get user-friendly messages from Firebase Auth errors
export const getFirebaseAuthErrorMessage = (error: any): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const authError = error as AuthError;
    switch (authError.code) {
      case 'auth/email-already-in-use':
        return 'This email address is already in use by another account.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'auth/weak-password':
        return 'The password is too weak. It must be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
         return 'Incorrect email or password. Please try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in process was cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email address using a different sign-in method (e.g., Google or Facebook). Try signing in with that method.';
      default:
        return `An unexpected error occurred: ${authError.message} (Code: ${authError.code})`;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};
