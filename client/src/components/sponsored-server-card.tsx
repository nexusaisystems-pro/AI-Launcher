import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Wifi, Map, Puzzle, Shield, Star, Zap } from "lucide-react";
import type { ServerWithIntelligence } from "@/hooks/use-servers";

interface SponsoredServerCardProps {
  server: ServerWithIntelligence;
  onSelect: () => void;
  onJoin: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function SponsoredServerCardComponent({ server, onSelect, onJoin, isFavorite, onToggleFavorite }: SponsoredServerCardProps) {
  const qualityColors: Record<string, string> = {
    S: "from-yellow-500/30 to-yellow-600/30 border-yellow-500/50",
    A: "from-green-500/30 to-green-600/30 border-green-500/50",
    B: "from-blue-500/30 to-blue-600/30 border-blue-500/50",
    C: "from-gray-500/30 to-gray-600/30 border-gray-500/50",
    D: "from-orange-500/30 to-orange-600/30 border-orange-500/50",
    F: "from-red-500/30 to-red-600/30 border-red-500/50",
  };

  const qualityGlow: Record<string, string> = {
    S: "shadow-yellow-500/20",
    A: "shadow-green-500/20",
    B: "shadow-blue-500/20",
    C: "shadow-gray-500/20",
    D: "shadow-orange-500/20",
    F: "shadow-red-500/20",
  };

  const qualityGrade = server.intelligence?.grade || "C";

  return (
    <div 
      className={`
        group relative overflow-hidden rounded-xl border-2 
        bg-gradient-to-br ${qualityColors[qualityGrade]}
        backdrop-blur-md transition-all duration-300 
        hover:scale-[1.02] hover:shadow-2xl ${qualityGlow[qualityGrade]}
        cursor-pointer
      `}
      onClick={onSelect}
      data-testid={`sponsored-server-card-${server.address}`}
    >
      {/* Sponsored Badge - Top Right */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <Badge 
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-xs px-2 py-0.5 shadow-lg"
          data-testid={`badge-sponsored-${server.address}`}
        >
          <Zap className="w-3 h-3 mr-0.5" />
          SPONSORED
        </Badge>
      </div>

      {/* Favorite Star - Top Left */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="absolute top-2 left-2 z-10 text-yellow-400 hover:text-yellow-300 transition-colors"
        data-testid={`button-favorite-${server.address}`}
      >
        <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400' : ''}`} />
      </button>

      {/* Quality Grade Badge */}
      <div className="absolute top-2 left-10 z-10">
        <div className={`
          w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm
          ${qualityGrade === 'S' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : ''}
          ${qualityGrade === 'A' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : ''}
          ${qualityGrade === 'B' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : ''}
          ${qualityGrade === 'C' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50' : ''}
          ${qualityGrade === 'D' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : ''}
          ${qualityGrade === 'F' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : ''}
        `}>
          {qualityGrade}
        </div>
      </div>

      <div className="p-2.5 pt-10">
        {/* Server Name */}
        <h3 className="text-sm font-bold mb-2 text-white line-clamp-1 pr-16" data-testid={`text-server-name-${server.address}`}>
          {server.name}
        </h3>

        {/* Server Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="flex items-center gap-1 text-white/90">
            <Users className="w-3 h-3 text-primary-glow" />
            <span className="text-xs font-semibold" data-testid={`text-players-${server.address}`}>
              {server.playerCount}/{server.maxPlayers}
            </span>
          </div>

          <div className="flex items-center gap-1 text-white/90">
            <Wifi className="w-3 h-3 text-green-400" />
            <span className="text-xs font-semibold" data-testid={`text-ping-${server.address}`}>
              {server.ping}ms
            </span>
          </div>

          <div className="flex items-center gap-1 text-white/90">
            <Map className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-semibold truncate" data-testid={`text-map-${server.address}`}>
              {server.map}
            </span>
          </div>

          <div className="flex items-center gap-1 text-white/90">
            <Puzzle className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-semibold" data-testid={`text-mods-${server.address}`}>
              {(server.mods?.length || 0)}
            </span>
          </div>
        </div>

        {/* Region & Perspective Badges */}
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {server.region && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-white/10 border-white/20">
              {server.region}
            </Badge>
          )}
          {server.perspective && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-white/10 border-white/20">
              {server.perspective}
            </Badge>
          )}
          {server.passwordProtected && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-red-500/20 text-red-400 border-red-500/30">
              <Shield className="w-3 h-3 mr-0.5" />
              Lock
            </Badge>
          )}
        </div>

        {/* Join Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 font-bold text-sm py-2 neon-glow transition-all"
          data-testid={`button-join-${server.address}`}
        >
          Join Server
        </Button>
      </div>

      {/* Animated border glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse" />
      </div>
    </div>
  );
}

export const SponsoredServerCard = memo(SponsoredServerCardComponent);
