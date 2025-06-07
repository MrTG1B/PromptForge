
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
  sendPasswordResetEmail as firebaseAuthSendPasswordResetEmail, // Renamed for clarity
  updateProfile,
  type UserCredential,
  type AuthError,
  type User as FirebaseUser,
  type ActionCodeSettings,
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'; // Added Firestore query imports

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
      emailVerified: false,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error creating user profile in Firestore:", error);
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
      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile(user, { displayName });
      await createUserProfileInFirestore(user.uid, email, firstName, lastName, dobDay, dobMonth, dobYear, mobileNumber);

      const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteURL || siteURL.includes("your-site-url") || siteURL === "http://localhost:9000" || siteURL === "http://localhost:3000" || siteURL === "PLACEHOLDER_SITE_URL_NOT_SET_IN_ENV") {
        const errorMsg = `CRITICAL_CONFIG_ERROR (Firebase Auth - signUp): NEXT_PUBLIC_SITE_URL is not set correctly or is a placeholder/default local dev URL ("${siteURL}"). Email verification link will be incorrect for production. Please set this in your Vercel (or other hosting) environment variables to your production URL (e.g., https://prompt-forge-blond.vercel.app). For local development, ensure it points to your actual local dev server URL if not the default.`;
        console.error(errorMsg);
      }
      const actionCodeSettings: ActionCodeSettings = {
        url: siteURL ? `${siteURL}/?firstLogin=true` : (((typeof window !== 'undefined' ? window.location.origin : '') || 'http://localhost:9002') + '/?firstLogin=true'),
        handleCodeInApp: true,
      };
      // This sendEmailVerification call uses the "Email address verification" template
      // configured in your Firebase console for initial user signup.
      await sendEmailVerification(user, actionCodeSettings);
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
      url: siteURL ? `${siteURL}/update-profile` : (((typeof window !== 'undefined' ? window.location.origin : '') || 'http://localhost:9002') + '/update-profile'),
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
  // First, check if the email exists in the Firestore 'users' collection.
  const usersCollectionRef = collection(db, "users");
  const q = query(usersCollectionRef, where("email", "==", email));

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // Email not found in Firestore
      const customError: AuthError = {
        code: 'auth/email-not-registered',
        message: 'This email is not associated with an account in our system.',
        name: 'FirebaseAuthError' // Keep a consistent name format if needed by error handlers
      };
      throw customError;
    }

    // Email found in Firestore, proceed with Firebase Auth password reset
    const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteURL || siteURL.includes("your-site-url") || siteURL === "http://localhost:9000" || siteURL === "http://localhost:3000" || siteURL === "PLACEHOLDER_SITE_URL_NOT_SET_IN_ENV") {
      const errorMsg = `CRITICAL_CONFIG_ERROR (Firebase Auth - sendPasswordResetEmail): NEXT_PUBLIC_SITE_URL is not set correctly or is a placeholder/default local dev URL ("${siteURL}"). Password reset link will be incorrect. Please set this in your Vercel environment variables.`;
      console.error(errorMsg);
    }
    const actionCodeSettings: ActionCodeSettings = {
      url: siteURL ? `${siteURL}/login` : (((typeof window !== 'undefined' ? window.location.origin : '') || 'http://localhost:9002') + '/login'),
      handleCodeInApp: true,
    };
    await firebaseAuthSendPasswordResetEmail(auth, email, actionCodeSettings);
  } catch (error) {
    console.error("Error in sendPasswordResetEmail process:", error);
    // Rethrow the error (either the custom one or from Firebase Auth)
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
        return 'The password is too weak. It must be at least 8 characters and meet complexity requirements.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found': // Firebase's own user-not-found
        return 'No user found with this email in Firebase Authentication, or the password was incorrect.';
      case 'auth/email-not-registered': // Our custom error
        return 'This email is not associated with an account. Please check the email address and try again.';
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
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};
