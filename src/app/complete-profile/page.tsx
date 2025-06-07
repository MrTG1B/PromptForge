
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

interface StoredProfileData {
  fullName?: string;
  dateOfBirth?: string; // Store as ISO string
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
      // Pre-fill from Firebase Auth
      setValue('fullName', user.displayName || '');

      // Try to load other data from localStorage
      const storedDataString = localStorage.getItem(`profileData_${user.uid}`);
      if (storedDataString) {
        try {
          const storedData: StoredProfileData = JSON.parse(storedDataString);
          if (storedData.fullName && !user.displayName) setValue('fullName', storedData.fullName); // Prefer auth name if available
          if (storedData.dateOfBirth) setValue('dateOfBirth', new Date(storedData.dateOfBirth));
          if (storedData.mobileNumber) setValue('mobileNumber', storedData.mobileNumber);
        } catch (e) {
          console.error("Failed to parse stored profile data:", e);
        }
      }
      
      // Load profile picture from localStorage
      const storedImage = localStorage.getItem(`profilePicture_${user.uid}`);
      if (storedImage) {
        setPreview(storedImage);
      } else if (user.photoURL) { 
        // Fallback to auth photoURL if no local image, but local takes precedence for this page's preview
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
        // Revert to original if invalid file chosen
        const storedImage = user ? localStorage.getItem(`profilePicture_${user.uid}`) : null;
        setPreview(storedImage || user?.photoURL || null);
      }
    } else if (profilePictureFiles && profilePictureFiles.length === 0 && preview !== user?.photoURL) {
       // File input was cleared by user, and current preview isn't the auth.photoURL (meaning it was a local preview)
       // Set preview to null to indicate removal intention for localStorage, or fallback to auth.photoURL if it exists
       setPreview(user?.photoURL || null);
    }
  }, [profilePictureFiles, user, preview]);


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

    try {
      // Update Firebase Auth displayName
      await updateProfile(auth.currentUser, {
        displayName: data.fullName,
        // photoURL is NOT updated from localStorage image
      });
      toast({ title: "Display Name Updated!", description: "Your name in Firebase Auth is updated.", variant: "default" });
      
      // Handle profile picture with localStorage
      if (profilePictureFiles && profilePictureFiles.length > 0) {
        const file = profilePictureFiles[0];
        // Ensure preview has the Data URL from FileReader
        if (preview && preview.startsWith('data:image')) {
          localStorage.setItem(`profilePicture_${user.uid}`, preview);
          toast({ title: "Profile Picture Saved Locally", description: "Your new profile picture is saved in browser storage.", variant: "default"});
        }
      } else if (preview === null || (user.photoURL && preview === user.photoURL && (!profilePictureFiles || profilePictureFiles.length === 0) ) ) {
        // User cleared the input (preview is null), or it's showing auth.photoURL and they didn't select a new file
        // This means they intend to remove the locally stored picture
        const localPicExisted = localStorage.getItem(`profilePicture_${user.uid}`);
        if (localPicExisted){
            localStorage.removeItem(`profilePicture_${user.uid}`);
            toast({ title: "Local Profile Picture Removed", description: "Your locally stored profile picture has been removed.", variant: "default"});
        }
      }

      // Save other profile data to localStorage
      const profileDataToStore: StoredProfileData = {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : undefined,
        mobileNumber: data.mobileNumber,
      };
      localStorage.setItem(`profileData_${user.uid}`, JSON.stringify(profileDataToStore));
      
      console.log("Firebase Auth profile updated with displayName:", data.fullName);
      console.log("Profile data saved to localStorage for user " + user.uid + ":", profileDataToStore);
      if (preview && preview.startsWith('data:image')) {
        console.log("Profile picture Data URL (first 50 chars) saved to localStorage: ", preview.substring(0,50));
      }


      await new Promise(resolve => setTimeout(resolve, 300)); 

      toast({
        title: "Profile Information Updated!",
        description: "Your details have been successfully updated (name in Firebase, other data locally).",
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
              <Label htmlFor="profilePicture">Profile Picture (Optional, max 5MB, stored locally)</Label>
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

