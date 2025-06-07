
// src/app/complete-profile/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Camera, KeyRound, Mail, Eye, EyeOff, Check, X, MailWarning, ShieldAlert } from 'lucide-react';
import { auth, db } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { storage as appwriteStorage } from '@/lib/appwrite/config';
import { ID } from 'appwrite';
import PhoneNumberInput from '@/components/ui/phone-number-input';
import { updateUserEmail, updateUserPassword, getFirebaseAuthErrorMessage } from '@/lib/firebase/auth';

import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;

if (!APPWRITE_BUCKET_ID || APPWRITE_BUCKET_ID === "your-profile-pictures-bucket-id" || APPWRITE_BUCKET_ID.includes("your-bucket-id")) {
  console.error(`CRITICAL_CONFIG_ERROR (CompleteProfilePage): NEXT_PUBLIC_APPWRITE_BUCKET_ID is not set correctly or is a placeholder. Current value: "${APPWRITE_BUCKET_ID}". Image uploads will fail.`);
}
if (!APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID === "YOUR_APPWRITE_PROJECT_ID_NOT_SET" || APPWRITE_PROJECT_ID.includes("your-project-id")) {
  console.error(`CRITICAL_CONFIG_ERROR (CompleteProfilePage): NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set correctly or is a placeholder. Current value: "${APPWRITE_PROJECT_ID}". Image URL construction might fail.`);
}
if (!APPWRITE_ENDPOINT || APPWRITE_ENDPOINT === "YOUR_APPWRITE_ENDPOINT_NOT_SET" || APPWRITE_ENDPOINT.includes("your-appwrite-instance.example.com")) {
  console.error(`CRITICAL_CONFIG_ERROR (CompleteProfilePage): NEXT_PUBLIC_APPWRITE_ENDPOINT is not set correctly or is a placeholder. Current value: "${APPWRITE_ENDPOINT}". Image URL construction might fail.`);
}

const currentYear = new Date().getFullYear();
const profileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  dobDay: z.string({ required_error: "Day is required." })
    .min(1, {message: "Day is required."})
    .refine(val => {
        const dayNum = parseInt(val, 10);
        return /^\d{1,2}$/.test(val) && dayNum >= 1 && dayNum <= 31;
    }, { message: "Day must be 1-31." }),
  dobMonth: z.string({ required_error: "Month is required." }).min(1, {message: "Month is required."}),
  dobYear: z.string({ required_error: "Year is required." })
    .length(4, { message: "Year must be 4 digits."})
    .refine(val => {
        const yearNum = parseInt(val, 10);
        return /^\d{4}$/.test(val) && yearNum >= 1900 && yearNum <= currentYear;
    }, { message: `Year must be between 1900 and ${currentYear}.` }),
  mobileNumber: z.string({ required_error: "Mobile number is required."})
    .min(1, { message: "Mobile number is required."}) 
    .regex(/^\+\d{1,3}\d{4,14}$/, { message: "Invalid mobile number format (e.g., +11234567890)."}),
}).refine(data => {
  const day = parseInt(data.dobDay, 10);
  const month = parseInt(data.dobMonth, 10);
  const year = parseInt(data.dobYear, 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return false;
  }
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === (month - 1) && date.getDate() === day;
}, {
  message: "The date of birth entered is not a valid date.",
  path: ["dobDay"], 
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface FirestoreProfileData {
  firstName?: string;
  lastName?: string;
  dobDay?: string;
  dobMonth?: string;
  dobYear?: string;
  mobileNumber?: string;
  photoURL?: string | null;
}

const monthOptions = [
  { value: "1", label: "January" }, { value: "2", label: "February" },
  { value: "3", label: "March" }, { value: "4", label: "April" },
  { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" },
  { value: "9", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" }
];

const passwordValidation = z.string()
  .min(8, { message: "Password must be at least 8 characters." })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
  .regex(/[0-9]/, { message: "Password must contain at least one number." })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character." });

const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: "Invalid email address." }),
  currentPasswordForEmail: z.string().min(1, { message: "Current password is required." }),
});
type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordValidation,
  confirmNewPassword: passwordValidation,
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password cannot be the same as the current password.",
  path: ["newPassword"],
});
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface PasswordCriteria {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialChar: boolean;
}
const initialPasswordCriteria: PasswordCriteria = { minLength: false, uppercase: false, lowercase: false, number: false, specialChar: false };


