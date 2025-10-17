import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Check, Clock, Download, Play, ExternalLink, Rocket } from "lucide-react";
import { useFavoritesContext } from "@/contexts/favorites-context";
import { useDesktop } from "@/contexts/desktop-context";
import type { Server } from "@shared/schema";

interface JoinModalProps {
  server: Server | null;
  isOpen: boolean;
  onClose: () => void;
}

interface JoinStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "complete" | "error";
  progress?: number;
}

export function JoinModal({ server, isOpen, onClose }: JoinModalProps) {
  const { isDesktop } = useDesktop();
  const [steps, setSteps] = useState<JoinStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [desktopLinkOpened, setDesktopLinkOpened] = useState(false);
  const { addRecent } = useFavoritesContext();
  
  // Generate deep link for desktop app
  const generateDeepLink = () => {
    if (!server) return '';
    const modIds = (server.mods || []).map(m => m.workshopId).join(',');
    const encodedName = encodeURIComponent(server.name);
    return `gamehub://join?server=${server.address}&mods=${modIds}&name=${encodedName}`;
  };
  
  const handleOpenInDesktop = () => {
    const deepLink = generateDeepLink();
    console.log('[Web] Opening desktop app:', deepLink);
    window.location.href = deepLink;
    setDesktopLinkOpened(true);
    addRecent(server?.address || '');
  };

  // Initialize steps when modal opens
  useEffect(() => {
    if (isOpen && server) {
      const initialSteps: JoinStep[] = [
        {
          id: "validate",
          title: "Validating Mods",
          description: "Checking installed mods...",
          status: "pending",
        },
        {
          id: "download",
          title: "Downloading Required Mods",
          description: (server.mods ?? []).length > 0 ? `${(server.mods ?? []).filter(m => !m.installed).length} mods to download` : "No downloads needed",
          status: "pending",
          progress: 0,
        },
        {
          id: "verify",
          title: "Verifying Files",
          description: "Checking file integrity...",
          status: "pending",
        },
        {
          id: "launch",
          title: "Launching Game",
          description: "Starting DayZ...",
          status: "pending",
        },
      ];

      setSteps(initialSteps);
      setCurrentStep(0);
      setIsJoining(false);
    }
  }, [isOpen, server]);

  const startJoinProcess = async () => {
    if (!server) return;

    setIsJoining(true);
    addRecent(server.address);

    // Simulate the join process
    const updatedSteps = [...steps];

    // Step 1: Validate mods
    setCurrentStep(0);
    updatedSteps[0].status = "in-progress";
    setSteps([...updatedSteps]);

    await new Promise(resolve => setTimeout(resolve, 1000));
    updatedSteps[0].status = "complete";
    setSteps([...updatedSteps]);

    // Step 2: Download mods (if any)
    setCurrentStep(1);
    updatedSteps[1].status = "in-progress";
    setSteps([...updatedSteps]);

    if ((server.mods ?? []).some(m => !m.installed)) {
      // Simulate download progress
      for (let progress = 0; progress <= 100; progress += 10) {
        updatedSteps[1].progress = progress;
        updatedSteps[1].description = `Downloading mods... ${progress}%`;
        setSteps([...updatedSteps]);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    updatedSteps[1].status = "complete";
    updatedSteps[1].description = "All mods ready";
    setSteps([...updatedSteps]);

    // Step 3: Verify files
    setCurrentStep(2);
    updatedSteps[2].status = "in-progress";
    setSteps([...updatedSteps]);

    await new Promise(resolve => setTimeout(resolve, 1500));
    updatedSteps[2].status = "complete";
    setSteps([...updatedSteps]);

    // Step 4: Launch game
    setCurrentStep(3);
    updatedSteps[3].status = "in-progress";
    setSteps([...updatedSteps]);

    await new Promise(resolve => setTimeout(resolve, 2000));
    updatedSteps[3].status = "complete";
    updatedSteps[3].description = "DayZ launched successfully!";
    setSteps([...updatedSteps]);

    // Auto-close after success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const getStepIcon = (step: JoinStep, index: number) => {
    switch (step.status) {
      case "complete":
        return <Check className="w-4 h-4 text-success" />;
      case "in-progress":
        return <div className="w-2 h-2 bg-primary rounded-full animate-pulse-slow" />;
      case "error":
        return <X className="w-4 h-4 text-destructive" />;
      default:
        return <span className="text-xs font-semibold text-muted-foreground">{index + 1}</span>;
    }
  };

  const getStepStatus = (step: JoinStep) => {
    switch (step.status) {
      case "complete":
        return "Complete";
      case "in-progress":
        return step.progress !== undefined ? `${step.progress}%` : "In Progress";
      case "error":
        return "Error";
      default:
        return "Waiting";
    }
  };

  const getEstimatedTime = () => {
    if (!server) return "0 minutes";
    
    const modDownloadTime = (server.mods ?? []).filter(m => !m.installed).length * 2; // 2 minutes per mod
    const queueTime = Math.max(1, Math.ceil((server.queue ?? 0) / 2));
    const totalTime = modDownloadTime + queueTime + 1;
    
    return `~${totalTime} minutes`;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  if (!server) return null;

  // Show different UI for web browsers (not desktop app)
  if (!isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg" data-testid="modal-join-web">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Join {server.name}
            </DialogTitle>
            <DialogDescription>
              Open GameHub Launcher desktop app to join this server
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Server Info */}
            <div className="flex items-center gap-4 bg-secondary rounded-lg p-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/30">
                <span className="text-lg font-bold text-primary">
                  {server.name.split(" ").slice(0, 2).map(word => word[0]).join("").toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground mb-1 truncate">
                  {server.name}
                </h3>
                <div className="text-xs text-muted-foreground mono">{server.address}</div>
              </div>
            </div>

            {/* Mods Info */}
            {server.mods && server.mods.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm font-medium text-foreground mb-2">Required Mods ({server.mods.length})</div>
                <div className="text-xs text-muted-foreground">
                  The desktop app will automatically download and manage these mods
                </div>
              </div>
            )}

            {desktopLinkOpened ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                  Opening Desktop App...
                </div>
                <div className="text-xs text-muted-foreground">
                  If the app doesn't open, make sure you have it installed
                </div>
              </div>
            ) : (
              <>
                <Button 
                  onClick={handleOpenInDesktop}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                  data-testid="button-open-desktop"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Desktop App
                </Button>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">Don't have the desktop app?</div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/downloads', '_blank')}
                    data-testid="button-download-app"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Desktop App
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop app UI (original joining flow)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-join">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-foreground">Joining Server</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Server Info */}
          <div className="flex items-center gap-4 bg-secondary rounded-lg p-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/30">
              <span className="text-lg font-bold text-primary">
                {server.name.split(" ").slice(0, 2).map(word => word[0]).join("").toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground mb-1 truncate" data-testid="text-joining-server-name">
                {server.name}
              </h3>
              <div className="text-xs text-muted-foreground mono">{server.address}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Players</div>
              <div className="text-lg font-bold text-foreground">{server.playerCount ?? 0}/{server.maxPlayers ?? 0}</div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${
                      step.status === "complete" ? "bg-success/20 border-success" :
                      step.status === "in-progress" ? "bg-primary/20 border-primary" :
                      step.status === "error" ? "bg-destructive/20 border-destructive" :
                      "bg-muted border-border"
                    } border-2 rounded-full flex items-center justify-center flex-shrink-0`}>
                      {getStepIcon(step, index)}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${
                        step.status === "complete" || step.status === "in-progress" ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${
                    step.status === "complete" ? "text-success" :
                    step.status === "in-progress" ? "text-primary" :
                    step.status === "error" ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>
                    {getStepStatus(step)}
                  </span>
                </div>
                {step.status === "in-progress" && step.progress !== undefined && (
                  <div className="ml-11">
                    <Progress value={step.progress} className="h-2" />
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>Downloading...</span>
                      <span>~2 minutes remaining</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Estimated Time */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Estimated Time Remaining</span>
              </div>
              <span className="text-lg font-bold text-primary" data-testid="text-estimated-time">
                {getEstimatedTime()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isJoining ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                  data-testid="button-cancel-join"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={startJoinProcess}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-start-join"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Joining
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                  data-testid="button-cancel-progress"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-secondary hover:bg-muted text-foreground"
                  data-testid="button-minimize"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Minimize to Tray
                </Button>
              </>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground text-center">
            The launcher will stay in the background while you play. You can close it anytime.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
