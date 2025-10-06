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
      serverName: attrs.name || null,
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
        modNames: attrs.details?.modNames || [],
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

  async discoverDayZServers(maxServers = 100): Promise<Array<{address: string; name: string; playerCount: number; maxPlayers: number; map?: string}>> {
    console.log(`[BattleMetrics] Discovering up to ${maxServers} DayZ servers...`);
    
    const servers: Array<{address: string; name: string; playerCount: number; maxPlayers: number; map?: string}> = [];
    let pageSize = Math.min(maxServers, 100);
    
    try {
      const data: BattleMetricsServerListResponse = await this.fetchFromBattleMetrics('/servers', {
        'filter[game]': 'dayz',
        'page[size]': String(pageSize),
        'sort': '-players',
      });

      if (!data || !data.data || data.data.length === 0) {
        console.log('[BattleMetrics] No servers found');
        return servers;
      }

      for (const server of data.data) {
        const serverName = server.attributes.name || '';
        
        // Skip servers that have been moved (stale listings)
        if (serverName.toUpperCase().includes('MOVED') || 
            serverName.toUpperCase().includes('MIGRATED') ||
            serverName.toUpperCase().includes('RELOCATED')) {
          console.log(`[BattleMetrics] Skipping moved server: ${serverName}`);
          continue;
        }
        
        const address = server.attributes.address || `${server.attributes.ip}:${server.attributes.port}`;
        servers.push({
          address,
          name: serverName,
          playerCount: server.attributes.players,
          maxPlayers: server.attributes.maxPlayers,
          map: server.attributes.details?.map,
        });

        if (servers.length >= maxServers) {
          break;
        }
      }

      console.log(`[BattleMetrics] Discovered ${servers.length} DayZ servers`);
      return servers;
    } catch (error) {
      console.error('[BattleMetrics] Failed to discover servers:', error);
      return servers;
    }
  }

  async getServerDetails(address: string): Promise<{
    address: string;
    name: string;
    map?: string;
    playerCount: number;
    maxPlayers: number;
    ping?: number;
    passwordProtected?: boolean;
    perspective?: string;
    region?: string;
    version?: string;
    mods?: any[];
    verified?: boolean;
  } | null> {
    const [ip, port] = address.split(':');
    
    const data: BattleMetricsServerListResponse = await this.fetchFromBattleMetrics('/servers', {
      'filter[game]': 'dayz',
      'filter[search]': `${ip}:${port}`,
      'page[size]': '1',
    });

    if (!data || !data.data || data.data.length === 0) {
      return null;
    }

    const server = data.data[0];
    const attrs = server.attributes;

    return {
      address,
      name: attrs.name,
      map: attrs.details?.map,
      playerCount: attrs.players,
      maxPlayers: attrs.maxPlayers,
      ping: undefined,
      passwordProtected: attrs.private,
      perspective: undefined,
      region: this.determineRegionFromCountry(attrs.country),
      version: attrs.details?.version,
      mods: attrs.details?.modNames?.map((modName: string) => ({
        id: modName,
        name: modName,
        size: 0,
        required: true,
        installed: false,
      })) || [],
      verified: attrs.queryStatus === 'valid',
    };
  }

  private determineRegionFromCountry(country: string): string {
    const euCountries = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'CZ', 'SE', 'NO', 'DK', 'FI', 'AT', 'CH', 'PT', 'GR', 'RO', 'HU'];
    const naCountries = ['US', 'CA', 'MX'];
    const asiaCountries = ['CN', 'JP', 'KR', 'SG', 'TH', 'IN', 'ID', 'MY', 'PH', 'VN'];
    const oceaniaCountries = ['AU', 'NZ'];
    const saCountries = ['BR', 'AR', 'CL', 'CO', 'PE'];

    if (euCountries.includes(country)) return 'EU';
    if (naCountries.includes(country)) return 'NA';
    if (asiaCountries.includes(country)) return 'ASIA';
    if (oceaniaCountries.includes(country)) return 'OCE';
    if (saCountries.includes(country)) return 'SA';
    
    return 'Other';
  }
}

export const battleMetricsService = new BattleMetricsService();
