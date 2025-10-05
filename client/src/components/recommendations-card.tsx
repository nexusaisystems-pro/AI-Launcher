import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecommendations, type ServerRecommendation } from "@/hooks/use-recommendations";
import { useServers } from "@/hooks/use-servers";
import { Sparkles, TrendingUp, Eye, Gem, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

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
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: "start",
    slidesToScroll: 1,
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

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
    <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-md overflow-hidden" data-testid="card-recommendations">
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
      <CardContent className="relative group">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {recommendations.recommendations.map((rec, index) => {
              const server = servers.find((s: any) => s.address === rec.serverAddress);
              if (!server) return null;

              return (
                <motion.div
                  key={rec.serverAddress}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-[0_0_280px] min-w-0"
                  data-testid={`recommendation-${rec.serverAddress}`}
                >
                  <div 
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all cursor-pointer h-full hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20"
                    onClick={() => onSelectServer?.(rec.serverAddress)}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`${categoryColors[rec.category]} flex items-center gap-1 text-xs`}
                          data-testid={`badge-category-${rec.category}`}
                        >
                          {categoryIcons[rec.category]}
                          {categoryLabels[rec.category]}
                        </Badge>
                      </div>

                      <h4 className="font-medium text-sm text-white hover:text-cyan-400 transition-colors mb-1.5 line-clamp-1" data-testid={`text-server-name-${rec.serverAddress}`}>
                        {server.name}
                      </h4>
                      
                      <div className="flex items-center gap-1 text-xs text-cyan-400/80 mb-2">
                        <Sparkles className="w-3 h-3" />
                        {Math.round(rec.confidence * 100)}% match
                      </div>

                      <p className="text-xs text-white/70 mb-2 line-clamp-2 flex-1" data-testid={`text-reason-${rec.serverAddress}`}>
                        {rec.reason}
                      </p>

                      {rec.highlights && rec.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {rec.highlights.slice(0, 2).map((highlight, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 line-clamp-1"
                              data-testid={`highlight-${i}-${rec.serverAddress}`}
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoinServer?.(rec.serverAddress);
                        }}
                        className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/30 text-cyan-400"
                        data-testid={`button-join-${rec.serverAddress}`}
                      >
                        Join Server
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {canScrollPrev && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-12 rounded-none bg-gradient-to-r from-black/80 to-transparent hover:from-black/90 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </Button>
        )}

        {canScrollNext && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-12 rounded-none bg-gradient-to-l from-black/80 to-transparent hover:from-black/90 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
