// src/app/complete-profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker'; // Ensure this path is correct
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, ArrowRight } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }).optional(),
  profilePictureUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid mobile number format (e.g., +1234567890 or 1234567890)."}).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      profilePictureUrl: '',
      mobileNumber: '',
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login'); // Redirect if not authenticated
    }
  }, [user, authLoading, router]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsSubmitting(true);
    // In a real application, you would save this data to your backend (e.g., Firestore)
    console.log("Profile data to save:", data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Profile Updated!",
      description: "Your additional details have been saved.",
    });
    router.push('/'); // Redirect to homepage
    setIsSubmitting(false);
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
                  />
                )}
              />
              {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <Label htmlFor="profilePictureUrl">Profile Picture URL (Optional)</Label>
              <Input id="profilePictureUrl" {...register("profilePictureUrl")} placeholder="https://example.com/your-image.png" aria-invalid={errors.profilePictureUrl ? "true" : "false"} />
              {errors.profilePictureUrl && <p className="text-sm text-destructive mt-1">{errors.profilePictureUrl.message}</p>}
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
