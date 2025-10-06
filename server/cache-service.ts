import { storage } from './storage';
import { a2sService } from './a2s-service';
import { battleMetricsService } from './battlemetrics-service';
import type { Server } from '@shared/schema';

export class CacheService {
  private serverCache: Server[] = [];
  private isRefreshing = false;
  private lastRefreshTime: Date | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL_MS = 60000; // 60 seconds
  private readonly CONCURRENCY_LIMIT = 3;

  async initialize() {
    console.log('[Cache] Initializing server cache...');
    await this.loadFromDatabase();
    await this.discoverAndQueryNewServers();
    this.startBackgroundRefresh();
    console.log(`[Cache] Initialized with ${this.serverCache.length} servers`);
  }

  async loadFromDatabase() {
    try {
      this.serverCache = await storage.getServers();
      this.lastRefreshTime = new Date();
      console.log(`[Cache] Loaded ${this.serverCache.length} servers from database`);
    } catch (error) {
      console.error('[Cache] Failed to load from database:', error);
      this.serverCache = [];
    }
  }

  async discoverAndQueryNewServers(maxServers = 20) {
    try {
      console.log(`[Cache] Discovering up to ${maxServers} new DayZ servers via BattleMetrics...`);
      const servers = await battleMetricsService.discoverDayZServers(maxServers);
      
      if (servers.length === 0) {
        console.log('[Cache] No new servers discovered');
        return;
      }

      console.log(`[Cache] Discovered ${servers.length} servers from BattleMetrics`);
      
      let newCount = 0;
      let updatedCount = 0;
      
      for (const serverInfo of servers) {
        const existing = await storage.getServer(serverInfo.address);
        
        if (!existing) {
          // New server - create it
          await storage.createServer({
            address: serverInfo.address,
            name: serverInfo.name,
            map: serverInfo.map || 'Unknown',
            playerCount: serverInfo.playerCount,
            maxPlayers: serverInfo.maxPlayers,
            ping: undefined,
            passwordProtected: false,
            perspective: undefined,
            region: undefined,
            version: undefined,
            mods: [],
            verified: false,
          });
          newCount++;
        } else {
          // Existing server - update it
          await storage.updateServer(serverInfo.address, {
            name: serverInfo.name,
            map: serverInfo.map || existing.map,
            playerCount: serverInfo.playerCount,
            maxPlayers: serverInfo.maxPlayers,
          });
          updatedCount++;
        }
      }
      
      await this.loadFromDatabase();
      console.log(`[Cache] Added ${newCount} new servers, updated ${updatedCount} existing servers`);
    } catch (error) {
      console.error('[Cache] Failed to discover new servers:', error);
    }
  }

  async refreshCache() {
    if (this.isRefreshing) {
      console.log('[Cache] Refresh already in progress, skipping');
      return;
    }

    this.isRefreshing = true;
    try {
      console.log(`[Cache] Refreshing ${this.serverCache.length} servers via BattleMetrics...`);
      const startTime = Date.now();
      
      let successCount = 0;
      const batchSize = 5;
      
      // Process servers in batches to avoid rate limiting
      for (let i = 0; i < this.serverCache.length; i += batchSize) {
        const batch = this.serverCache.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (server) => {
          try {
            const serverDetails = await battleMetricsService.getServerDetails(server.address);
            
            if (serverDetails) {
              await storage.updateServer(server.address, {
                name: serverDetails.name,
                map: serverDetails.map || server.map,
                playerCount: serverDetails.playerCount,
                maxPlayers: serverDetails.maxPlayers,
                passwordProtected: serverDetails.passwordProtected,
                region: serverDetails.region,
                version: serverDetails.version,
                mods: serverDetails.mods,
                verified: serverDetails.verified,
              });

              await storage.addServerAnalytics({
                serverAddress: server.address,
                playerCount: serverDetails.playerCount,
                responseTime: 0,
                isOnline: true,
              });
              
              successCount++;
            }
          } catch (error) {
            console.error(`[Cache] Failed to refresh ${server.address}:`, error);
          }
        }));
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < this.serverCache.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      await this.loadFromDatabase();
      
      // Enrich top servers with BattleMetrics data
      await this.enrichTopServersWithBattleMetrics();
      
      const duration = Date.now() - startTime;
      const successRate = ((successCount / this.serverCache.length) * 100).toFixed(1);
      console.log(`[Cache] Refresh complete: ${successCount}/${this.serverCache.length} servers (${successRate}%) in ${(duration / 1000).toFixed(1)}s`);
      
      this.lastRefreshTime = new Date();
    } catch (error) {
      console.error('[Cache] Refresh failed:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  async enrichTopServersWithBattleMetrics(topN = 10) {
    try {
      // Sort servers by player count (descending) and take top N
      const topServers = [...this.serverCache]
        .sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0))
        .slice(0, topN);

      if (topServers.length === 0) {
        return;
      }

      console.log(`[BattleMetrics] Enriching top ${topServers.length} servers...`);

      let enrichedCount = 0;
      for (const server of topServers) {
        // Check if we already have recent BM data (24-hour cache)
        const existingCache = await storage.getBattleMetricsCache(server.id);
        const cacheAge = existingCache?.cachedAt 
          ? Date.now() - new Date(existingCache.cachedAt).getTime()
          : Infinity;
        
        const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < CACHE_MAX_AGE) {
          continue; // Skip if cache is fresh
        }

        // Fetch fresh BattleMetrics data
        const bmData = await battleMetricsService.searchServerByAddress(server.address);
        if (bmData) {
          await storage.cacheBattleMetrics({ ...bmData, serverId: server.id });
          enrichedCount++;
          
          // Small delay to avoid rate limiting (Free tier: 300 req / 5min)
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (enrichedCount > 0) {
        console.log(`[BattleMetrics] Enriched ${enrichedCount} servers with fresh data`);
      }
    } catch (error) {
      console.error('[BattleMetrics] Enrichment failed:', error);
    }
  }

  startBackgroundRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      this.refreshCache();
    }, this.REFRESH_INTERVAL_MS);

    console.log(`[Cache] Background refresh started (every ${this.REFRESH_INTERVAL_MS / 1000}s)`);
  }

  stopBackgroundRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('[Cache] Background refresh stopped');
    }
  }

  getCachedServers(): Server[] {
    return this.serverCache;
  }

  getRefreshStatus() {
    return {
      isRefreshing: this.isRefreshing,
      lastRefreshTime: this.lastRefreshTime,
      serverCount: this.serverCache.length,
    };
  }
}

export const cacheService = new CacheService();
