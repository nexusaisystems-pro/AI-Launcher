import { useRecommendations, type ServerRecommendation } from "@/hooks/use-recommendations";
import { useServers } from "@/hooks/use-servers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, Wifi, Gem, Eye, TrendingUp, Loader2 } from "lucide-react";

interface SidebarRecommendationsProps {
  onSelectServer?: (address: string) => void;
  onJoinServer?: (address: string) => void;
}

const categoryIcons: Record<ServerRecommendation["category"], React.ReactNode> = {
  "perfect-match": <Sparkles className="w-3 h-3" />,
  "hidden-gem": <Gem className="w-3 h-3" />,
  "similar": <Eye className="w-3 h-3" />,
  "try-new": <TrendingUp className="w-3 h-3" />,
  "hot-now": <TrendingUp className="w-3 h-3" />,
};

const categoryLabels: Record<ServerRecommendation["category"], string> = {
  "perfect-match": "Perfect Match",
  "hidden-gem": "Hidden Gem",
  "similar": "Similar",
  "try-new": "Try New",
  "hot-now": "Hot Now",
};

const categoryColors: Record<ServerRecommendation["category"], string> = {
  "perfect-match": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "hidden-gem": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "similar": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "try-new": "bg-green-500/20 text-green-400 border-green-500/30",
  "hot-now": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export function SidebarRecommendations({ onSelectServer, onJoinServer }: SidebarRecommendationsProps) {
  const { data: recommendations, isLoading } = useRecommendations(3);
  const { data: serversData } = useServers();
  const servers = Array.isArray(serversData) ? serversData : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!recommendations?.recommendations || recommendations.recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
        <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary-glow" />
        </div>
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-primary-glow">
          AI Recommendations
        </h3>
      </div>

      {recommendations.recommendations.slice(0, 3).map((rec) => {
        const server = servers.find(s => s.address === rec.serverAddress);
        if (!server) return null;

        return (
          <div
            key={rec.serverAddress}
            className="glass-card p-3 space-y-2 hover:border-primary/40 transition-all cursor-pointer group"
            onClick={() => onSelectServer?.(server.address)}
            data-testid={`ai-rec-${server.address}`}
          >
            {/* Category Badge */}
            <Badge 
              variant="secondary"
              className={`text-[10px] px-2 py-0.5 ${categoryColors[rec.category]}`}
            >
              {categoryIcons[rec.category]}
              <span className="ml-1">{categoryLabels[rec.category]}</span>
            </Badge>

            {/* Server Name */}
            <div className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary-glow transition-colors">
              {server.name}
            </div>

            {/* Server Info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{server.playerCount}/{server.maxPlayers}</span>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                <span>{server.ping}ms</span>
              </div>
            </div>

            {/* Reason */}
            <p className="text-[10px] text-muted-foreground/80 italic line-clamp-2">
              {rec.reason}
            </p>

            {/* Join Button */}
            <Button
              size="sm"
              className="w-full text-xs neon-glow"
              onClick={(e) => {
                e.stopPropagation();
                onJoinServer?.(server.address);
              }}
              data-testid={`button-join-rec-${server.address}`}
            >
              Join Server
            </Button>
          </div>
        );
      })}
    </div>
  );
}
