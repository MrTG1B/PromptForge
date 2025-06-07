
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
import { auth } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';
import { storage as appwriteStorage } from '@/lib/appwrite/config'; // Import Appwrite storage
import { ID } from 'appwrite';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Read Appwrite config from environment variables
const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;


// Enhanced initial console checks
if (!APPWRITE_BUCKET_ID || APPWRITE_BUCKET_ID === "your-profile-pictures-bucket-id" || APPWRITE_BUCKET_ID.includes("your-bucket-id")) {
  console.error(`CRITICAL_CONFIG_ERROR (CompleteProfilePage): NEXT_PUBLIC_APPWRITE_BUCKET_ID is not set correctly or is a placeholder. Current value: "${APPWRITE_BUCKET_ID}". Image uploads will fail.`);
}
if (!APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID === "YOUR_APPWRITE_PROJECT_ID_NOT_SET" || APPWRITE_PROJECT_ID.includes("your-project-id")) {
  console.error(`CRITICAL_CONFIG_ERROR (CompleteProfilePage): NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set correctly or is a placeholder. Current value: "${APPWRITE_PROJECT_ID}". Image URL construction might fail.`);
}
if (!APPWRITE_ENDPOINT || APPWRITE_ENDPOINT === "YOUR_APPWRITE_ENDPOINT_NOT_SET" || APPWRITE_ENDPOINT.includes("your-appwrite-instance.example.com")) {
  console.error(`CRITICAL_CONFIG_ERROR (CompleteProfilePage): NEXT_PUBLIC_APPWRITE_ENDPOINT is not set correctly or is a placeholder. Current value: "${APPWRITE_ENDPOINT}". Image URL construction might fail.`);
}


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

interface StoredProfileData {
  fullName?: string; 
  dateOfBirth?: string; 
  mobileNumber?: string;
}

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
      setPreview(user.photoURL || null); 

      const storedDataString = localStorage.getItem(`profileData_${user.uid}`);
      if (storedDataString) {
        try {
          const storedData: StoredProfileData = JSON.parse(storedDataString);
          if (storedData.fullName && !user.displayName) setValue('fullName', storedData.fullName);
          if (storedData.dateOfBirth) setValue('dateOfBirth', new Date(storedData.dateOfBirth));
          if (storedData.mobileNumber) setValue('mobileNumber', storedData.mobileNumber);
        } catch (e) {
          console.error("Failed to parse stored profile data:", e);
        }
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
        setPreview(user?.photoURL || null); 
      }
    } else if (profilePictureFiles && profilePictureFiles.length === 0) {
      setPreview(user?.photoURL || null); 
    }
  }, [profilePictureFiles, user]);


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

    console.log("Attempting Appwrite Upload. Config used:");
    console.log("APPWRITE_ENDPOINT:", APPWRITE_ENDPOINT);
    console.log("APPWRITE_PROJECT_ID:", APPWRITE_PROJECT_ID);
    console.log("APPWRITE_BUCKET_ID:", APPWRITE_BUCKET_ID);


    if (!APPWRITE_BUCKET_ID || !APPWRITE_PROJECT_ID || !APPWRITE_ENDPOINT || APPWRITE_BUCKET_ID.includes("your-") || APPWRITE_PROJECT_ID.includes("your-") || APPWRITE_ENDPOINT.includes("your-")) {
        toast({ title: "Configuration Error", description: "Appwrite is not configured correctly in environment variables. Cannot upload image.", variant: "destructive" });
        console.error("Appwrite onSubmit Configuration Error: One or more Appwrite ENV VARS are missing or placeholders.");
        setIsSubmitting(false);
        return;
    }

    let newPhotoURL = user.photoURL; 

    try {
      if (profilePictureFiles && profilePictureFiles.length > 0) {
        const file = profilePictureFiles[0];
        try {
          toast({ title: "Uploading Image...", description: "Please wait while your image is uploaded to Appwrite.", variant: "default" });
          
          console.log(`Uploading to Appwrite Bucket: ${APPWRITE_BUCKET_ID} with File ID: unique`);
          const appwriteFile = await appwriteStorage.createFile(
            APPWRITE_BUCKET_ID,
            ID.unique(), 
            file
          );
          
          newPhotoURL = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${appwriteFile.$id}/view?project=${APPWRITE_PROJECT_ID}`;
          console.log("Image uploaded to Appwrite. File ID:", appwriteFile.$id, "Constructed URL:", newPhotoURL);
          toast({ title: "Image Uploaded!", description: "Profile picture successfully uploaded to Appwrite.", variant: "default"});
        } catch (uploadError: any) {
          console.error("Appwrite upload error:", uploadError);
          toast({ title: "Upload Failed", description: `Could not upload image to Appwrite: ${uploadError.message || 'Unknown error. Check console and Appwrite CORS/permissions.'}`, variant: "destructive" });
          setIsSubmitting(false);
          return; 
        }
      } else if (profilePictureFiles && profilePictureFiles.length === 0 && user.photoURL && !preview) {
        // This condition means the user cleared the file input, intending to remove the picture.
        // If Appwrite stored an old file ID, this is where you'd call appwriteStorage.deleteFile(...)
        // For now, we'll just nullify the photoURL in Firebase Auth.
        newPhotoURL = null; 
        toast({ title: "Profile Picture Removed", description: "Your profile picture will be removed from your Firebase profile.", variant: "default"});
      }


      await updateProfile(auth.currentUser, {
        displayName: data.fullName,
        photoURL: newPhotoURL,
      });
      
      console.log("Firebase Auth profile updated. Name:", data.fullName, "PhotoURL:", newPhotoURL);

      const profileDataToStore: StoredProfileData = {
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : undefined,
        mobileNumber: data.mobileNumber,
      };
      localStorage.setItem(`profileData_${user.uid}`, JSON.stringify(profileDataToStore));
      console.log("Other profile data saved to localStorage:", profileDataToStore);

      toast({
        title: "Profile Updated!",
        description: "Your Firebase profile has been updated. Other details saved locally.",
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
            Help us get to know you better by providing a few more details. Profile picture uses Appwrite.
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
              <Label htmlFor="profilePicture">Profile Picture (Optional, max 5MB, uses Appwrite Storage)</Label>
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
                  <Image 
                    src={preview} 
                    alt="Profile preview" 
                    width={100} 
                    height={100} 
                    className="rounded-full object-cover border shadow-sm" 
                    key={preview} // Add key to force re-render if src changes but is same string (e.g. after upload)
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="mobileNumber">Mobile Number (Optional, stored locally)</Label>
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