async function getCroppedImageFile(
  image: HTMLImageElement,
  crop: PixelCrop,
  originalFileName: string
): Promise<File | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error("Failed to get 2D context from canvas");
    return null;
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const sourceX = Math.max(0, crop.x * scaleX);
  const sourceY = Math.max(0, crop.y * scaleY);
  const sourceWidth = Math.min(image.naturalWidth - sourceX, crop.width * scaleX);
  const sourceHeight = Math.min(image.naturalHeight - sourceY, crop.height * scaleY);
  
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    console.error("Invalid crop dimensions (<=0). Width:", sourceWidth, "Height:", sourceHeight);
    return null;
  }

  canvas.width = sourceWidth;
  canvas.height = sourceHeight;

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Canvas toBlob returned null");
          reject(new Error('Canvas is empty or an error occurred during blob creation.'));
          return;
        }
        const fileType = ACCEPTED_IMAGE_TYPES.find(type => originalFileName.toLowerCase().endsWith(type.split('/')[1])) || 'image/png';
        resolve(new File([blob], originalFileName, { type: fileType }));
      },
      'image/png',
      0.95
    );
  });
}


export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('profile.png');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const [isEmailPasswordUser, setIsEmailPasswordUser] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showCurrentPasswordForEmail, setShowCurrentPasswordForEmail] = useState(false);
  const [showCurrentPasswordForPassword, setShowCurrentPasswordForPassword] = useState(false);

  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>(initialPasswordCriteria);
  const [showPasswordCriteriaUI, setShowPasswordCriteriaUI] = useState(false);


  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '', lastName: '', dobDay: '', dobMonth: '', dobYear: '', mobileNumber: '',
    }
  });
  const watchedFirstName = watch('firstName');
  const watchedLastName = watch('lastName');

  const { control: emailControl, register: emailRegister, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors }, reset: resetEmailForm } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
  });

  const { control: passwordControl, register: passwordRegister, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, watch: watchPasswordForm, reset: resetPasswordForm } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });
  const watchedNewPassword = watchPasswordForm("newPassword");

  useEffect(() => {
    if (user) {
      const providerIds = user.providerData.map(p => p.providerId);
      setIsEmailPasswordUser(providerIds.includes('password'));
    }
  }, [user]);

  useEffect(() => {
    if (watchedNewPassword !== undefined) {
      setNewPasswordValue(watchedNewPassword);
      setPasswordCriteria({
        minLength: watchedNewPassword.length >= 8,
        uppercase: /[A-Z]/.test(watchedNewPassword),
        lowercase: /[a-z]/.test(watchedNewPassword),
        number: /[0-9]/.test(watchedNewPassword),
        specialChar: /[^A-Za-z0-9]/.test(watchedNewPassword),
      });
    }
  }, [watchedNewPassword]);

 useEffect(() => {
    if (user) {
      const fetchProfileData = async () => {
        const userDocRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const firestoreData = docSnap.data() as FirestoreProfileData;
            setValue('firstName', firestoreData.firstName || user.displayName?.split(' ')[0] || '');
            setValue('lastName', firestoreData.lastName || user.displayName?.split(' ').slice(1).join(' ') || '');
            setValue('dobDay', firestoreData.dobDay || '');
            setValue('dobMonth', firestoreData.dobMonth || '');
            setValue('dobYear', firestoreData.dobYear || '');
            setValue('mobileNumber', firestoreData.mobileNumber || '');
            
            if (firestoreData.photoURL && !imgSrc && !croppedImageFile) {
              setPreview(firestoreData.photoURL);
            } else if (user.photoURL && !imgSrc && !croppedImageFile && !firestoreData.photoURL) {
              setPreview(user.photoURL);
            }
          } else {
            if (user.displayName) {
              const nameParts = user.displayName.split(' ');
              setValue('firstName', nameParts[0] || '');
              if (nameParts.length > 1) setValue('lastName', nameParts.slice(1).join(' ') || '');
            }
            if (user.photoURL && !imgSrc && !croppedImageFile) setPreview(user.photoURL);
          }
        } catch (error) {
          console.error("Error fetching profile data from Firestore:", error);
          toast({ title: "Error", description: "Could not fetch profile data.", variant: "destructive" });
            if (user.displayName) {
              const nameParts = user.displayName.split(' ');
              setValue('firstName', nameParts[0] || '');
              if (nameParts.length > 1) setValue('lastName', nameParts.slice(1).join(' ') || '');
            }
            if (user.photoURL && !imgSrc && !croppedImageFile) setPreview(user.photoURL);
        }
      };
      fetchProfileData();
    }
  }, [user, setValue, toast, imgSrc, croppedImageFile]);


  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `Max image size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`, variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setImgSrc(null);
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({ title: "Invalid file type", description: `Only JPG and PNG formats are supported.`, variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setImgSrc(null);
        return;
      }
      
      setOriginalFileName(file.name);
      setCrop(undefined); 
      setCompletedCrop(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropModalOpen(true); 
      });
      reader.readAsDataURL(file);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), 
      width,
      height
    );
    setCrop(initialCrop);
  }

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current || !imgSrc) {
      toast({ title: "Cropping Error", description: "Could not save crop. Please try again.", variant: "destructive" });
      return;
    }
    try {
      const croppedFile = await getCroppedImageFile(imgRef.current, completedCrop, originalFileName);
      if (croppedFile) {
        setCroppedImageFile(croppedFile);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(croppedFile);
        toast({ title: "Crop Saved", description: "Image crop applied and preview updated." });
      }
    } catch (e) {
      console.error('Error saving cropped image:', e);
      toast({ title: "Cropping Error", description: "Could not save crop.", variant: "destructive" });
    } finally {
      setIsCropModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const handleCancelCrop = () => {
    setImgSrc(null); 
    setCrop(undefined);
    setCompletedCrop(null);
    setIsCropModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
    if (user && user.photoURL && !croppedImageFile) setPreview(user.photoURL);
    else if (!croppedImageFile) setPreview(null); 
  };

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsSubmitting(true);
    if (!user || !auth.currentUser) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (isEmailPasswordUser && !user.emailVerified) {
      toast({ title: "Email Not Verified", description: "Please verify your email address before saving your profile.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (!APPWRITE_BUCKET_ID || !APPWRITE_PROJECT_ID || !APPWRITE_ENDPOINT || APPWRITE_BUCKET_ID.includes("your-") || APPWRITE_PROJECT_ID.includes("your-") || APPWRITE_ENDPOINT.includes("your-")) {
        toast({ title: "Configuration Error", description: "Appwrite is not configured correctly. Cannot upload image.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    let newPhotoURL = preview || user.photoURL; 
    const newDisplayName = `${data.firstName} ${data.lastName || ''}`.trim();

    try {
      if (croppedImageFile) { 
        toast({ title: "Uploading Profile Picture...", description: "Please wait.", variant: "default" });
        const appwriteFile = await appwriteStorage.createFile(APPWRITE_BUCKET_ID, ID.unique(), croppedImageFile);
        newPhotoURL = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${appwriteFile.$id}/view?project=${APPWRITE_PROJECT_ID}`;
        toast({ title: "Image Uploaded!", description: "Profile picture successfully uploaded."});
      }

      await updateProfile(auth.currentUser, { displayName: newDisplayName, photoURL: newPhotoURL });

      const userDocRef = doc(db, "users", user.uid);
      const profileDataForFirestore: FirestoreProfileData & { updatedAt: any; email: string | null; emailVerified: boolean } = {
        firstName: data.firstName,
        lastName: data.lastName,
        dobDay: data.dobDay,
        dobMonth: data.dobMonth,
        dobYear: data.dobYear,
        mobileNumber: data.mobileNumber,
        photoURL: newPhotoURL,
        email: user.email,
        emailVerified: user.emailVerified,
        updatedAt: serverTimestamp()
      };
      await setDoc(userDocRef, profileDataForFirestore, { merge: true });
      
      toast({ title: "Profile Updated!", description: "Your profile has been successfully updated." });
      router.push('/');
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onChangeEmailSubmit: SubmitHandler<ChangeEmailFormValues> = async (data) => {
    setIsChangingEmail(true);
    try {
      await updateUserEmail(data.currentPasswordForEmail, data.newEmail);
      toast({ title: "Email Update Initiated", description: "A verification email has been sent to your new address. Please verify to complete the change.", duration: 7000 });
      resetEmailForm();
      // Optionally, refresh user data or UI here, or sign out to force re-login with new email.
      // For simplicity, we'll let Firebase handle the email change and user will see it on next login or refresh.
      auth.currentUser?.reload(); // Attempt to reload user data
    } catch (error: any) {
      toast({ title: "Email Change Failed", description: getFirebaseAuthErrorMessage(error), variant: "destructive" });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const onChangePasswordSubmit: SubmitHandler<ChangePasswordFormValues> = async (data) => {
    setIsChangingPassword(true);
    try {
      await updateUserPassword(data.currentPassword, data.newPassword);
      toast({ title: "Password Changed!", description: "Your password has been successfully updated." });
      resetPasswordForm();
      setShowPasswordCriteriaUI(false);
    } catch (error: any) {
      toast({ title: "Password Change Failed", description: getFirebaseAuthErrorMessage(error), variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const getFormInitials = () => {
    const fName = watchedFirstName || '';
    const lName = watchedLastName || '';
    if (fName && lName) return `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase();
    if (fName) return fName.charAt(0).toUpperCase();
    return null;
  };

  const PasswordRequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <li className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-red-600'}`}>
      {met ? <Check className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
      {text}
    </li>
  );

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const mainFormDisabled = isSubmitting || (isCropModalOpen && (!completedCrop && !preview)) || (isEmailPasswordUser && user && !user.emailVerified);

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Update Your Profile</CardTitle>
          <CardDescription>Keep your information current. Email/password changes only for direct signups.</CardDescription>
        </CardHeader>
        <CardContent>
          {isEmailPasswordUser && user && !user.emailVerified && (
            <Alert variant="destructive" className="mb-6">
              <MailWarning className="h-4 w-4" />
              <AlertTitle>Email Verification Required</AlertTitle>
              <AlertDescription>
                A verification email was sent to <strong>{user.email}</strong>. Please click the link in the email to verify your account before saving changes.
                If you haven&apos;t received it, check your spam folder.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-center mb-6">
              <button type="button" onClick={triggerFileInput} className="w-32 h-32 rounded-full border-2 border-dashed border-primary flex items-center justify-center cursor-pointer overflow-hidden relative bg-muted hover:bg-muted/80 transition-colors group" aria-label="Upload profile picture">
                {preview ? (
                  <Image src={preview} alt="Profile preview" fill className="object-cover" key={preview} unoptimized={preview.startsWith('blob:') || preview.startsWith('data:')} />
                ) : (
                  (() => {
                    const formInitials = getFormInitials();
                    if (formInitials) return <span className="text-4xl font-semibold text-primary">{formInitials}</span>;
                    return <Camera className="w-12 h-12 text-primary/70 group-hover:text-primary transition-colors" />;
                  })()
                )}
              </button>
              <Input id="profilePictureInput" type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} className="hidden" ref={fileInputRef} onChange={onSelectFile} />
            </div>
            
            <Dialog open={isCropModalOpen} onOpenChange={(isOpen) => { if (!isOpen) handleCancelCrop(); setIsCropModalOpen(isOpen); }}>
              <DialogContent className="sm:max-w-[425px] md:max-w-lg">
                <DialogHeader><DialogTitle>Crop Your Image</DialogTitle></DialogHeader>
                {imgSrc && (
                  <div className="mt-4 p-2 border rounded-md bg-muted/30 max-h-[60vh] overflow-y-auto">
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1} circularCrop minWidth={50} minHeight={50} ruleOfThirds>
                      <img alt="Crop me" src={imgSrc} ref={imgRef} onLoad={onImageLoad} style={{ maxHeight: '50vh', display: 'block', margin: 'auto', objectFit: 'contain' }} />
                    </ReactCrop>
                  </div>
                )}
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={handleCancelCrop}>Cancel</Button>
                  <Button type="button" onClick={handleSaveCrop} disabled={!completedCrop}>Save Crop</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} placeholder="e.g., Jane" aria-invalid={errors.firstName ? "true" : "false"} />
                {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} placeholder="e.g., Doe" aria-invalid={errors.lastName ? "true" : "false"} />
                {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <Label>Date of Birth</Label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                <div>
                  <Label htmlFor="dobDay" className="sr-only">Day</Label>
                  <Input id="dobDay" type="number" {...register("dobDay")} placeholder="DD" aria-invalid={errors.dobDay ? "true" : "false"} />
                  {errors.dobDay && <p className="text-sm text-destructive mt-1">{errors.dobDay.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dobMonth" className="sr-only">Month</Label>
                  <Controller name="dobMonth" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={field.disabled}>
                      <SelectTrigger id="dobMonth" aria-label="Month" aria-invalid={errors.dobMonth ? "true" : "false"}><SelectValue placeholder="Month" /></SelectTrigger>
                      <SelectContent>{monthOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                    </Select>
                  )} />
                   {errors.dobMonth && <p className="text-sm text-destructive mt-1">{errors.dobMonth.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dobYear" className="sr-only">Year</Label>
                  <Input id="dobYear" type="number" {...register("dobYear")} placeholder="YYYY" aria-invalid={errors.dobYear ? "true" : "false"} />
                  {errors.dobYear && <p className="text-sm text-destructive mt-1">{errors.dobYear.message}</p>}
                </div>
              </div>
              {errors.root?.message && !errors.dobDay && !errors.dobMonth && !errors.dobYear && (<p className="text-sm text-destructive mt-1 col-span-3">{errors.root.message}</p>)}
            </div>

            <div>
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Controller name="mobileNumber" control={control} defaultValue="" render={({ field }) => (<PhoneNumberInput value={field.value} onChange={field.onChange} defaultCountry="IN" disabled={field.disabled} />)} />
              {errors.mobileNumber && <p className="text-sm text-destructive mt-1">{errors.mobileNumber.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={mainFormDisabled}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Save and Continue
            </Button>
          </form>

          {isEmailPasswordUser && (
            <Accordion type="single" collapsible className="w-full mt-8 pt-6 border-t">
              <AccordionItem value="change-email">
                <AccordionTrigger>
                  <div className="flex items-center gap-2"> <Mail className="h-5 w-5 text-primary" /> Change Email </div>
                </AccordionTrigger>
                <AccordionContent>
                  <form onSubmit={handleEmailSubmit(onChangeEmailSubmit)} className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="newEmail">New Email Address</Label>
                      <Input id="newEmail" type="email" {...emailRegister("newEmail")} placeholder="new.email@example.com" aria-invalid={emailErrors.newEmail ? "true" : "false"} />
                      {emailErrors.newEmail && <p className="text-sm text-destructive mt-1">{emailErrors.newEmail.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="currentPasswordForEmail">Current Password</Label>
                      <div className="relative">
                        <Input id="currentPasswordForEmail" type={showCurrentPasswordForEmail ? "text" : "password"} {...emailRegister("currentPasswordForEmail")} placeholder="••••••••" aria-invalid={emailErrors.currentPasswordForEmail ? "true" : "false"} className="pr-10" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" onClick={() => setShowCurrentPasswordForEmail(!showCurrentPasswordForEmail)}>
                          {showCurrentPasswordForEmail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {emailErrors.currentPasswordForEmail && <p className="text-sm text-destructive mt-1">{emailErrors.currentPasswordForEmail.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isChangingEmail || !user?.emailVerified}>
                      {isChangingEmail ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2 h-4 w-4" />}
                      Save New Email
                    </Button>
                    {!user?.emailVerified && <p className="text-xs text-destructive text-center mt-1">Verify your current email to change it.</p>}
                  </form>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="change-password">
                <AccordionTrigger>
                  <div className="flex items-center gap-2"> <KeyRound className="h-5 w-5 text-primary" /> Change Password </div>
                </AccordionTrigger>
                <AccordionContent>
                  <form onSubmit={handlePasswordSubmit(onChangePasswordSubmit)} className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                       <div className="relative">
                        <Input id="currentPassword" type={showCurrentPasswordForPassword ? "text" : "password"} {...passwordRegister("currentPassword")} placeholder="••••••••" aria-invalid={passwordErrors.currentPassword ? "true" : "false"} className="pr-10" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" onClick={() => setShowCurrentPasswordForPassword(!showCurrentPasswordForPassword)}>
                            {showCurrentPasswordForPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                       </div>
                      {passwordErrors.currentPassword && <p className="text-sm text-destructive mt-1">{passwordErrors.currentPassword.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input id="newPassword" type={showNewPassword ? "text" : "password"} {...passwordRegister("newPassword")} placeholder="Enter new password" aria-invalid={passwordErrors.newPassword ? "true" : "false"} className="pr-10" onFocus={() => setShowPasswordCriteriaUI(true)} />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" onClick={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {passwordErrors.newPassword && <p className="text-sm text-destructive mt-1">{passwordErrors.newPassword.message}</p>}
                       {showPasswordCriteriaUI && (
                        <ul className="mt-2 space-y-1 p-3 bg-muted/50 rounded-md">
                          <PasswordRequirementItem met={passwordCriteria.minLength} text="At least 8 characters" />
                          <PasswordRequirementItem met={passwordCriteria.uppercase} text="At least one uppercase letter (A-Z)" />
                          <PasswordRequirementItem met={passwordCriteria.lowercase} text="At least one lowercase letter (a-z)" />
                          <PasswordRequirementItem met={passwordCriteria.number} text="At least one number (0-9)" />
                          <PasswordRequirementItem met={passwordCriteria.specialChar} text="At least one special character (e.g., !@#$%)" />
                        </ul>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input id="confirmNewPassword" type={showConfirmNewPassword ? "text" : "password"} {...passwordRegister("confirmNewPassword")} placeholder="Re-enter new password" aria-invalid={passwordErrors.confirmNewPassword ? "true" : "false"} className="pr-10" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                            {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {passwordErrors.confirmNewPassword && <p className="text-sm text-destructive mt-1">{passwordErrors.confirmNewPassword.message}</p>}
                    </div>
                     <Button type="submit" className="w-full" disabled={isChangingPassword || !user?.emailVerified}>
                       {isChangingPassword ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2 h-4 w-4" />}
                      Change Password
                    </Button>
                     {!user?.emailVerified && <p className="text-xs text-destructive text-center mt-1">Verify your email to change password.</p>}
                  </form>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
         <CardFooter className="flex justify-center text-sm text-muted-foreground pt-4">
          <Link href="/" passHref>
            <Button variant="outline" size="sm">
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
