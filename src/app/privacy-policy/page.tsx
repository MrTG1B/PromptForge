
// src/app/privacy-policy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - PromptForge',
  description: 'Privacy Policy for PromptForge application.',
};

export default function PrivacyPolicyPage() {
  const appName = "PromptForge";
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="font-headline text-3xl md:text-4xl">Privacy Policy</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">1. Introduction</h2>
            <p>
              Welcome to {appName}. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application, {appName}. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">2. Collection of Your Information</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect via the Application depends on the content and materials you use, and includes:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>
                <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and profile picture, that you voluntarily give to us when you register with the Application (e.g., via Google or Facebook Sign-In).
              </li>
              <li>
                <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Application. (Note: We use Vercel Analytics for this purpose, which provides aggregated and anonymized data).
              </li>
              <li>
                <strong>Data from Social Networks:</strong> User information from social networking sites, such as Google and Facebook, including your name, your social network username, location, gender, birth date, email address, profile picture, and public data for contacts, if you connect your account to such social networks. This information may also include the contact information of anyone you invite to use and/or join the Application.
              </li>
              <li>
                <strong>User-Provided Prompts and Inputs:</strong> Any text, ideas, or parameters you input into {appName} for the purpose of generating or refining prompts are processed by our system and may be sent to third-party AI model providers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">3. Use of Your Information</h2>
            <p>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Create and manage your account.</li>
              <li>Email you regarding your account.</li>
              <li>Enable user-to-user communications (if applicable, specify if this feature exists).</li>
              <li>Generate a personal profile about you to make future visits to the Application more personalized.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Application (using Vercel Analytics).</li>
              <li>Notify you of updates to the Application.</li>
              <li>Provide, maintain, and improve the AI prompt generation and refinement services.</li>
              <li>Respond to your comments, questions, and requests and provide customer service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">4. Disclosure of Your Information</h2>
            <p>
              We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>
                <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
              </li>
              <li>
                <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including:
                <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Firebase (Google) for authentication, Firestore database (user profile data), and reCAPTCHA.</li>
                    <li>Appwrite for profile image storage.</li>
                    <li>Google AI (Gemini) for AI model processing.</li>
                    <li>Vercel for hosting and analytics.</li>
                    <li>Facebook for authentication (if used).</li>
                </ul>
              </li>
              <li>
                <strong>AI Model Providers:</strong> Prompts and related inputs you provide are sent to third-party AI model providers (e.g., Google AI/Gemini via Genkit) to generate responses. These providers have their own privacy policies regarding data handling. We do not store your prompts beyond what is necessary for the immediate processing by the AI model unless you explicitly save them within features of {appName} (if such features exist).
              </li>
               <li>
                <strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">5. Tracking Technologies and Service Protection</h2>
             <p>
              We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Application to help customize the Application and improve your experience. We also use services to protect our application from abuse.
            </p>
             <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li>
                    <strong>Firebase Authentication:</strong> Uses cookies or similar mechanisms to manage user sessions.
                </li>
                <li>
                    <strong>Vercel Analytics:</strong> May use cookies or other identifiers to collect anonymous usage data.
                </li>
                <li>
                    <strong>Facebook SDK:</strong> May use cookies or pixels for analytics and ad tracking purposes if you interact with Facebook login or ads.
                </li>
                <li>
                  <strong>Google reCAPTCHA:</strong> To protect our services from spam and abuse, this site uses Google reCAPTCHA. Your use of reCAPTCHA is subject to the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Terms of Service</a>.
                </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">6. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">7. Policy for Children</h2>
            <p>
              We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-semibold mb-3 text-primary">8. Your Data Rights and Choices</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data.
            </p>
             <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li>
                    <strong>Account Information:</strong> You may at any time review or change the information in your account by logging into your account settings (via the "Update Profile" option) or contacting us.
                </li>
                <li>
                    <strong>Data Deletion:</strong> To request deletion of your account and associated data, please contact us. For users who signed in via Facebook, please see our <Link href="/facebook-data-deletion" className="underline hover:text-accent">Facebook Data Deletion Instructions</Link> page.
                </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the &quot;Last Updated&quot; date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">10. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at: <Link href="mailto:tirthankardasgupta913913@gmail.com" className="text-accent hover:underline">tirthankardasgupta913913@gmail.com</Link>
            </p>
          </section>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Link href="/" passHref>
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

    