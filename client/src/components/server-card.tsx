import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Wifi, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Server } from "@shared/schema";

interface ServerCardProps {
  server: Server;
  isSelected: boolean;
  onSelect: () => void;
  onJoin: () => void;
}

export function ServerCard({ server, isSelected, onSelect, onJoin }: ServerCardProps) {
  const getServerInitials = (name: string) => {
    return name.split(" ").slice(0, 2).map(word => word[0]).join("").toUpperCase();
  };

  const getPingStatus = (ping: number) => {
    if (ping <= 50) return "status-online";
    if (ping <= 100) return "status-medium";
    return "status-high";
  };

  const getPingColor = (ping: number) => {
    if (ping <= 50) return "text-success";
    if (ping <= 100) return "text-warning";
    return "text-destructive";
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const totalModSize = (server.mods ?? []).reduce((sum, mod) => sum + mod.size, 0);

  return (
    <div 
      className={`server-card gradient-border rounded-lg p-4 ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      data-testid={`card-server-${server.address}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Server Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/30">
              <span className="text-lg font-bold text-primary">
                {getServerInitials(server.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-foreground truncate" data-testid={`text-server-name-${server.address}`}>
                  {server.name}
                </h3>
                {server.verified && (
                  <Badge variant="secondary" className="badge-success flex-shrink-0">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="mono" data-testid={`text-server-ip-${server.address}`}>{server.address}</span>
                <span>•</span>
                <span data-testid={`text-server-region-${server.address}`}>{server.region}</span>
                <span>•</span>
                <span data-testid={`text-server-version-${server.address}`}>{server.version}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="secondary" className="badge-primary">
              {server.map}
            </Badge>
            <Badge variant="secondary" className="badge-muted">
              {server.perspective ?? "Unknown"}
            </Badge>
            {(server.mods ?? []).length > 0 ? (
              <Badge variant="secondary" className="badge-muted">
                {(server.mods ?? []).length} Mods ({formatBytes(totalModSize)})
              </Badge>
            ) : (
              <Badge variant="secondary" className="badge-success">
                Vanilla
              </Badge>
            )}
            {server.lastWipe && (
              <span className="text-xs text-muted-foreground">
                Wiped {formatDistanceToNow(new Date(server.lastWipe), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Server Stats */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Players */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Players</div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-success" />
              <span className="text-lg font-bold text-foreground" data-testid={`text-player-count-${server.address}`}>
                {server.playerCount ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">
                / <span data-testid={`text-max-players-${server.address}`}>{server.maxPlayers ?? 0}</span>
              </span>
            </div>
          </div>

          {/* Ping */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Ping</div>
            <div className="flex items-center gap-1">
              <span className={`status-dot ${getPingStatus(server.ping ?? 0)}`}></span>
              <span className={`text-lg font-bold ${getPingColor(server.ping ?? 0)}`} data-testid={`text-ping-${server.address}`}>
                {server.ping ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">ms</span>
            </div>
          </div>

          {/* Queue */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Queue</div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-bold text-foreground" data-testid={`text-queue-${server.address}`}>
                {server.queue ?? 0}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 text-sm font-semibold whitespace-nowrap"
              data-testid={`button-join-${server.address}`}
            >
              Join Server
            </Button>
            <Button 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="bg-secondary hover:bg-muted border-border text-foreground px-6 py-2 text-sm font-medium whitespace-nowrap"
              data-testid={`button-details-${server.address}`}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
