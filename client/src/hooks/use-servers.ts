import { useQuery } from "@tanstack/react-query";
import type { Server, ServerStats, ServerFilters } from "@shared/schema";

export interface ServerIntelligence {
  qualityScore: number;
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  verified: boolean;
  trustIndicators: {
    uptime7d: number | null;
    rank: number | null;
    trend: "rising" | "stable" | "declining" | "unknown";
    playerConsistency: number;
    a2sVsBmMatch: number;
  };
  fraudFlags: Array<{
    type: "INFLATED_PLAYERS" | "FALSE_UPTIME" | "SUSPICIOUS_RANK" | "BM_MISMATCH";
    severity: "high" | "medium" | "low";
    evidence: string;
  }>;
  battlemetricsRank: number | null;
  battlemetricsStatus: string | null;
  battlemetricsId: string | null;
  battlemetricsName: string | null;
  cacheAge: number | null;
}

export type ServerWithIntelligence = Server & {
  intelligence?: ServerIntelligence;
};

export function useServers(endpoint = "/api/servers", filters?: ServerFilters, withIntelligence = false) {
  return useQuery<Server[] | ServerStats>({
    queryKey: [endpoint, filters, withIntelligence],
    queryFn: async () => {
      let url = endpoint;
      
      if (endpoint === "/api/servers") {
        const params = new URLSearchParams();
        if (filters) {
          params.append('filters', JSON.stringify(filters));
        }
        if (withIntelligence) {
          params.append('intelligence', 'true');
        }
        if (params.toString()) {
          url = `${endpoint}?${params.toString()}`;
        }
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

export function useServer(address: string) {
  return useQuery<Server>({
    queryKey: ["/api/servers", address],
    queryFn: async () => {
      const response = await fetch(`/api/servers/${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch server: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!address,
  });
}
