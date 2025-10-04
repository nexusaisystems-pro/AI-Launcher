import type { InsertBattleMetricsCache } from "@shared/schema";

const BATTLEMETRICS_API_KEY = process.env.BATTLEMETRICS_API_KEY;
const BATTLEMETRICS_BASE_URL = "https://api.battlemetrics.com";

interface BattleMetricsServer {
  id: string;
  type: "server";
  attributes: {
    id: string;
    name: string;
    address: string | null;
    ip: string;
    port: number;
    players: number;
    maxPlayers: number;
    rank: number;
    location: string[];
    status: string;
    details: {
      map?: string;
      version?: string;
      official?: boolean;
      modNames?: string[];
      time?: string;
      [key: string]: any;
    };
    private: boolean;
    createdAt: string;
    updatedAt: string;
    portQuery: number;
    country: string;
    queryStatus: string;
  };
}

interface BattleMetricsServerListResponse {
  data: BattleMetricsServer[];
  links?: {
    next?: string;
  };
  included?: any[];
}

interface BattleMetricsServerResponse {
  data: BattleMetricsServer;
}

export class BattleMetricsService {
  private async fetchFromBattleMetrics(endpoint: string, params?: Record<string, string>): Promise<any> {
    if (!BATTLEMETRICS_API_KEY) {
      console.error('BATTLEMETRICS_API_KEY is not configured');
      return null;
    }

    try {
      const url = new URL(`${BATTLEMETRICS_BASE_URL}${endpoint}`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BATTLEMETRICS_API_KEY}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`BattleMetrics API returned ${response.status}: ${response.statusText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching from BattleMetrics API:', error);
      return null;
    }
  }

  async searchServerByAddress(address: string): Promise<InsertBattleMetricsCache | null> {
    const [ip, port] = address.split(':');
    
    const data: BattleMetricsServerListResponse = await this.fetchFromBattleMetrics('/servers', {
      'filter[game]': 'dayz',
      'filter[search]': `${ip}:${port}`,
      'page[size]': '1',
    });

    if (!data || !data.data || data.data.length === 0) {
      console.log(`[BattleMetrics] No server found for address: ${address}`);
      return null;
    }

    const server = data.data[0];
    return this.mapToCacheEntry(server, address);
  }

  async getServerById(battlemetricsId: string): Promise<InsertBattleMetricsCache | null> {
    const data: BattleMetricsServerResponse = await this.fetchFromBattleMetrics(`/servers/${battlemetricsId}`);

    if (!data || !data.data) {
      console.log(`[BattleMetrics] No server found for ID: ${battlemetricsId}`);
      return null;
    }

    const server = data.data;
    const address = server.attributes.address || `${server.attributes.ip}:${server.attributes.port}`;
    return this.mapToCacheEntry(server, address);
  }

  private mapToCacheEntry(server: BattleMetricsServer, serverAddress: string): InsertBattleMetricsCache {
    const attrs = server.attributes;
    
    const cityName = attrs.location && attrs.location.length > 0 
      ? attrs.location.slice(0, 2).join(', ') 
      : undefined;

    return {
      serverId: server.id,
      serverAddress,
      battlemetricsId: server.id,
      rank: attrs.rank || 0,
      uptimePercent7d: null,
      uptimePercent30d: null,
      avgPlayerCount7d: null,
      peakPlayerCount7d: null,
      maxPlayerCount: attrs.maxPlayers,
      serverAge: null,
      status: attrs.status,
      country: attrs.country,
      cityName,
      details: {
        firstSeen: attrs.createdAt,
        lastSeen: attrs.updatedAt,
        privateServer: attrs.private,
        createdAt: attrs.createdAt,
        updatedAt: attrs.updatedAt,
        portQuery: attrs.portQuery,
        portGame: attrs.port,
        players: attrs.players,
        maxPlayers: attrs.maxPlayers,
        map: attrs.details?.map,
        version: attrs.details?.version,
        queryStatus: attrs.queryStatus,
      },
    };
  }

  async enrichServersWithBattleMetrics(servers: Array<{ id: string; address: string }>): Promise<Map<string, InsertBattleMetricsCache>> {
    const results = new Map<string, InsertBattleMetricsCache>();
    
    const promises = servers.map(async (server) => {
      const bmData = await this.searchServerByAddress(server.address);
      if (bmData) {
        results.set(server.id, { ...bmData, serverId: server.id });
      }
    });

    await Promise.allSettled(promises);
    
    console.log(`[BattleMetrics] Enriched ${results.size}/${servers.length} servers`);
    return results;
  }
}

export const battleMetricsService = new BattleMetricsService();
