import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Wifi, Clock, Lock, Shield, AlertTriangle, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Server } from "@shared/schema";
import type { ServerWithIntelligence } from "@/hooks/use-servers";

interface ServerCardProps {
  server: ServerWithIntelligence;
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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "S": return "hsl(280, 75%, 65%)"; // purple
      case "A": return "hsl(145, 75%, 50%)"; // green
      case "B": return "hsl(190, 85%, 55%)"; // cyan
      case "C": return "hsl(40, 90%, 55%)"; // amber
      case "D": return "hsl(25, 85%, 55%)"; // orange
      case "F": return "hsl(0, 85%, 60%)"; // red
      default: return "hsl(220, 10%, 70%)"; // gray
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 76) return "hsl(145, 75%, 50%)"; // green
    if (score >= 51) return "hsl(40, 90%, 55%)"; // amber
    return "hsl(0, 85%, 60%)"; // red
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising": return <TrendingUp className="w-3 h-3" />;
      case "declining": return <TrendingDown className="w-3 h-3" />;
      default: return <Minus className="w-3 h-3" />;
    }
  };

  const totalModSize = (server.mods ?? []).reduce((sum, mod) => sum + mod.size, 0);
  const playerPercentage = ((server.playerCount ?? 0) / (server.maxPlayers ?? 1)) * 100;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (playerPercentage / 100) * circumference;

  const trustRadius = 24;
  const trustCircumference = 2 * Math.PI * trustRadius;
  const trustScore = server.intelligence?.qualityScore ?? 50;
  const trustDashoffset = trustCircumference - (trustScore / 100) * trustCircumference;

  return (
    <div 
      className={`server-card gradient-border rounded-xl p-5 ${isSelected ? 'selected' : ''} relative`}
      onClick={onSelect}
      data-testid={`card-server-${server.address}`}
    >
      {/* Fraud Warning Banner */}
      {server.intelligence && server.intelligence.fraudFlags.length > 0 && (
        <div className="absolute -top-2 left-6 right-6 bg-destructive/20 border border-destructive/50 rounded-lg px-3 py-1.5 flex items-center gap-2 backdrop-blur-sm z-10">
          <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
          <span className="text-xs font-semibold text-destructive">
            {server.intelligence.fraudFlags[0].evidence}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-6">
        {/* Server Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4 mb-3">
            {/* Grade Badge */}
            {server.intelligence && (
              <div 
                className="relative w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center border-2"
                style={{ 
                  borderColor: getGradeColor(server.intelligence.grade),
                  backgroundColor: getGradeColor(server.intelligence.grade) + '20',
                  boxShadow: `0 0 20px ${getGradeColor(server.intelligence.grade)}40`
                }}
                data-testid={`badge-grade-${server.address}`}
              >
                <span className="text-2xl font-black font-display" style={{ color: getGradeColor(server.intelligence.grade) }}>
                  {server.intelligence.grade}
                </span>
                {server.intelligence.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center" style={{ backgroundColor: 'hsl(190, 95%, 55%)' }}>
                    <Shield className="w-3 h-3 text-background" />
                  </div>
                )}
              </div>
            )}
            
            {/* Fallback when no intelligence */}
            {!server.intelligence && (
              <div className="relative w-14 h-14 flex-shrink-0">
                <div className="w-14 h-14 holographic rounded-xl flex items-center justify-center border border-primary/40 neon-border">
                  <span className="text-xl font-bold font-display text-primary-glow">
                    {getServerInitials(server.name)}
                  </span>
                </div>
                {server.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background flex items-center justify-center neon-glow">
                    <Shield className="w-3 h-3 text-background" />
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-bold font-display text-foreground truncate" data-testid={`text-server-name-${server.address}`}>
                  {server.name}
                </h3>
                {server.passwordProtected && (
                  <Lock className="w-4 h-4 text-warning flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="mono font-medium" data-testid={`text-server-ip-${server.address}`}>{server.address}</span>
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                <span className="uppercase tracking-wide" data-testid={`text-server-region-${server.address}`}>{server.region}</span>
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                <span className="mono" data-testid={`text-server-version-${server.address}`}>{server.version}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="badge-primary">
              <Wifi className="w-3 h-3 mr-1" />
              {server.map}
            </Badge>
            <Badge variant="secondary" className="badge-secondary">
              {server.perspective ?? "Unknown"}
            </Badge>
            {(server.mods ?? []).length > 0 ? (
              <Badge variant="secondary" className="holographic border border-primary/30">
                <span className="font-semibold">{(server.mods ?? []).length}</span> MODS • {formatBytes(totalModSize)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="badge-success">
                VANILLA
              </Badge>
            )}
            {server.lastWipe && (
              <span className="text-xs text-muted-foreground font-medium">
                Wiped {formatDistanceToNow(new Date(server.lastWipe), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Server Stats */}
        <div className="flex items-center gap-8 flex-shrink-0">
          {/* Trust Score Ring (if intelligence available) */}
          {server.intelligence && (
            <div className="text-center relative">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Trust</div>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="progress-ring absolute inset-0 -rotate-90" width="80" height="80">
                  <circle
                    className="text-card-elevated"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r={trustRadius}
                    cx="40"
                    cy="40"
                  />
                  <circle
                    className="transition-all duration-1000"
                    strokeWidth="4"
                    strokeDasharray={trustCircumference}
                    strokeDashoffset={trustDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={trustRadius}
                    cx="40"
                    cy="40"
                    stroke={getTrustScoreColor(trustScore)}
                  />
                </svg>
                <div className="relative z-10 text-center">
                  <div className="text-lg font-bold font-display" style={{ color: getTrustScoreColor(trustScore) }} data-testid={`text-trust-score-${server.address}`}>
                    {trustScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">
                    Score
                  </div>
                </div>
              </div>
              {server.intelligence.trustIndicators.rank && (
                <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  {getTrendIcon(server.intelligence.trustIndicators.trend)}
                  <span>#{server.intelligence.trustIndicators.rank}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Players with Progress Ring */}
          <div className="text-center relative">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Players</div>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="progress-ring absolute inset-0" width="112" height="112">
                <circle
                  className="text-card-elevated"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="56"
                  cy="56"
                />
                <circle
                  className="progress-ring-circle"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  r={radius}
                  cx="56"
                  cy="56"
                />
              </svg>
              <div className="relative z-10 text-center">
                <div className="text-2xl font-bold font-display text-primary-glow" data-testid={`text-player-count-${server.address}`}>
                  {server.playerCount ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  / <span data-testid={`text-max-players-${server.address}`}>{server.maxPlayers ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ping */}
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Ping</div>
            <div className="glass-card px-4 py-3 rounded-lg neon-border">
              <div className="flex items-center gap-2 justify-center mb-1">
                <span className={`status-dot ${getPingStatus(server.ping ?? 0)}`}></span>
                <span className={`text-2xl font-bold font-display ${getPingColor(server.ping ?? 0)}`} data-testid={`text-ping-${server.address}`}>
                  {server.ping ?? 0}
                </span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">ms</div>
            </div>
          </div>

          {/* Queue */}
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Queue</div>
            <div className="glass-card px-4 py-3 rounded-lg border border-border-subtle">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-2xl font-bold font-display text-foreground" data-testid={`text-queue-${server.address}`}>
                  {server.queue ?? 0}
                </span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">waiting</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className="btn-primary px-8 py-3 text-sm font-bold font-display uppercase tracking-wider whitespace-nowrap"
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
              className="glass border-primary/30 hover:border-primary/50 text-foreground px-8 py-2 text-sm font-semibold uppercase tracking-wide whitespace-nowrap transition-all hover:neon-glow"
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
