import { useQuery } from "@tanstack/react-query";
import type { ServerWithIntelligence } from "./use-servers";

export function useSponsoredServers(limit = 3) {
  return useQuery<ServerWithIntelligence[]>({
    queryKey: ["/api/servers/sponsored", limit],
    queryFn: async () => {
      const response = await fetch(`/api/servers/sponsored?intelligence=true&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sponsored servers: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
}
