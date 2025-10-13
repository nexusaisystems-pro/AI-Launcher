import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Check, Loader2, AlertCircle, Rocket } from 'lucide-react';
import { useDesktop } from '@/contexts/desktop-context';
import { Progress } from '@/components/ui/progress';

interface DesktopJoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverAddress: string;
  serverName: string;
  requiredMods: Array<{
    name: string;
    workshopId: string;
  }>;
}

export function DesktopJoinModal({
  open,
  onOpenChange,
  serverAddress,
  serverName,
  requiredMods
}: DesktopJoinModalProps) {
  const { launchServer, subscribeToMods, steamAvailable } = useDesktop();
  const [status, setStatus] = useState<'checking' | 'ready' | 'missing' | 'downloading' | 'error'>('checking');
  const [missingMods, setMissingMods] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkAndLaunch = async () => {
    try {
      setStatus('checking');
      setError(null);

      // Prepare mods in the format expected by Electron
      const modsData = requiredMods.map(mod => ({
        name: mod.name,
        steamWorkshopId: parseInt(mod.workshopId)
      }));

      // Try to launch
      const result = await launchServer({
        serverAddress,
        requiredMods: modsData
      });

      if (result.canLaunch) {
        setStatus('ready');
        onOpenChange(false);
      } else if (result.missingMods && result.missingMods.length > 0) {
        setMissingMods(result.missingMods);
        setStatus('missing');
      } else if (result.error) {
        setError(result.error);
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check mods');
      setStatus('error');
    }
  };

  const downloadMods = async () => {
    if (!steamAvailable) {
      setError('Steam is not running. Please start Steam and try again.');
      setStatus('error');
      return;
    }

    try {
      setStatus('downloading');
      const modIds = missingMods.map(m => m.steamWorkshopId);
      
      const result = await subscribeToMods(modIds);
      
      if (result.success) {
        // Show success message
        setStatus('ready');
        setTimeout(() => {
          // Retry launch after a delay (mods may still be downloading)
          checkAndLaunch();
        }, 2000);
      } else {
        setError(result.error || 'Failed to subscribe to mods');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download mods');
      setStatus('error');
    }
  };

  // Auto-check when modal opens
  useEffect(() => {
    if (open) {
      checkAndLaunch();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="desktop-join-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Join {serverName}
          </DialogTitle>
          <DialogDescription>
            Launching DayZ with automatic mod management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === 'checking' && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Checking installed mods...</span>
            </div>
          )}

          {status === 'ready' && (
            <div className="flex items-center gap-3 text-green-500">
              <Check className="w-5 h-5" />
              <span>All mods installed! Launching game...</span>
            </div>
          )}

          {status === 'missing' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-yellow-500">
                <Download className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Missing {missingMods.length} mod{missingMods.length > 1 ? 's' : ''}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The following mods need to be downloaded from Steam Workshop
                  </p>
                </div>
              </div>

              <div className="bg-background-secondary rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
                {missingMods.map((mod, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm" data-testid={`missing-mod-${idx}`}>
                    <span className="text-foreground">{mod.name}</span>
                    <span className="text-muted-foreground text-xs">ID: {mod.steamWorkshopId}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={downloadMods} 
                className="w-full"
                data-testid="download-mods-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Mods via Steam
              </Button>
            </div>
          )}

          {status === 'downloading' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Subscribing to mods on Steam Workshop...</span>
              </div>
              <Progress value={66} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Steam will download the mods in the background. This may take a few minutes.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
              <Button 
                onClick={checkAndLaunch} 
                variant="outline" 
                className="w-full"
                data-testid="retry-button"
              >
                Try Again
              </Button>
            </div>
          )}

          {requiredMods.length === 0 && status === 'checking' && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Check className="w-5 h-5" />
              <span>No mods required for this server</span>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>💡 Tip: Make sure Steam is running for automatic mod downloads</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
