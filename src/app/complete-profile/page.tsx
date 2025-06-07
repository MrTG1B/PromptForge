
// src/app/complete-profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const LOCAL_STORAGE_PROFILE_PIC_KEY_PREFIX = "promptForgeUserProfilePic_";

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

  // Effect to load image from localStorage on mount
  useEffect(() => {
    if (user?.uid) {
      const storedImage = localStorage.getItem(`${LOCAL_STORAGE_PROFILE_PIC_KEY_PREFIX}${user.uid}`);
      if (storedImage) {
        setPreview(storedImage);
      }
    }
  }, [user]);


  // Effect to update preview when a new file is selected
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
        // Clear preview if file is invalid, errors are handled by Zod
        setPreview(user?.uid ? localStorage.getItem(`${LOCAL_STORAGE_PROFILE_PIC_KEY_PREFIX}${user.uid}`) : null);
      }
    } else if (profilePictureFiles && profilePictureFiles.length === 0) {
        // If files are cleared from input, try to restore from localStorage or clear if nothing there
         setPreview(user?.uid ? localStorage.getItem(`${LOCAL_STORAGE_PROFILE_PIC_KEY_PREFIX}${user.uid}`) : null);
    }
  }, [profilePictureFiles, user?.uid]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsSubmitting(true);
    const { profilePicture, ...otherData } = data;
    
    if (profilePicture && profilePicture.length > 0 && user?.uid) {
      const file = profilePicture[0];
      // Check validity again just in case, though Zod should catch it
      if (ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE) {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            localStorage.setItem(`${LOCAL_STORAGE_PROFILE_PIC_KEY_PREFIX}${user.uid}`, reader.result as string);
            toast({
              title: "Profile Picture Saved!",
              description: "Your new profile picture has been saved locally.",
              variant: "default",
            });
          } catch (e: any) {
             console.error("Error saving image to localStorage:", e);
             let description = "Could not save image to local storage.";
             if (e.name === 'QuotaExceededError') {
                description = "Could not save image: Local storage quota exceeded. Please clear some space or use a smaller image.";
             }
             toast({
              title: "Storage Error",
              description: description,
              variant: "destructive",
            });
          }
        };
        reader.onerror = () => {
          console.error("Error reading file for localStorage");
          toast({
            title: "File Read Error",
            description: "Could not read the selected image file.",
            variant: "destructive",
          });
        };
        reader.readAsDataURL(file);
      } else {
         toast({
            title: "Invalid Image",
            description: "The selected image is not valid (type or size). Please check the requirements.",
            variant: "destructive",
        });
      }
    } else if ((!profilePicture || profilePicture.length === 0) && user?.uid) {
        // If user explicitly clears the file input and submits, remove from localStorage
        localStorage.removeItem(`${LOCAL_STORAGE_PROFILE_PIC_KEY_PREFIX}${user.uid}`);
        setPreview(null); // Clear preview as well
         toast({
            title: "Profile Picture Removed",
            description: "Your profile picture has been removed from local storage.",
            variant: "default",
        });
    }


    console.log("Profile data to save (excluding image which is in localStorage):", otherData);
    // TODO: Save otherData (fullName, dateOfBirth, mobileNumber) to your backend (e.g., Firestore) here.
    // Example: await updateUserProfileInFirestore(user.uid, otherData);

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call for other data

    toast({
      title: "Profile Updated!",
      description: "Your details have been processed. Profile picture is managed in local storage.",
    });
    // setValue('profilePicture', undefined); // Reset file input after "submission" if desired
    router.push('/'); 
    setIsSubmitting(false);
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

    