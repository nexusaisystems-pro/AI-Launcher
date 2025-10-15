import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, ArrowRight, Sparkles, Users, Shield, Zap, Loader2, Server } from "lucide-react";

interface GameCardProps {
  name: string;
  status: "beta" | "coming-soon";
  colorScheme: string;
  icon: React.ReactNode;
  path?: string;
  stats?: {
    servers?: number;
    players?: number;
  };
  statsLoading?: boolean;
}

function GameCard({ name, status, colorScheme, icon, path, stats, statsLoading }: GameCardProps) {
  const content = (
    <Card 
      className={`glass border-2 ${colorScheme} transition-all duration-300 hover:scale-105 hover:shadow-2xl ${path ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
      data-testid={`card-game-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-xl font-bold text-white">{name}</CardTitle>
              <Badge 
                variant={status === "beta" ? "default" : "secondary"}
                className={`mt-1 ${status === "beta" ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}
              >
                {status === "beta" ? "BETA TESTING" : "COMING SOON"}
              </Badge>
            </div>
          </div>
          {path && <ArrowRight className="w-5 h-5 text-white/50" />}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-300 mb-3">
          {status === "beta" 
            ? "Browse servers, join games, manage mods" 
            : "Advanced server browser launching soon"}
        </CardDescription>
        {status === "beta" && stats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-slate-400">
              <Server className="w-4 h-4" />
              {statsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="font-semibold">{stats.servers?.toLocaleString() || 0}</span>
              )}
              <span className="text-xs">servers</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Users className="w-4 h-4" />
              {statsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="font-semibold">{stats.players?.toLocaleString() || 0}</span>
              )}
              <span className="text-xs">players</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (path) {
    return <Link href={path}>{content}</Link>;
  }
  
  return content;
}

export default function Homepage() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    serversOnline: number;
    totalPlayers: number;
    avgPlayers: number;
  }>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refetch every 30s
  });

  const games = [
    {
      name: "DayZ",
      status: "beta" as const,
      colorScheme: "border-green-500/30 hover:border-green-500/60 bg-gradient-to-br from-green-950/30 to-slate-900/30",
      icon: <Gamepad2 className="w-8 h-8 text-green-400" />,
      path: "/dayz",
      stats: {
        servers: stats?.serversOnline,
        players: stats?.totalPlayers,
      },
      statsLoading
    },
    {
      name: "Rust",
      status: "coming-soon" as const,
      colorScheme: "border-orange-500/30 hover:border-orange-500/60 bg-gradient-to-br from-orange-950/30 to-slate-900/30",
      icon: <Gamepad2 className="w-8 h-8 text-orange-400" />
    },
    {
      name: "Valheim",
      status: "coming-soon" as const,
      colorScheme: "border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-950/30 to-slate-900/30",
      icon: <Gamepad2 className="w-8 h-8 text-blue-400" />
    },
    {
      name: "Minecraft",
      status: "coming-soon" as const,
      colorScheme: "border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-br from-emerald-950/30 to-slate-900/30",
      icon: <Gamepad2 className="w-8 h-8 text-emerald-400" />
    },
    {
      name: "Arma 3",
      status: "coming-soon" as const,
      colorScheme: "border-yellow-500/30 hover:border-yellow-500/60 bg-gradient-to-br from-yellow-950/30 to-slate-900/30",
      icon: <Gamepad2 className="w-8 h-8 text-yellow-400" />
    },
    {
      name: "Counter Strike 2",
      status: "coming-soon" as const,
      colorScheme: "border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-br from-purple-950/30 to-slate-900/30",
      icon: <Gamepad2 className="w-8 h-8 text-purple-400" />
    },
    {
      name: "7 Days to Die",
      status: "coming-soon" as const,
      colorScheme: "border-red-500/30 hover:border-red-500/60 bg-gradient-to-br from-red-950/30 to-slate-900/30",
      icon: <Gamepad2 className="w-8 h-8 text-red-400" />
    },
    {
      name: "Project Zomboid",
      status: "coming-soon" as const,
      colorScheme: "border-pink-500/30 hover:border-pink-500/60 bg-gradient-to-br from-pink-950/30 to-slate-900/30",
      icon: <Gamepad2 className="w-8 h-8 text-pink-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Hero Section */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                <div className="absolute inset-0 blur-xl bg-primary/50 animate-pulse"></div>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
                GameHub Launcher
              </h1>
            </div>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              The next-generation multi-game server browser platform. Find servers, manage mods, and join games instantly.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>100,000+ Players</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Verified Servers</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>One-Click Join</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Select Your Game</h2>
          <p className="text-slate-400">Choose from our supported games to get started</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {games.map((game) => (
            <GameCard key={game.name} {...game} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-500 text-sm">
            More games coming soon. Join our community to get notified about new releases.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>© 2025 Nexus AI Systems. GameHub Launcher - Multi-Game Server Browser Platform.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
