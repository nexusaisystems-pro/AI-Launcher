import { useQuery } from "@tanstack/react-query";
import type { Server, ServerStats, ServerFilters } from "@shared/schema";

export function useServers(endpoint = "/api/servers", filters?: ServerFilters) {
  return useQuery<Server[] | ServerStats>({
    queryKey: [endpoint, filters],
    queryFn: async () => {
      const url = endpoint === "/api/servers" && filters 
        ? `${endpoint}?filters=${encodeURIComponent(JSON.stringify(filters))}`
        : endpoint;
      
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
