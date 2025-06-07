
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
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile, // Import updateProfile
  type UserCredential,
  type AuthError,
  type User as FirebaseUser,
  type ActionCodeSettings,
} from 'firebase/auth';
import { auth, db } from './config'; // Firebase app initialized with auth
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Firestore imports

export type User = FirebaseUser | null;

// Helper function to create user profile in Firestore
const createUserProfileInFirestore = async (
  userId: string, 
  email: string, 
  firstName: string, 
  lastName: string, 
  dobDay: string, 
  dobMonth: string, 
  dobYear: string, 
  mobileNumber: string
) => {
  const userDocRef = doc(db, "users", userId);
  try {
    await setDoc(userDocRef, {
      firstName,
      lastName,
      dobDay,
      dobMonth,
      dobYear,
      mobileNumber,
      email,
      emailVerified: false, // Email is not verified at this point
      photoURL: null, // No photoURL at signup
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true }); // merge: true is good practice if you might add fields later or if this function could be called again
  } catch (error) {
    console.error("Error creating user profile in Firestore:", error);
    // Decide if you want to throw the error or handle it, e.g., by attempting to delete the Firebase Auth user
    throw new Error("Failed to create user profile in database.");
  }
};


export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    // TODO: Optionally create/update user profile in Firestore for Google sign-ins too
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
    // TODO: Optionally create/update user profile in Firestore for Facebook sign-ins too
    return result.user;
  } catch (error) {
    console.error("Error during Facebook Sign-In:", error);
    throw error;
  }
};

export const signUpWithEmailPasswordAndSendVerification = async (
  email: string, 
  password: string,
  firstName: string,
  lastName: string,
  dobDay: string,
  dobMonth: string,
  dobYear: string,
  mobileNumber: string
): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user) {
      // 1. Update Firebase Auth display name
      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile(user, { displayName });

      // 2. Create user profile in Firestore
      await createUserProfileInFirestore(user.uid, email, firstName, lastName, dobDay, dobMonth, dobYear, mobileNumber);
      
      // 3. Send verification email
      const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteURL || siteURL.includes("your-site-url") || siteURL === "http://localhost:9000" || siteURL === "http://localhost:3000" || siteURL === "PLACEHOLDER_SITE_URL_NOT_SET_IN_ENV") {
        const errorMsg = `CRITICAL_CONFIG_ERROR (Firebase Auth - signUp): NEXT_PUBLIC_SITE_URL is not set correctly or is a placeholder/default local dev URL ("${siteURL}"). Email verification link will be incorrect for production. Please set this in your Vercel (or other hosting) environment variables to your production URL (e.g., https://prompt-forge-blond.vercel.app). For local development, ensure it points to your actual local dev server URL if not the default.`;
        console.error(errorMsg);
      }
      const actionCodeSettings: ActionCodeSettings = {
        url: siteURL ? `${siteURL}/?firstLogin=true` : ( (typeof window !== 'undefined' ? window.location.origin : '') + '/?firstLogin=true'),
        handleCodeInApp: true,
      };
      // This sendEmailVerification call uses the "Email address verification" template
      // configured in your Firebase console for initial user signup.
      await sendEmailVerification(user, actionCodeSettings);
    }
    return userCredential;
  } catch (error) {
    console.error("Error during Email/Password Sign-Up:", error);
    throw error; // Rethrow to be caught by the form handler
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
    
    // After requesting an email update, Firebase requires the new email to be verified.
    // This uses the "Email address verification" template from your Firebase console.
    const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteURL || siteURL.includes("your-site-url") || siteURL === "http://localhost:9000" || siteURL === "http://localhost:3000" || siteURL === "PLACEHOLDER_SITE_URL_NOT_SET_IN_ENV") {
        const errorMsg = `CRITICAL_CONFIG_ERROR (Firebase Auth - updateUserEmail): NEXT_PUBLIC_SITE_URL is not set correctly or is a placeholder/default local dev URL ("${siteURL}"). Email verification link for new email will be incorrect. Please set this in your Vercel environment variables.`;
        console.error(errorMsg);
      }
    const actionCodeSettings: ActionCodeSettings = {
      url: siteURL ? `${siteURL}/update-profile` : ( (typeof window !== 'undefined' ? window.location.origin : '') + '/update-profile'),
      handleCodeInApp: true,
    };
    await sendEmailVerification(user, actionCodeSettings); 
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

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  // This function uses the "Password reset" template configured in your Firebase console.
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteURL || siteURL.includes("your-site-url") || siteURL === "http://localhost:9000" || siteURL === "http://localhost:3000" || siteURL === "PLACEHOLDER_SITE_URL_NOT_SET_IN_ENV") {
        const errorMsg = `CRITICAL_CONFIG_ERROR (Firebase Auth - sendPasswordResetEmail): NEXT_PUBLIC_SITE_URL is not set correctly or is a placeholder/default local dev URL ("${siteURL}"). Password reset link will be incorrect. Please set this in your Vercel environment variables.`;
        console.error(errorMsg);
      }
  const actionCodeSettings: ActionCodeSettings = {
    url: siteURL ? `${siteURL}/login` : ( (typeof window !== 'undefined' ? window.location.origin : '') + '/login'), 
    handleCodeInApp: true,
  };
  try {
    await firebaseSendPasswordResetEmail(auth, email, actionCodeSettings);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    if ((error as AuthError).code === 'auth/invalid-email') {
        throw error; 
    }
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
        return 'The password is too weak. It must be at least 8 characters and meet complexity requirements.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email, or the password was incorrect.';
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
      case 'auth/email-not-verified': 
        return 'Your email address is not verified. Please check your email for a verification link.';
      default:
        return `An unexpected error occurred: ${authError.message} (Code: ${authError.code})`;
    }
  } else if (error && typeof error.message === 'string') {
    return error.message; // Catch custom errors thrown (like "Failed to create user profile in database.")
  }
  return 'An unexpected error occurred. Please try again.';
};
    