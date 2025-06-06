// src/app/privacy-policy/page.tsx
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - PromptForge',
  description: 'Privacy Policy for PromptForge application.',
};

export default function PrivacyPolicyPage() {
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
              Welcome to PromptForge (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application, PromptForge. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
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
                <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Application. (Note: This is a placeholder, specify actual data collected, e.g., Vercel Analytics).
              </li>
              <li>
                <strong>Data from Social Networks:</strong> User information from social networking sites, such as Google and Facebook, including your name, your social network username, location, gender, birth date, email address, profile picture, and public data for contacts, if you connect your account to such social networks. This information may also include the contact information of anyone you invite to use and/or join the Application.
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
              <li>Email you regarding your account or order.</li>
              <li>Enable user-to-user communications.</li>
              <li>Generate a personal profile about you to make future visits to the Application more personalized.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
              <li>Notify you of updates to the Application.</li>
              <li>[Add other uses relevant to PromptForge, e.g., related to AI prompt generation services]</li>
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
                <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance. (e.g., Google for authentication, Vercel for hosting and analytics, Facebook for authentication).
              </li>
              <li>
                <strong>AI Model Providers:</strong> Prompts and related inputs you provide may be sent to third-party AI model providers (e.g., Google AI/Gemini) to generate responses. These providers have their own privacy policies regarding data handling.
              </li>
              <li>[Add other disclosures]</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">5. Tracking Technologies</h2>
             <p>
              We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Application to help customize the Application and improve your experience.
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
            <h2 className="text-2xl font-semibold mb-3 text-primary">8. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the &quot;Last Updated&quot; date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">9. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at: [Your Contact Email Address or Link to Contact Form]
            </p>
          </section>
          
          <p className="text-sm text-muted-foreground text-center mt-8">
            <strong>Important:</strong> This is a template and should not be considered legal advice. Consult with a legal professional to ensure your privacy policy is compliant with all applicable laws and regulations for your specific services and user base.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
