import { useQuery } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session";

export interface ServerRecommendation {
  serverAddress: string;
  confidence: number;
  reason: string;
  category: "perfect-match" | "hidden-gem" | "similar" | "try-new" | "hot-now";
  highlights: string[];
}

export interface RecommendationResponse {
  recommendations: ServerRecommendation[];
  generatedAt: string;
  fromCache?: boolean;
  message?: string;
}

export function useRecommendations(limit: number = 5) {
  const sessionId = getSessionId();

  return useQuery<RecommendationResponse>({
    queryKey: [`/api/recommendations/${sessionId}?limit=${limit}`],
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
    refetchInterval: false, // Don't auto-refetch to save API costs
  });
}
