
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Crop, Camera } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';
import { storage as appwriteStorage } from '@/lib/appwrite/config';
import { ID } from 'appwrite';

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
  fullName: z.string().min(1, { message: "Full name is required." }),
  dobDay: z.string().optional().refine(val => {
    if (!val) return true; 
    const dayNum = parseInt(val, 10);
    return /^\d{1,2}$/.test(val) && dayNum >= 1 && dayNum <= 31;
  }, { message: "Day must be 1-31." }),
  dobMonth: z.string().optional(),
  dobYear: z.string().optional().refine(val => {
    if (!val) return true; 
    const yearNum = parseInt(val, 10);
    return /^\d{4}$/.test(val) && yearNum >= 1900 && yearNum <= currentYear;
  }, { message: `Year must be 1900-${currentYear}.` }),
  mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid mobile number format (e.g., +1234567890 or 1234567890)."}).optional().or(z.literal('')),
}).refine(data => {
  const { dobDay, dobMonth, dobYear } = data;
  if ((dobDay || dobMonth || dobYear) && (!dobDay || !dobMonth || !dobYear)) {
    return false;
  }
  if (dobDay && dobMonth && dobYear) {
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === (month - 1) && date.getDate() === day;
  }
  return true;
}, {
  message: "Please enter a complete and valid date of birth, or leave all date fields empty.",
  path: ["dobDay"], 
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface StoredProfileData {
  fullName?: string;
  dobDay?: string;
  dobMonth?: string;
  dobYear?: string;
  mobileNumber?: string;
}

const monthOptions = [
  { value: "1", label: "January" }, { value: "2", label: "February" },
  { value: "3", label: "March" }, { value: "4", label: "April" },
  { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" },
  { value: "9", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" }
];

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

  const sourceX = crop.x * scaleX;
  const sourceY = crop.y * scaleY;
  const sourceWidth = crop.width * scaleX;
  const sourceHeight = crop.height * scaleY;

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


  const { control, register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      dobDay: '',
      dobMonth: '',
      dobYear: '',
      mobileNumber: '',
    }
  });

  useEffect(() => {
    if (user) {
      setValue('fullName', user.displayName || '');
      if (user.photoURL) {
        setPreview(user.photoURL); 
      }

      const storedDataString = localStorage.getItem(`profileData_${user.uid}`);
      if (storedDataString) {
        try {
          const storedData: StoredProfileData = JSON.parse(storedDataString);
          if (storedData.fullName && !user.displayName) setValue('fullName', storedData.fullName);
          if (storedData.dobDay) setValue('dobDay', storedData.dobDay);
          if (storedData.dobMonth) setValue('dobMonth', storedData.dobMonth);
          if (storedData.dobYear) setValue('dobYear', storedData.dobYear);
          if (storedData.mobileNumber) setValue('mobileNumber', storedData.mobileNumber);
        } catch (e) {
          console.error("Failed to parse stored profile data:", e);
        }
      }
    }
  }, [user, setValue]);


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
      setCroppedImageFile(null); 
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
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(croppedFile);
        toast({ title: "Crop Saved", description: "Image crop applied.", variant: "default" });
      }
    } catch (e) {
      console.error('Error saving cropped image:', e);
      toast({ title: "Cropping Error", description: "Could not save crop.", variant: "destructive" });
    } finally {
      setIsCropModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input after modal closes
    }
  };

  const handleCancelCrop = () => {
    setImgSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setIsCropModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
  };

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
      if (croppedImageFile) { 
        try {
          toast({ title: "Uploading Cropped Image...", description: "Please wait while your image is uploaded to Appwrite.", variant: "default" });
          
          console.log(`Uploading cropped image to Appwrite Bucket: ${APPWRITE_BUCKET_ID} with File ID: unique`);
          const appwriteFile = await appwriteStorage.createFile(
            APPWRITE_BUCKET_ID,
            ID.unique(),
            croppedImageFile 
          );
          
          newPhotoURL = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${appwriteFile.$id}/view?project=${APPWRITE_PROJECT_ID}`;
          console.log("Cropped image uploaded to Appwrite. File ID:", appwriteFile.$id, "Constructed URL:", newPhotoURL);
          toast({ title: "Image Uploaded!", description: "Profile picture successfully uploaded to Appwrite.", variant: "default"});
        } catch (uploadError: any) {
          console.error("Appwrite upload error:", uploadError);
          toast({ title: "Upload Failed", description: `Could not upload image to Appwrite: ${uploadError.message || 'Unknown error. Check console and Appwrite CORS/permissions.'}`, variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }

      await updateProfile(auth.currentUser, {
        displayName: data.fullName,
        photoURL: newPhotoURL,
      });
      
      console.log("Firebase Auth profile updated. Name:", data.fullName, "PhotoURL:", newPhotoURL);

      const profileDataToStore: StoredProfileData = {
        dobDay: data.dobDay,
        dobMonth: data.dobMonth,
        dobYear: data.dobYear,
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
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Personalize your experience by adding and cropping a profile photo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={triggerFileInput}
                className="w-32 h-32 rounded-full border-2 border-dashed border-primary flex items-center justify-center cursor-pointer overflow-hidden relative bg-muted hover:bg-muted/80 transition-colors group"
                aria-label="Upload profile picture"
              >
                {preview ? (
                  <Image
                    src={preview} 
                    alt="Profile preview"
                    fill
                    className="object-cover"
                    key={preview} 
                    unoptimized={preview.startsWith('blob:') || preview.startsWith('data:')}
                  />
                ) : (
                  <Camera className="w-12 h-12 text-primary/70 group-hover:text-primary transition-colors" />
                )}
              </button>
              <Input
                id="profilePictureInput"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                className="hidden"
                ref={fileInputRef}
                onChange={onSelectFile}
              />
            </div>
            
            <Dialog open={isCropModalOpen} onOpenChange={(isOpen) => {
                if (!isOpen) handleCancelCrop(); // Handle user closing modal (e.g., Esc key)
                else setIsCropModalOpen(isOpen);
             }}>
              <DialogContent className="sm:max-w-[425px] md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crop Your Image</DialogTitle>
                </DialogHeader>
                {imgSrc && (
                  <div className="mt-4 p-2 border rounded-md bg-muted/30">
                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => setCompletedCrop(c)}
                      aspect={1} 
                      circularCrop={true}
                      minWidth={50}
                      minHeight={50}
                      ruleOfThirds
                    >
                      <img
                        alt="Crop me"
                        src={imgSrc}
                        ref={imgRef}
                        onLoad={onImageLoad}
                        style={{ maxHeight: '400px', display: 'block', margin: 'auto' }}
                      />
                    </ReactCrop>
                  </div>
                )}
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={handleCancelCrop}>Cancel</Button>
                  <Button type="button" onClick={handleSaveCrop} disabled={!completedCrop}>Save Crop</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>


            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register("fullName")} placeholder="e.g., Jane Doe" aria-invalid={errors.fullName ? "true" : "false"} />
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <Label>Date of Birth (Optional)</Label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                <div>
                  <Label htmlFor="dobDay" className="sr-only">Day</Label>
                  <Input id="dobDay" type="number" {...register("dobDay")} placeholder="DD" aria-invalid={errors.dobDay ? "true" : "false"} />
                </div>
                <div>
                  <Label htmlFor="dobMonth" className="sr-only">Month</Label>
                  <Controller
                    name="dobMonth"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={field.disabled}>
                        <SelectTrigger id="dobMonth" aria-label="Month">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="dobYear" className="sr-only">Year</Label>
                  <Input id="dobYear" type="number" {...register("dobYear")} placeholder="YYYY" aria-invalid={errors.dobYear ? "true" : "false"} />
                </div>
              </div>
              {errors.dobDay && <p className="text-sm text-destructive mt-1 col-span-3">{errors.dobDay.message}</p>}
              {errors.root?.message && !errors.dobDay && !errors.dobMonth && !errors.dobYear && (
                <p className="text-sm text-destructive mt-1 col-span-3">{errors.root.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="mobileNumber">Mobile Number (Optional, stored locally)</Label>
              <Input id="mobileNumber" {...register("mobileNumber")} placeholder="e.g., +11234567890" aria-invalid={errors.mobileNumber ? "true" : "false"} />
              {errors.mobileNumber && <p className="text-sm text-destructive mt-1">{errors.mobileNumber.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || (isCropModalOpen && !completedCrop && !user?.photoURL) }>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Save and Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
