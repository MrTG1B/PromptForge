
// src/app/complete-profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, ArrowRight } from 'lucide-react';
import { auth, app } from '@/lib/firebase/config'; // Import auth and app
import { updateProfile } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }).optional(),
  profilePicture: z
    .instanceof(FileList)
    .optional()
    .refine(
        (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
        `Max image size is 5MB.`
    )
    .refine(
        (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
        `Only .jpg, .jpeg, .png, and .webp formats are supported.`
    ),
  mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid mobile number format (e.g., +1234567890 or 1234567890)."}).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const storage = getStorage(app);

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { control, register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      mobileNumber: '',
    }
  });

  const profilePictureFiles = watch("profilePicture");

  useEffect(() => {
    if (user) {
      setValue('fullName', user.displayName || '');
      // For DOB and mobile, you'd typically load these from your backend profile data
      // For now, we only prefill name from Auth
      if (user.photoURL) {
        setPreview(user.photoURL);
      }
    }
  }, [user, setValue]);

  useEffect(() => {
    if (profilePictureFiles && profilePictureFiles.length > 0) {
      const file = profilePictureFiles[0];
      if (ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(user?.photoURL || null); // Revert to original if invalid file chosen
      }
    } else if (profilePictureFiles && profilePictureFiles.length === 0) {
      // File input was cleared
      setPreview(null); // User intends to remove or not set a picture
    }
  }, [profilePictureFiles, user?.photoURL]);


  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsSubmitting(true);
    if (!user || !auth.currentUser) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const { profilePicture, ...otherProfileData } = data;
    let newPhotoURL: string | null = user.photoURL; // Default to existing photoURL

    try {
      if (profilePicture && profilePicture.length > 0) {
        const file = profilePicture[0];
        // Zod validation for type/size should have run, but good to be aware
        const filePath = `profile-pictures/${user.uid}/${Date.now()}_${file.name}`;
        const fileRef = storageRef(storage, filePath);

        toast({ title: "Uploading Picture...", description: "Please wait.", variant: "default" });
        await uploadBytes(fileRef, file);
        newPhotoURL = await getDownloadURL(fileRef);
        toast({ title: "Picture Uploaded!", description: "Your new profile picture is saved.", variant: "default" });
      } else if (preview === null && user.photoURL) {
        // User cleared the input and there was an existing photoURL, so they intend to remove it.
        newPhotoURL = null;
        toast({ title: "Profile Picture Removed", description: "Your profile picture will be removed.", variant: "default"});
        // Optional: Delete old file from Firebase Storage here if you stored its path previously.
        // For simplicity, we are only removing it from the Auth profile.
      }

      await updateProfile(auth.currentUser, {
        displayName: data.fullName,
        photoURL: newPhotoURL,
      });
      
      // TODO: Save otherProfileData (dateOfBirth, mobileNumber) and potentially newPhotoURL to your backend (e.g., Firestore) here.
      // Example: await updateUserProfileInFirestore(user.uid, { ...otherProfileData, photoURL: newPhotoURL });
      console.log("Profile data to save to backend (excluding image which is in Auth profile):", otherProfileData);
      console.log("Firebase Auth profile updated with displayName and photoURL:", newPhotoURL);

      await new Promise(resolve => setTimeout(resolve, 300)); 

      toast({
        title: "Profile Updated!",
        description: "Your details have been successfully updated.",
      });
      router.push('/');
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date();
  const hundredYearsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 100));

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <UserCheck className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="font-headline text-3xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Help us get to know you better by providing a few more details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register("fullName")} placeholder="e.g., Jane Doe" aria-invalid={errors.fullName ? "true" : "false"} />
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                    placeholder="Select your date of birth"
                    fromDate={hundredYearsAgo}
                    toDate={today}
                    captionLayout="dropdown-buttons"
                  />
                )}
              />
              {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <Label htmlFor="profilePicture">Profile Picture (Optional, max 5MB)</Label>
              <Input
                id="profilePicture"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                {...register("profilePicture")}
                aria-invalid={errors.profilePicture ? "true" : "false"}
                className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-input file:bg-background file:text-sm file:font-medium file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground"
              />
              {errors.profilePicture && <p className="text-sm text-destructive mt-1">{errors.profilePicture.message as string}</p>}
              {preview && (
                <div className="mt-4">
                  <Image src={preview} alt="Profile preview" width={100} height={100} className="rounded-full object-cover border shadow-sm" />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
              <Input id="mobileNumber" {...register("mobileNumber")} placeholder="e.g., +11234567890" aria-invalid={errors.mobileNumber ? "true" : "false"} />
              {errors.mobileNumber && <p className="text-sm text-destructive mt-1">{errors.mobileNumber.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Save and Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
