import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceDialogProps {
  children: React.ReactNode;
}

export function TermsOfServiceDialog({ children }: TermsOfServiceDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Terms of Service
          </DialogTitle>
          <DialogDescription>
            Last updated: October 8, 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-foreground">
            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using GameHub Launcher ("the Service"), operated by Nexus AI Systems, 
                you agree to be bound by these Terms of Service. If you do not agree to these terms, 
                please do not use the Service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">2. Service Description</h3>
              <p className="text-muted-foreground mb-2">
                GameHub Launcher provides:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Multi-game server browser platform (currently DayZ in beta)</li>
                <li>AI-powered server recommendations</li>
                <li>Real-time server statistics and intelligence</li>
                <li>One-click server joining and mod management</li>
                <li>Server favorites and preference syncing</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">3. Beta Testing Phase</h3>
              <p className="text-muted-foreground">
                GameHub Launcher is currently in beta testing. The Service may contain bugs, 
                errors, or incomplete features. We reserve the right to modify, suspend, or 
                discontinue features without notice during the beta period. Use of beta features 
                is at your own risk.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">4. User Accounts</h3>
              <p className="text-muted-foreground mb-2">
                To use GameHub Launcher, you must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Create an account using Replit Auth (Google, Apple, Email, or GitHub)</li>
                <li>Provide accurate and current information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be at least 13 years old (or legal age in your jurisdiction)</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">5. Acceptable Use</h3>
              <p className="text-muted-foreground mb-2">You agree NOT to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Use the Service for illegal activities</li>
                <li>Attempt to hack, exploit, or abuse the platform</li>
                <li>Impersonate others or misrepresent affiliations</li>
                <li>Submit false server information or fraudulent data</li>
                <li>Use bots or automated tools to scrape data</li>
                <li>Interfere with other users' access to the Service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">6. Server Ownership Claims</h3>
              <p className="text-muted-foreground">
                Server owners may claim their servers through our verification process. Claims are 
                subject to admin review. False claims or fraudulent verification attempts will result 
                in account suspension. We reserve the right to remove or reject any server claim.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">7. Intellectual Property</h3>
              <p className="text-muted-foreground">
                GameHub Launcher, including its design, features, and AI algorithms, is owned by 
                Nexus AI Systems. The Service integrates data from third parties (BattleMetrics, 
                Steam Workshop) which remain property of their respective owners. You may not copy, 
                modify, or redistribute our platform without permission.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">8. Third-Party Services</h3>
              <p className="text-muted-foreground">
                GameHub Launcher connects to third-party game servers and services. We are not 
                responsible for their availability, content, or policies. Your use of third-party 
                servers is subject to their terms and conditions.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">9. Disclaimers</h3>
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Uninterrupted or error-free service</li>
                <li>Accuracy of server data or AI recommendations</li>
                <li>Availability of any specific server or feature</li>
                <li>Compatibility with all systems or games</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">10. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                Nexus AI Systems shall not be liable for any indirect, incidental, special, or 
                consequential damages arising from your use of GameHub Launcher. Our maximum 
                liability is limited to the amount you paid for the Service (currently free during beta).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">11. Premium Features</h3>
              <p className="text-muted-foreground">
                Future premium features may be introduced with subscription pricing. Current beta 
                users will be notified before any paid features are implemented. Free tier access 
                will always be available.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">12. Termination</h3>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account for violations of these 
                Terms. You may terminate your account at any time by contacting 
                hello@gamehublauncher.com. Upon termination, your data will be deleted according 
                to our Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">13. Changes to Terms</h3>
              <p className="text-muted-foreground">
                We may update these Terms of Service at any time. Significant changes will be 
                communicated via email or platform notification. Continued use after changes 
                constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">14. Governing Law</h3>
              <p className="text-muted-foreground">
                These Terms are governed by the laws of the jurisdiction where Nexus AI Systems 
                operates. Disputes will be resolved through binding arbitration or in competent courts.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">15. Contact Information</h3>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, contact:
              </p>
              <p className="text-primary font-medium mt-2">hello@gamehublauncher.com</p>
              <p className="text-muted-foreground mt-1">Nexus AI Systems</p>
              <p className="text-muted-foreground">nexusaisystems.pro</p>
            </section>

            <section className="border-t border-primary/20 pt-4 mt-6">
              <p className="text-muted-foreground text-xs">
                By using GameHub Launcher, you acknowledge that you have read, understood, and 
                agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
