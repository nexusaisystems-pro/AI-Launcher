import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyDialogProps {
  children: React.ReactNode;
}

export function PrivacyPolicyDialog({ children }: PrivacyPolicyDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Privacy Policy
          </DialogTitle>
          <DialogDescription>
            Last updated: October 8, 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-foreground">
            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">1. Information We Collect</h3>
              <p className="text-muted-foreground mb-2">
                GameHub Launcher, operated by Nexus AI Systems, collects the following information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Account information (email, name) when you sign up through Replit Auth</li>
                <li>Server preferences and favorites to personalize your experience</li>
                <li>Usage data to improve our AI recommendations</li>
                <li>Game server connection history for recent servers feature</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">2. How We Use Your Information</h3>
              <p className="text-muted-foreground mb-2">We use collected information to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide and maintain GameHub Launcher services</li>
                <li>Deliver personalized server recommendations using AI</li>
                <li>Save your favorite servers and preferences</li>
                <li>Improve platform performance and user experience</li>
                <li>Communicate important updates and features</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">3. Data Storage and Security</h3>
              <p className="text-muted-foreground">
                Your data is securely stored using industry-standard encryption. We use PostgreSQL databases 
                with automated backups. Session data is stored locally in your browser and synced to our servers. 
                We implement security best practices to protect your information from unauthorized access.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">4. Third-Party Services</h3>
              <p className="text-muted-foreground mb-2">
                GameHub Launcher integrates with the following third-party services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Replit Auth:</strong> For secure authentication (Google, Apple, Email, GitHub)</li>
                <li><strong>BattleMetrics:</strong> For real-time server data and statistics</li>
                <li><strong>Steam Workshop:</strong> For mod information and downloads</li>
                <li><strong>OpenAI:</strong> For AI-powered server recommendations</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">5. Cookies and Tracking</h3>
              <p className="text-muted-foreground">
                We use session cookies to maintain your login state and localStorage to save preferences. 
                We do not use third-party advertising cookies or sell your data to advertisers.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">6. Your Rights</h3>
              <p className="text-muted-foreground mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Access your personal data</li>
                <li>Request data deletion</li>
                <li>Export your data</li>
                <li>Opt-out of AI recommendations</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">7. Data Retention</h3>
              <p className="text-muted-foreground">
                We retain your account data as long as your account is active. Server preferences and 
                favorites are kept to maintain service quality. You can request deletion at any time by 
                contacting hello@gamehublauncher.com.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">8. Changes to Privacy Policy</h3>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. We will notify users of significant changes 
                via email or platform notifications. Continued use of GameHub Launcher after changes 
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">9. Contact Us</h3>
              <p className="text-muted-foreground">
                For privacy-related questions or requests, contact us at:
              </p>
              <p className="text-primary font-medium mt-2">hello@gamehublauncher.com</p>
              <p className="text-muted-foreground mt-1">Nexus AI Systems</p>
              <p className="text-muted-foreground">nexusaisystems.pro</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
