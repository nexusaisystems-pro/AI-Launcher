import { queryGameServerInfo, queryGameServerPlayer, queryMasterServer, REGIONS } from 'steam-server-query';
import type { ServerMod } from '@shared/schema';
import pLimit from 'p-limit';

export interface A2SServerInfo {
  address: string;
  name: string;
  map: string;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  passwordProtected: boolean;
  perspective?: string;
  region?: string;
  version: string;
  mods: ServerMod[];
  verified: boolean;
}

const DAYZ_APP_ID = 221100;
const QUERY_TIMEOUT = 8000;
const RETRY_ATTEMPTS = 3;

export class A2SService {
  async queryServer(address: string): Promise<A2SServerInfo | null> {
    try {
      const startTime = Date.now();
      const info = await queryGameServerInfo(address, RETRY_ATTEMPTS, QUERY_TIMEOUT);
      const ping = Date.now() - startTime;

      const mods = this.parseModsFromKeywords(info.keywords || '');
      
      const perspective = this.determinePerspective(info.keywords || '', info.name);
      const region = this.determineRegion(address);

      return {
        address,
        name: info.name,
        map: info.map,
        playerCount: info.players,
        maxPlayers: info.maxPlayers,
        ping,
        passwordProtected: info.visibility === 1,
        perspective,
        region,
        version: info.version,
        mods,
        verified: info.vac === 1,
      };
    } catch (error) {
      console.error(`Failed to query server ${address}:`, error);
      return null;
    }
  }

  async queryMultipleServers(addresses: string[], concurrency = 5): Promise<A2SServerInfo[]> {
    const limit = pLimit(concurrency);
    
    const results = await Promise.allSettled(
      addresses.map(address => 
        limit(() => this.queryServer(address))
      )
    );

    return results
      .filter((result): result is PromiseFulfilledResult<A2SServerInfo | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value as A2SServerInfo);
  }

  async discoverDayZServers(maxServers = 100): Promise<string[]> {
    try {
      const masterServerAddress = 'hl2master.steampowered.com:27011';
      
      const servers = await queryMasterServer(
        masterServerAddress,
        REGIONS.ALL,
        {
          appid: DAYZ_APP_ID,
          empty: 1,
        },
        QUERY_TIMEOUT,
        maxServers
      );

      return servers;
    } catch (error) {
      console.error('Failed to discover DayZ servers:', error);
      return [];
    }
  }

  async getPlayerDetails(address: string) {
    try {
      const playerResponse = await queryGameServerPlayer(address, RETRY_ATTEMPTS, QUERY_TIMEOUT);
      return playerResponse.players;
    } catch (error) {
      console.error(`Failed to get player details for ${address}:`, error);
      return [];
    }
  }

  private parseModsFromKeywords(keywords: string): ServerMod[] {
    const mods: ServerMod[] = [];
    
    if (!keywords) return mods;

    const modPattern = /@[\w-]+/g;
    const modMatches = keywords.match(modPattern);

    if (modMatches) {
      modMatches.forEach((modId, index) => {
        mods.push({
          id: modId.substring(1),
          name: modId.substring(1).replace(/-/g, ' '),
          size: 0,
          required: true,
          installed: false,
        });
      });
    }

    return mods;
  }

  private determinePerspective(keywords: string, serverName: string): string | undefined {
    const combined = (keywords + ' ' + serverName).toLowerCase();
    
    if (combined.includes('1pp') || combined.includes('first person')) {
      return '1PP';
    }
    if (combined.includes('3pp') || combined.includes('third person')) {
      return '3PP';
    }
    
    return 'Both';
  }

  private determineRegion(address: string): string | undefined {
    const [ipAddress] = address.split(':');
    const ipParts = ipAddress.split('.');
    if (ipParts.length !== 4) return undefined;

    const firstOctet = parseInt(ipParts[0]);
    if (isNaN(firstOctet)) return undefined;
    
    if (firstOctet >= 2 && firstOctet <= 62) return 'EU';
    if (firstOctet >= 63 && firstOctet <= 127) return 'NA-EAST';
    if (firstOctet >= 128 && firstOctet <= 191) return 'NA-WEST';
    if (firstOctet >= 192 && firstOctet <= 223) return 'ASIA';
    if (firstOctet >= 224 && firstOctet <= 255) return 'Other';
    
    return 'Other';
  }
}

export const a2sService = new A2SService();
