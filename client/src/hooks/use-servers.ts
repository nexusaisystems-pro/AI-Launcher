import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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

interface PaginatedServersResponse {
  servers: ServerWithIntelligence[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useServersInfinite(filters?: ServerFilters, sortBy: string = "players", pageSize: number = 50) {
  return useInfiniteQuery<PaginatedServersResponse>({
    queryKey: ["/api/servers/paginated", filters, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(pageSize),
        sortBy: sortBy,
        intelligence: 'true'
      });
      
      if (filters) {
        params.append('filters', JSON.stringify(filters));
      }
      
      const response = await fetch(`/api/servers?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch servers: ${response.statusText}`);
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000, // 30 seconds
  });
}
