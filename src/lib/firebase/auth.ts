
// src/lib/firebase/auth.ts
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification,
  type UserCredential,
  type AuthError,
  type User as FirebaseUser,
  type ActionCodeSettings,
} from 'firebase/auth';
import { auth } from './config'; // Firebase app initialized with auth

export type User = FirebaseUser | null;

export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during Google Sign-In:", error);
    throw error;
  }
};

export const signInWithFacebook = async (): Promise<User | null> => {
  const provider = new FacebookAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during Facebook Sign-In:", error);
    throw error;
  }
};

export const signUpWithEmailPasswordAndSendVerification = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    
    if (userCredential.user) {
      const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteURL) {
        console.error("ERROR: NEXT_PUBLIC_SITE_URL is not set. Cannot send verification email with continue URL.");
        // Decide if you want to throw an error here or proceed without the continue URL
        // For now, we'll proceed, but the redirect after verification might not work as intended.
      }
      const actionCodeSettings: ActionCodeSettings = {
        url: siteURL ? `${siteURL}/complete-profile` : ( (typeof window !== 'undefined' ? window.location.origin : '') + '/complete-profile'),
        handleCodeInApp: true,
      };
      await sendEmailVerification(userCredential.user, actionCodeSettings);
    }
    return userCredential;
  } catch (error) {
    console.error("Error during Email/Password Sign-Up:", error);
    throw error;
  }
};

export const signInWithEmailPassword = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error during Email/Password Sign-In:", error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const onAuthStateChanged = (callback: (user: User) => void): (() => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

export const reauthenticateUser = async (currentPassword_REMOVEME?: string): Promise<void> => {
  // This function is problematic because it directly takes password.
  // It should be called only after creating a credential.
  // The actual reauth happens in updateUserEmail and updateUserPassword with a credential.
  // This function might be misleading or unused if not careful.
  // For now, let's assume the calling functions (updateUserEmail/Password) will handle credential creation.
  const user = auth.currentUser;
  if (!user || !currentPassword_REMOVEME) { // currentPassword_REMOVEME is a placeholder name
    throw new Error("User not found or current password not provided for re-authentication.");
  }
  console.warn("reauthenticateUser was called directly with a password, which is less secure. Prefer creating a credential first.");
  const credential = EmailAuthProvider.credential(user.email!, currentPassword_REMOVEME);
  await reauthenticateWithCredential(user, credential);
};

export const updateUserEmail = async (currentPasswordForReauth: string, newEmail: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("User not found or current email is missing.");
  }
  if (!currentPasswordForReauth) {
     throw new Error("Current password is required to change email.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPasswordForReauth);
  
  try {
    await reauthenticateWithCredential(user, credential);
    await firebaseUpdateEmail(user, newEmail);
    // Firebase will usually send its own verification email to the new address.
    // You can also trigger your custom verification flow here if needed.
    const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
      const actionCodeSettings: ActionCodeSettings = {
        url: siteURL ? `${siteURL}/complete-profile` : ( (typeof window !== 'undefined' ? window.location.origin : '') + '/complete-profile'),
        handleCodeInApp: true,
      };
    await sendEmailVerification(user, actionCodeSettings); // Send verification to new email
  } catch (error) {
    console.error("Error updating email:", error);
    throw error;
  }
};

export const updateUserPassword = async (currentPasswordForReauth: string, newPasswordValue: string): Promise<void> => {
  const user = auth.currentUser;
   if (!user || !user.email) {
    throw new Error("User not found or current email is missing.");
  }
   if (!currentPasswordForReauth) {
     throw new Error("Current password is required to change password.");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPasswordForReauth);
  try {
    await reauthenticateWithCredential(user, credential);
    await firebaseUpdatePassword(user, newPasswordValue);
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};


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
        return 'The password is too weak. It must be at least 6 characters and meet complexity requirements.';
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
      case 'auth/requires-recent-login':
        return 'This operation is sensitive and requires recent authentication. Please log out and log back in, then try again.';
      case 'auth/too-many-requests':
        return 'We have detected too many requests from your device. Please try again later.';
      case 'auth/email-not-verified': // Though Firebase usually handles this before allowing sensitive operations
        return 'Your email address is not verified. Please check your email for a verification link.';
      default:
        return `An unexpected error occurred: ${authError.message} (Code: ${authError.code})`;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};
