import { useQuery } from '@tanstack/react-query';
import type { WorkshopMod } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export function useWorkshopMods(workshopIds: string[]) {
  return useQuery({
    queryKey: ['/api/workshop/mods', workshopIds.join(',')],
    queryFn: async () => {
      if (workshopIds.length === 0) return [];
      
      const response = await apiRequest('POST', '/api/workshop/mods', {
        workshopIds,
        forceRefresh: false,
      });
      
      return response as WorkshopMod[];
    },
    enabled: workshopIds.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useWorkshopMod(workshopId: string | undefined) {
  return useQuery({
    queryKey: ['/api/workshop/mods', workshopId],
    enabled: !!workshopId,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
