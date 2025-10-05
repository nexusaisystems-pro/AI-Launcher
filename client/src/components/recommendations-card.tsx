import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecommendations, type ServerRecommendation } from "@/hooks/use-recommendations";
import { useServers } from "@/hooks/use-servers";
import { Sparkles, TrendingUp, Eye, Gem, RefreshCw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface RecommendationsCardProps {
  onSelectServer?: (address: string) => void;
  onJoinServer?: (address: string) => void;
}

const categoryIcons: Record<ServerRecommendation["category"], React.ReactNode> = {
  "perfect-match": <Sparkles className="w-4 h-4" />,
  "hidden-gem": <Gem className="w-4 h-4" />,
  "similar": <Eye className="w-4 h-4" />,
  "try-new": <TrendingUp className="w-4 h-4" />,
  "hot-now": <TrendingUp className="w-4 h-4" />,
};

const categoryLabels: Record<ServerRecommendation["category"], string> = {
  "perfect-match": "Perfect Match",
  "hidden-gem": "Hidden Gem",
  "similar": "Similar",
  "try-new": "Try Something New",
  "hot-now": "Hot Right Now",
};

const categoryColors: Record<ServerRecommendation["category"], string> = {
  "perfect-match": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "hidden-gem": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "similar": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "try-new": "bg-green-500/20 text-green-400 border-green-500/30",
  "hot-now": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export function RecommendationsCard({ onSelectServer, onJoinServer }: RecommendationsCardProps) {
  const { data: recommendations, isLoading, error, refetch, isFetching } = useRecommendations(5);
  const { data: serversData } = useServers();
  const servers = Array.isArray(serversData) ? serversData : [];

  if (error) {
    return (
      <Card className="bg-black/40 border-red-500/30 backdrop-blur-md" data-testid="card-recommendations-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Sparkles className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription className="text-red-300/70">
            Failed to load recommendations. {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-md" data-testid="card-recommendations-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Analyzing your preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-md" data-testid="card-recommendations-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            {recommendations?.message || "Play more to get personalized recommendations!"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-md" data-testid="card-recommendations">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              AI Recommendations
            </CardTitle>
            <CardDescription className="mt-1">
              Personalized picks based on your play style
              {recommendations.fromCache && " (cached)"}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-cyan-400 hover:text-cyan-300"
            data-testid="button-refresh-recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.recommendations.map((rec, index) => {
            const server = servers.find((s: any) => s.address === rec.serverAddress);
            if (!server) return null;

            return (
              <motion.div
                key={rec.serverAddress}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
                onClick={() => onSelectServer?.(rec.serverAddress)}
                data-testid={`recommendation-${rec.serverAddress}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`${categoryColors[rec.category]} flex items-center gap-1 text-xs`}
                        data-testid={`badge-category-${rec.category}`}
                      >
                        {categoryIcons[rec.category]}
                        {categoryLabels[rec.category]}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Sparkles className="w-3 h-3" />
                        {Math.round(rec.confidence * 100)}% match
                      </div>
                    </div>

                    <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors truncate" data-testid={`text-server-name-${rec.serverAddress}`}>
                      {server.name}
                    </h4>
                    <p className="text-sm text-white/70 mt-1" data-testid={`text-reason-${rec.serverAddress}`}>{rec.reason}</p>

                    {rec.highlights && rec.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rec.highlights.map((highlight, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                            data-testid={`highlight-${i}-${rec.serverAddress}`}
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinServer?.(rec.serverAddress);
                    }}
                    className="shrink-0 bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/30 text-cyan-400"
                    data-testid={`button-join-${rec.serverAddress}`}
                  >
                    Join
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
