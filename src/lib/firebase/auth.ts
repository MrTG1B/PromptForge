// src/lib/firebase/auth.ts
import { 
  GoogleAuthProvider,
  FacebookAuthProvider, // Added FacebookAuthProvider
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
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
    // Handle specific errors if needed, e.g., account-exists-with-different-credential
    return null;
  }
};

export const signInWithFacebook = async (): Promise<User | null> => {
  const provider = new FacebookAuthProvider();
  // You can add scopes if needed, e.g., provider.addScope('email');
  try {
    const result = await signInWithPopup(auth, provider);
    // The user object contains information like displayName, email, photoURL, etc.
    return result.user;
  } catch (error) {
    console.error("Error during Facebook Sign-In:", error);
    // Handle specific errors like popup_closed_by_user, account-exists-with-different-credential
    // For example, if (error.code === 'auth/account-exists-with-different-credential') { ... }
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const onAuthStateChanged = (callback: (user: User) => void): (() => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};
