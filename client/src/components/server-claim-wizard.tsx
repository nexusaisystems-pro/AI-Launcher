import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Mail, Shield, CheckCircle2, AlertCircle, Loader2, Copy } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Server } from "@shared/schema";
import { nanoid } from "nanoid";

interface ServerClaimWizardProps {
  server: Server;
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = "email" | "verify" | "success" | "error";

interface ClaimResponse {
  success: boolean;
  token: string;
  method: string;
  expiresAt: string;
  instructions: {
    server_name: string;
  };
}

interface VerifyResponse {
  success: boolean;
  verified: boolean;
  message: string;
  error?: string;
  currentServerName?: string;
  expectedToken?: string;
}

export function ServerClaimWizard({ server, isOpen, onClose }: ServerClaimWizardProps) {
  const [step, setStep] = useState<WizardStep>("email");
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [sessionId] = useState(() => nanoid(16));
  const { toast } = useToast();

  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/servers/${encodeURIComponent(server.address)}/claim`, {
        ownerEmail: email,
        sessionId,
        method: "server_name",
      });
      const data = await response.json() as ClaimResponse;
      return data;
    },
    onSuccess: (data) => {
      setVerificationToken(data.token);
      setStep("verify");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to initiate claim process";
      toast({
        title: "Claim Failed",
        description: message,
        variant: "destructive",
      });
      setStep("error");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/servers/${encodeURIComponent(server.address)}/verify`, {
        token: verificationToken,
        sessionId,
      });
      const data = await response.json() as VerifyResponse;
      return data;
    },
    onSuccess: (data) => {
      if (data.verified) {
        setStep("success");
        toast({
          title: "Server Claimed!",
          description: data.message,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Could not verify ownership",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Verification failed";
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleCopyToken = () => {
    navigator.clipboard.writeText(`[${verificationToken}]`);
    toast({ title: "Token copied to clipboard" });
  };

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setVerificationToken("");
    onClose();
  };

  const handleStartClaim = () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    claimMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-claim-wizard">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <DialogTitle>Claim Server Ownership</DialogTitle>
          </div>
          <DialogDescription>
            Verify ownership to access dashboard, analytics, and premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Email Entry */}
          {step === "email" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="owner-email">Owner Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="owner-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    data-testid="input-owner-email"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll use this to send you updates and important notifications about your server.
                </p>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  You'll need server access to complete verification by adding a code to your server name.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  data-testid="button-cancel-claim"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartClaim}
                  disabled={claimMutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  data-testid="button-start-claim"
                >
                  {claimMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Verification Instructions */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-foreground">Verification Code</h4>
                </div>
                
                <div className="bg-card rounded-lg p-4 border-2 border-dashed border-amber-500/50">
                  <div className="flex items-center justify-between">
                    <code className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                      [{verificationToken}]
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyToken}
                      data-testid="button-copy-token"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">How to Verify:</h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      1
                    </span>
                    <span>Copy the verification code above</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      2
                    </span>
                    <span>Add it to your server name in your server config</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      3
                    </span>
                    <span>Restart your server for the name change to take effect</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      4
                    </span>
                    <span>Click "Verify Ownership" below</span>
                  </li>
                </ol>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Example: <strong>{server.name} [{verificationToken}]</strong>
                  <br />
                  The code will expire in 24 hours.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  data-testid="button-cancel-verify"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  data-testid="button-verify-ownership"
                >
                  {verifyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Ownership
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ownership Verified!</h3>
                <p className="text-sm text-muted-foreground">
                  Congratulations! You now have access to your server dashboard and a 7-day free trial of AI Insights.
                </p>
              </div>
              <Button
                onClick={() => window.location.href = "/dashboard"}
                className="w-full bg-green-500 hover:bg-green-600"
                data-testid="button-view-dashboard"
              >
                View Dashboard
              </Button>
            </div>
          )}

          {/* Step 4: Error */}
          {step === "error" && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Claim Failed</h3>
                <p className="text-sm text-muted-foreground">
                  The server may already be claimed or there was an error processing your request.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  data-testid="button-close-error"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setStep("email")}
                  className="flex-1"
                  data-testid="button-retry-claim"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
