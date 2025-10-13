import type { InsertBattleMetricsCache } from "@shared/schema";
import { detectPerspectiveFromServerName } from './perspective-detector';

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
      tags?: string[];
      [key: string]: any;
    };
    private: boolean;
    createdAt: string;
    updatedAt: string;
    portQuery: number;
    country: string;
    queryStatus: string;
  };
  relationships?: {
    organization?: {
      data?: {
        id: string;
        type: string;
      };
    };
    [key: string]: any;
  };
}

interface BattleMetricsIncluded {
  id: string;
  type: string;
  attributes?: {
    name?: string;
    [key: string]: any;
  };
}

interface BattleMetricsServerListResponse {
  data: BattleMetricsServer[];
  links?: {
    next?: string;
  };
  included?: BattleMetricsIncluded[];
}

interface BattleMetricsServerResponse {
  data: BattleMetricsServer;
  included?: BattleMetricsIncluded[];
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
        const errorBody = await response.text().catch(() => 'Unable to read error body');
        console.error(`BattleMetrics API returned ${response.status}: ${response.statusText}`);
        console.error(`URL: ${url.toString()}`);
        console.error(`Error body: ${errorBody}`);
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
    return this.mapToCacheEntry(server, address, data.included);
  }

  async getServerById(battlemetricsId: string): Promise<InsertBattleMetricsCache | null> {
    const data: BattleMetricsServerResponse = await this.fetchFromBattleMetrics(`/servers/${battlemetricsId}`);

    if (!data || !data.data) {
      console.log(`[BattleMetrics] No server found for ID: ${battlemetricsId}`);
      return null;
    }

    const server = data.data;
    const address = server.attributes.address || `${server.attributes.ip}:${server.attributes.port}`;
    return this.mapToCacheEntry(server, address, data.included);
  }

  async getServerDetailsWithRelationships(battlemetricsId: string): Promise<InsertBattleMetricsCache | null> {
    const data: BattleMetricsServerResponse = await this.fetchFromBattleMetrics(`/servers/${battlemetricsId}`);

    if (!data || !data.data) {
      console.log(`[BattleMetrics] No server details found for ID: ${battlemetricsId}`);
      return null;
    }

    const server = data.data;
    const address = server.attributes.address || `${server.attributes.ip}:${server.attributes.port}`;
    return this.mapToCacheEntry(server, address, data.included);
  }

  async searchServersByName(query: string, maxResults = 50, useFullTextSearch = true): Promise<Array<{
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
    battlemetricsId?: string;
    tags?: string[];
  }>> {
    console.log(`[BattleMetrics] Searching for servers matching: "${query}" (fullText: ${useFullTextSearch})`);
    
    const results: Array<any> = [];
    
    try {
      const searchParams: Record<string, string> = {
        'filter[game]': 'dayz',
        'page[size]': String(Math.min(maxResults, 100)),
        'sort': '-players',
      };

      if (useFullTextSearch) {
        searchParams['filter[search]'] = query;
      } else {
        searchParams['filter[search]'] = query;
      }

      const data: BattleMetricsServerListResponse = await this.fetchFromBattleMetrics('/servers', searchParams);

      if (!data || !data.data || data.data.length === 0) {
        console.log(`[BattleMetrics] No servers found matching: "${query}"`);
        return results;
      }

      for (const server of data.data) {
        const attrs = server.attributes;
        const address = attrs.address || `${attrs.ip}:${attrs.port}`;
        
        const modNames = attrs.details?.modNames || [];
        const workshopIds = this.extractWorkshopIds(modNames);
        
        results.push({
          address,
          name: attrs.name,
          map: attrs.details?.map,
          playerCount: attrs.players,
          maxPlayers: attrs.maxPlayers,
          ping: undefined,
          passwordProtected: attrs.private,
          perspective: detectPerspectiveFromServerName(attrs.name),
          region: this.determineRegionFromCountry(attrs.country),
          version: attrs.details?.version,
          mods: modNames.map((modName: string, index: number) => ({
            id: workshopIds[index] || modName,
            name: modName,
            workshopId: workshopIds[index],
            size: 0,
            required: true,
            installed: false,
          })),
          verified: attrs.queryStatus === 'valid',
          battlemetricsId: server.id,
          tags: attrs.details?.tags || [],
        });

        if (results.length >= maxResults) {
          break;
        }
      }

      console.log(`[BattleMetrics] Found ${results.length} servers matching: "${query}"`);
      return results;
    } catch (error) {
      console.error('[BattleMetrics] Search failed:', error);
      return results;
    }
  }

  private mapToCacheEntry(
    server: BattleMetricsServer, 
    serverAddress: string, 
    included?: BattleMetricsIncluded[]
  ): InsertBattleMetricsCache {
    const attrs = server.attributes;
    
    const cityName = attrs.location && attrs.location.length > 0 
      ? attrs.location.slice(0, 2).join(', ') 
      : undefined;

    let organizationId: string | null = null;
    let organizationName: string | null = null;

    if (server.relationships?.organization?.data && included) {
      const orgId = server.relationships.organization.data.id;
      const orgData = included.find(inc => inc.type === 'organization' && inc.id === orgId);
      if (orgData) {
        organizationId = orgId;
        organizationName = orgData.attributes?.name || null;
      }
    }

    const workshopIds = this.extractWorkshopIds(attrs.details?.modNames || []);

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
      organizationId,
      organizationName,
      serverTags: attrs.details?.tags || [],
      workshopIds,
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
      lastDetailRefresh: null,
    };
  }

  private extractWorkshopIds(modNames: string[]): string[] {
    const workshopIds: string[] = [];
    
    for (const modName of modNames) {
      const match = modName.match(/@(\d+)/);
      if (match && match[1]) {
        workshopIds.push(match[1]);
      }
    }
    
    return workshopIds;
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

  async discoverDayZServers(maxServers = 5000): Promise<Array<{address: string; name: string; playerCount: number; maxPlayers: number; map?: string}>> {
    console.log(`[BattleMetrics] Discovering up to ${maxServers} DayZ servers with pagination...`);
    
    const servers: Array<{address: string; name: string; playerCount: number; maxPlayers: number; map?: string}> = [];
    const seenAddresses = new Set<string>();
    let pageSize = 100; // Always use max page size
    let nextUrl: string | undefined = undefined;
    let pagesProcessed = 0;
    const maxPages = 50; // Allow more pages to get comprehensive server list
    
    try {
      // Initial request - sort by players descending
      const data: BattleMetricsServerListResponse = await this.fetchFromBattleMetrics('/servers', {
        'filter[game]': 'dayz',
        'page[size]': String(pageSize),
        'sort': '-players',
      });

      if (!data || !data.data || data.data.length === 0) {
        console.log('[BattleMetrics] No servers found');
        return servers;
      }

      // Process first page
      this.processServerPage(data.data, servers, seenAddresses, maxServers);
      nextUrl = data.links?.next;
      pagesProcessed++;

      // Follow pagination if we need more servers
      while (nextUrl && servers.length < maxServers && pagesProcessed < maxPages) {
        console.log(`[BattleMetrics] Fetching page ${pagesProcessed + 1} (have ${servers.length}/${maxServers} servers)...`);
        
        const nextData = await this.fetchFromUrl(nextUrl);
        if (!nextData || !nextData.data || nextData.data.length === 0) {
          break;
        }

        this.processServerPage(nextData.data, servers, seenAddresses, maxServers);
        nextUrl = nextData.links?.next;
        pagesProcessed++;

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[BattleMetrics] Discovered ${servers.length} quality DayZ servers (${pagesProcessed} pages)`);
      return servers;
    } catch (error) {
      console.error('[BattleMetrics] Failed to discover servers:', error);
      return servers;
    }
  }

  private processServerPage(
    data: BattleMetricsServer[],
    servers: Array<{address: string; name: string; playerCount: number; maxPlayers: number; map?: string}>,
    seenAddresses: Set<string>,
    maxServers: number
  ): void {
    for (const server of data) {
      if (servers.length >= maxServers) {
        break;
      }

      const serverName = server.attributes.name || '';
      
      // Skip servers that have been moved (stale listings)
      if (serverName.toUpperCase().includes('MOVED') || 
          serverName.toUpperCase().includes('MIGRATED') ||
          serverName.toUpperCase().includes('RELOCATED')) {
        continue;
      }
      
      const address = server.attributes.address || `${server.attributes.ip}:${server.attributes.port}`;
      
      // Deduplicate by address
      if (seenAddresses.has(address)) {
        continue;
      }
      
      seenAddresses.add(address);
      servers.push({
        address,
        name: serverName,
        playerCount: server.attributes.players,
        maxPlayers: server.attributes.maxPlayers,
        map: server.attributes.details?.map,
      });
    }
  }

  private async fetchFromUrl(url: string): Promise<BattleMetricsServerListResponse | null> {
    if (!BATTLEMETRICS_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BATTLEMETRICS_API_KEY}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
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
    workshopIds?: string[];
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
    const modNames = attrs.details?.modNames || [];
    const workshopIds = this.extractWorkshopIds(modNames);

    return {
      address,
      name: attrs.name,
      map: attrs.details?.map,
      playerCount: attrs.players,
      maxPlayers: attrs.maxPlayers,
      ping: undefined,
      passwordProtected: attrs.private,
      perspective: detectPerspectiveFromServerName(attrs.name),
      region: this.determineRegionFromCountry(attrs.country),
      version: attrs.details?.version,
      mods: modNames.map((modName: string, index: number) => ({
        id: workshopIds[index] || modName,
        name: modName,
        workshopId: workshopIds[index],
        size: 0,
        required: true,
        installed: false,
      })),
      workshopIds,
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
