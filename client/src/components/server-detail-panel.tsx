import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Play, Heart, Copy, Zap, Users, Globe, ExternalLink, Download, Shield, AlertTriangle, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useFavorites } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";
import { useWorkshopMods } from "@/hooks/use-workshop-mods";
import type { Server } from "@shared/schema";
import type { ServerWithIntelligence } from "@/hooks/use-servers";

interface ServerDetailPanelProps {
  server: ServerWithIntelligence;
  onClose: () => void;
  onJoin: () => void;
}

export function ServerDetailPanel({ server, onClose, onJoin }: ServerDetailPanelProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { toast } = useToast();
  
  const workshopIds = (server.mods ?? [])
    .map(mod => mod.workshopId)
    .filter((id): id is string => !!id);
  
  const { data: workshopMods, isLoading: isLoadingWorkshop } = useWorkshopMods(workshopIds);

  const handleToggleFavorite = () => {
    if (isFavorite(server.address)) {
      removeFavorite(server.address);
      toast({ title: "Removed from favorites" });
    } else {
      addFavorite(server.address);
      toast({ title: "Added to favorites" });
    }
  };

  const handleCopyIP = () => {
    navigator.clipboard.writeText(server.address);
    toast({ title: "IP address copied to clipboard" });
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const getTotalModSize = () => {
    return (server.mods ?? []).reduce((sum, mod) => sum + mod.size, 0);
  };

  const getEstimatedDownloadTime = () => {
    const totalSize = getTotalModSize();
    const downloadSpeed = 10 * 1024 * 1024; // 10 MB/s average
    const seconds = totalSize / downloadSpeed;
    return Math.ceil(seconds / 60); // minutes
  };

  const getServerInitials = (name: string) => {
    return name.split(" ").slice(0, 2).map(word => word[0]).join("").toUpperCase();
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "S": return "hsl(280, 75%, 65%)";
      case "A": return "hsl(145, 75%, 50%)";
      case "B": return "hsl(190, 85%, 55%)";
      case "C": return "hsl(40, 90%, 55%)";
      case "D": return "hsl(25, 85%, 55%)";
      case "F": return "hsl(0, 85%, 60%)";
      default: return "hsl(220, 10%, 70%)";
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 76) return "hsl(145, 75%, 50%)";
    if (score >= 51) return "hsl(40, 90%, 55%)";
    return "hsl(0, 85%, 60%)";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising": return <TrendingUp className="w-4 h-4" />;
      case "declining": return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "hsl(0, 85%, 60%)";
      case "medium": return "hsl(40, 90%, 55%)";
      case "low": return "hsl(220, 10%, 70%)";
      default: return "hsl(220, 10%, 70%)";
    }
  };

  return (
    <aside className="w-[480px] bg-card border-l border-border overflow-y-auto flex-shrink-0 animate-slide-in">
      <div className="sticky top-0 bg-card border-b border-border p-4 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Server Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-details">
            <X className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Server Header */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/30">
              <span className="text-2xl font-bold text-primary">
                {getServerInitials(server.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground mb-1" data-testid="text-server-detail-name">
                {server.name}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                {server.verified && (
                  <Badge variant="secondary" className="badge-success">
                    Verified
                  </Badge>
                )}
                <Badge variant="secondary" className="badge-primary">
                  Active Admin
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {server.map === "Namalsk" && "Hardcore survival experience on Namalsk with custom weather systems and increased zombie spawns. Active admin team and regular events."}
                {server.map === "Chernarus" && "High-action PvP server with traders and increased loot spawns. Perfect for competitive gameplay."}
                {server.map === "Livonia" && "Fresh vanilla experience with safe zones for new players. Great for learning the game mechanics."}
                {!["Namalsk", "Chernarus", "Livonia"].includes(server.map || "") && "Community-run server with custom features and active moderation."}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Players</div>
              <div className="text-lg font-bold text-foreground" data-testid="text-detail-players">
                {server.playerCount ?? 0}/{server.maxPlayers ?? 0}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Ping</div>
              <div className="text-lg font-bold text-success" data-testid="text-detail-ping">
                {server.ping ?? 0}ms
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Queue</div>
              <div className="text-lg font-bold text-foreground" data-testid="text-detail-queue">
                {server.queue ?? 0}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Uptime</div>
              <div className="text-lg font-bold text-success">{server.uptime ?? 0}%</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue={server.intelligence ? "intelligence" : "overview"} className="w-full">
          <TabsList className={`grid w-full ${server.intelligence ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {server.intelligence && (
              <TabsTrigger value="intelligence" className="gap-1">
                <Shield className="w-3.5 h-3.5" />
                Trust
              </TabsTrigger>
            )}
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mods">Mods</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
          </TabsList>

          {/* Intelligence Tab Content */}
          {server.intelligence && (
            <TabsContent value="intelligence" className="space-y-4 mt-4">
              {/* Quality Score Card */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Server Quality</h4>
                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center border-2"
                        style={{ 
                          borderColor: getGradeColor(server.intelligence.grade),
                          backgroundColor: getGradeColor(server.intelligence.grade) + '20',
                        }}
                      >
                        <span className="text-3xl font-black font-display" style={{ color: getGradeColor(server.intelligence.grade) }}>
                          {server.intelligence.grade}
                        </span>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-display mb-1" style={{ color: getTrustScoreColor(server.intelligence.qualityScore) }}>
                          {server.intelligence.qualityScore}/100
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Quality Score</div>
                      </div>
                    </div>
                    {server.intelligence.verified && (
                      <Badge className="badge-success gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-card-elevated rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 rounded-full"
                      style={{ 
                        width: `${server.intelligence.qualityScore}%`,
                        backgroundColor: getTrustScoreColor(server.intelligence.qualityScore)
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Fraud Warnings */}
              {server.intelligence.fraudFlags.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Security Alerts
                  </h4>
                  <div className="space-y-2">
                    {server.intelligence.fraudFlags.map((flag, index) => (
                      <div 
                        key={index}
                        className="rounded-lg p-3 border"
                        style={{ 
                          backgroundColor: getSeverityColor(flag.severity) + '15',
                          borderColor: getSeverityColor(flag.severity) + '40'
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: getSeverityColor(flag.severity) }} />
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: getSeverityColor(flag.severity) }}>
                              {flag.type.replace(/_/g, ' ')} • {flag.severity} severity
                            </div>
                            <div className="text-sm text-foreground">
                              {flag.evidence}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Indicators */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Trust Indicators</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">BattleMetrics Rank</div>
                    <div className="flex items-center gap-1.5">
                      {server.intelligence.trustIndicators.rank && getTrendIcon(server.intelligence.trustIndicators.trend)}
                      <span className="text-sm font-bold text-foreground">
                        {server.intelligence.trustIndicators.rank ? `#${server.intelligence.trustIndicators.rank.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Player Consistency</div>
                    <div className="text-sm font-bold text-foreground">
                      {server.intelligence.trustIndicators.playerConsistency}%
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">A2S vs BM Match</div>
                    <div className="text-sm font-bold text-foreground">
                      {server.intelligence.trustIndicators.a2sVsBmMatch}%
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">7-Day Uptime</div>
                    <div className="text-sm font-bold text-foreground">
                      {server.intelligence.trustIndicators.uptime7d !== null ? `${server.intelligence.trustIndicators.uptime7d}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* BattleMetrics Link */}
              {server.intelligence.battlemetricsId && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">BattleMetrics Data</h4>
                  <div className="bg-secondary rounded-lg p-3 space-y-2">
                    {server.intelligence.battlemetricsName && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Server Name:</span>
                        <span className="text-foreground text-right truncate max-w-[240px]">
                          {server.intelligence.battlemetricsName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-semibold ${server.intelligence.battlemetricsStatus === 'online' ? 'text-success' : 'text-destructive'}`}>
                        {server.intelligence.battlemetricsStatus || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cache Age:</span>
                      <span className="text-foreground">
                        {server.intelligence.cacheAge !== null ? `${server.intelligence.cacheAge} hours` : 'Fresh'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 gap-2"
                      onClick={() => window.open(`https://www.battlemetrics.com/servers/dayz/${server.intelligence!.battlemetricsId}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on BattleMetrics
                    </Button>
                  </div>
                </div>
              )}

              {/* Trust Explanation */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Trust scores are calculated using BattleMetrics data, player count consistency, uptime history, and anti-fraud detection algorithms. Scores are updated every 24 hours.
                </p>
              </div>
            </TabsContent>
          )}

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Connection Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Connection Info</h4>
              <div className="bg-secondary rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="mono text-foreground" data-testid="text-detail-ip">
                    {server.address}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Region:</span>
                  <span className="text-foreground">{server.region}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="text-foreground">{server.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Restarts:</span>
                  <span className="text-foreground">{server.restartSchedule || "Every 4 hours"}</span>
                </div>
              </div>
            </div>

            {/* Server Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Server Settings</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Perspective</div>
                  <div className="text-sm font-medium text-foreground">
                    {server.perspective === "1PP" ? "1st Person Only" : 
                     server.perspective === "3PP" ? "3rd Person" : "Both"}
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Time Accel.</div>
                  <div className="text-sm font-medium text-foreground">Normal (1x)</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Map</div>
                  <div className="text-sm font-medium text-foreground">{server.map}</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Last Wipe</div>
                  <div className="text-sm font-medium text-foreground">
                    {server.lastWipe ? formatDistanceToNow(new Date(server.lastWipe), { addSuffix: true }) : "Unknown"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mods" className="space-y-4 mt-4">
            {/* Required Mods */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Required Mods ({(server.mods ?? []).length})
                </h4>
                <span className="text-xs text-muted-foreground">
                  Total: {formatBytes(getTotalModSize())}
                </span>
              </div>

              {(server.mods ?? []).length === 0 ? (
                <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
                  <Badge variant="secondary" className="badge-success mb-2">Vanilla Server</Badge>
                  <p className="text-sm text-muted-foreground">
                    No mods required - just install and play!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(server.mods ?? []).map((mod) => {
                    const workshopData = Array.isArray(workshopMods) 
                      ? workshopMods.find(w => w.workshopId === mod.workshopId)
                      : undefined;
                    const hasWorkshopData = !!workshopData;
                    
                    return (
                      <div 
                        key={mod.id} 
                        className={`bg-secondary rounded-lg overflow-hidden ${hasWorkshopData ? 'border border-primary/20' : ''}`}
                      >
                        <div className="flex gap-3 p-3">
                          {hasWorkshopData && workshopData.previewUrl && (
                            <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-background/50">
                              <img 
                                src={workshopData.previewUrl} 
                                alt={workshopData.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-foreground truncate">
                                  {hasWorkshopData ? workshopData.title : mod.name}
                                </h5>
                                {hasWorkshopData && workshopData.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {workshopData.description.substring(0, 100)}...
                                  </p>
                                )}
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={mod.installed ? "badge-success flex-shrink-0" : "badge-warning flex-shrink-0"}
                              >
                                {mod.installed ? "Installed" : "Required"}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="mono">@{mod.id}</span>
                              {hasWorkshopData && workshopData.fileSize && (
                                <span className="flex items-center gap-1">
                                  <Download className="w-3 h-3" />
                                  {formatBytes(workshopData.fileSize)}
                                </span>
                              )}
                              {hasWorkshopData && workshopData.subscriberCount && (
                                <span>{workshopData.subscriberCount.toLocaleString()} subscribers</span>
                              )}
                              {mod.workshopId && (
                                <a
                                  href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${mod.workshopId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                  data-testid={`link-workshop-${mod.id}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Workshop
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {isLoadingWorkshop && workshopIds.length > 0 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      Loading mod details from Steam Workshop...
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Server Rules</h4>
              <div className="bg-secondary rounded-lg p-3 space-y-2 text-sm text-muted-foreground">
                <p>• No cheating or exploiting</p>
                <p>• Respect other players</p>
                <p>• No offensive language in global chat</p>
                <p>• No griefing or base raiding offline players</p>
                <p>• Follow server-specific KOS rules</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="players" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Current Players</h4>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Player list not available
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Join Action */}
        <div className="space-y-3">
          <Button 
            onClick={onJoin}
            className="w-full px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-base"
            data-testid="button-join-detail"
          >
            <Play className="w-5 h-5 mr-2" />
            Join Server Now
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleToggleFavorite}
              className="flex-1"
              data-testid="button-toggle-favorite"
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorite(server.address) ? 'fill-current text-red-500' : ''}`} />
              {isFavorite(server.address) ? 'Remove from Favorites' : 'Add to Favorites'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleCopyIP}
              className="flex-1"
              data-testid="button-copy-ip"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy IP
            </Button>
          </div>
        </div>

        {/* Time to Fun Estimator */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Estimated Time to Fun</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mod Downloads:</span>
              <span className="text-foreground font-medium">
                {(server.mods ?? []).length === 0 ? "0 minutes" : `~${getEstimatedDownloadTime()} minutes`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Queue Wait:</span>
              <span className="text-foreground font-medium">
                ~{Math.max(1, Math.ceil((server.queue ?? 0) / 2))} minutes
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Game Launch:</span>
              <span className="text-foreground font-medium">~30 seconds</span>
            </div>
            <div className="h-px bg-border my-2"></div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-semibold">Total Time:</span>
              <span className="text-primary font-bold">
                ~{getEstimatedDownloadTime() + Math.max(1, Math.ceil((server.queue ?? 0) / 2)) + 1} minutes
              </span>
            </div>
          </div>
        </div>

        {/* Server Owner Info */}
        <div className="bg-secondary rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Server Admin Team</div>
              <div className="text-xs text-muted-foreground">Verified Owner</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              Discord
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Website
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
