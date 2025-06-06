// src/app/facebook-data-deletion/page.tsx
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileX2 } from 'lucide-react'; // Using a different icon for variety

export const metadata: Metadata = {
  title: 'Facebook Data Deletion - PromptForge',
  description: 'Instructions for requesting data deletion for PromptForge users who logged in via Facebook.',
  robots: 'noindex, nofollow', // Good practice for such utility pages
};

export default function FacebookDataDeletionPage() {
  // IMPORTANT: Replace with your actual contact email or method
  const contactEmail = "privacy@yourdomain.com"; 
  const appName = "PromptForge";

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <FileX2 className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="font-headline text-3xl md:text-4xl">Data Deletion Request</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            For {appName} Users via Facebook Login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground">
          <section>
            <p className="text-base">
              This page provides instructions on how to request the deletion of your data
              associated with your {appName} account if you have signed in using Facebook.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">How to Request Data Deletion</h2>
            <p>
              To request the deletion of your data collected by {appName} through Facebook Login,
              please send an email to our support team at:
            </p>
            <p className="font-semibold text-lg my-3 text-center">
              <a href={`mailto:${contactEmail}?subject=Facebook%20Data%20Deletion%20Request%20for%20${appName}`} className="text-accent hover:underline">
                {contactEmail}
              </a>
            </p>
            <p>
              In your email, please include the following information to help us identify your account:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2 bg-muted/30 p-4 rounded-md">
              <li>Your full name as it appears on Facebook.</li>
              <li>The email address associated with your Facebook account (if different from the sending email).</li>
              <li>A clear statement that you are requesting the deletion of your data from {appName}.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">What Happens Next?</h2>
            <p>
              Once we receive your request, we will:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Verify your identity to ensure the request is legitimate.</li>
              <li>Process your request within a reasonable timeframe (e.g., 30 days, or as required by applicable law).</li>
              <li>Delete your personal data associated with your {appName} account that was obtained via Facebook Login, subject to any legal or operational retention needs.</li>
              <li>Confirm with you once the deletion process is complete.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-primary">Important Notes</h2>
             <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li>
                    Deleting your data from {appName} will result in the loss of access to your account and any associated content or history within our application.
                </li>
                <li>
                    This process only deletes data stored by {appName}. It does not delete your Facebook account or any data stored by Facebook itself. You will need to manage your Facebook data directly through Facebook's settings and tools.
                </li>
            </ul>
          </section>

          <p className="text-sm text-muted-foreground text-center mt-8">
            If you have any questions regarding this process, please contact us at the email address provided above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
