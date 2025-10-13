import { storage } from './storage';
import { battleMetricsService } from './battlemetrics-service';
import { steamWorkshopService } from './steam-workshop-service';
import { modClassifier } from './mod-classifier';
import { detectMapFromServerName } from './map-detector';
import { detectPerspectiveFromServerName } from './perspective-detector';
import type { Server } from '@shared/schema';

export class CacheService {
  private serverCache: Server[] = [];
  private isRefreshing = false;
  private lastRefreshTime: Date | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL_MS = 300000; // 5 minutes (300 seconds)
  private readonly CONCURRENCY_LIMIT = 3;

  async initialize() {
    console.log('[Cache] Initializing server cache...');
    await this.loadFromDatabase();
    await this.discoverAndQueryNewServers();
    this.startBackgroundRefresh();
    console.log(`[Cache] Initialized with ${this.serverCache.length} servers`);
  }

  async loadFromDatabase() {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.serverCache = await storage.getServers();
        this.lastRefreshTime = new Date();
        console.log(`[Cache] Loaded ${this.serverCache.length} servers from database`);
        return;
      } catch (error) {
        lastError = error;
        console.error(`[Cache] Failed to load from database (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          // True exponential backoff with jitter: 1s, 2s, 4s (with +/- 20% randomness)
          const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
          const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
          const delay = Math.round(exponentialDelay + jitter);
          console.log(`[Cache] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.error('[Cache] All retry attempts failed, using empty cache. Last error:', lastError);
    this.serverCache = [];
  }

  async discoverAndQueryNewServers(maxServers = 5000) {
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
          // New server - use BattleMetrics map or detect from name
          const finalMap = serverInfo.map || detectMapFromServerName(serverInfo.name);
          const finalPerspective = detectPerspectiveFromServerName(serverInfo.name);
          await storage.createServer({
            address: serverInfo.address,
            name: serverInfo.name,
            map: finalMap,
            playerCount: serverInfo.playerCount,
            maxPlayers: serverInfo.maxPlayers,
            ping: undefined,
            passwordProtected: false,
            perspective: finalPerspective,
            region: undefined,
            version: undefined,
            mods: [],
            verified: false,
          });
          newCount++;
        } else {
          // Existing server - use BattleMetrics map, fallback to name detection, keep existing
          const finalMap = serverInfo.map || detectMapFromServerName(serverInfo.name, existing.map || undefined);
          const finalPerspective = detectPerspectiveFromServerName(serverInfo.name, existing.perspective || undefined);
          await storage.updateServer(serverInfo.address, {
            name: serverInfo.name,
            map: finalMap,
            playerCount: serverInfo.playerCount,
            maxPlayers: serverInfo.maxPlayers,
            perspective: finalPerspective,
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
      // Only refresh top 200 most popular servers for efficiency
      const serversToRefresh = [...this.serverCache]
        .sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0))
        .slice(0, 200);
      
      console.log(`[Cache] Refreshing top ${serversToRefresh.length} servers (of ${this.serverCache.length} total) via BattleMetrics...`);
      const startTime = Date.now();
      
      let successCount = 0;
      const batchSize = 5;
      
      // Process servers in batches to avoid rate limiting
      for (let i = 0; i < serversToRefresh.length; i += batchSize) {
        const batch = serversToRefresh.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (server) => {
          try {
            const serverDetails = await battleMetricsService.getServerDetails(server.address);
            
            if (serverDetails) {
              // Enrich mods with Workshop data
              let enrichedMods: any[] = [];
              let detectedMap: string | undefined = serverDetails.map || detectMapFromServerName(serverDetails.name, server.map || undefined);
              
              if (serverDetails.workshopIds && serverDetails.workshopIds.length > 0) {
                try {
                  const workshopModData = await steamWorkshopService.getWorkshopItemDetails(serverDetails.workshopIds);
                  
                  // Convert InsertWorkshopMod to SteamWorkshopItem format for classifier
                  const workshopItems = workshopModData.map(mod => ({
                    publishedfileid: mod.workshopId,
                    result: 1,
                    creator: mod.creator || '',
                    creator_appid: 221100,
                    consumer_appid: 221100,
                    filename: '',
                    file_size: mod.fileSize || 0,
                    preview_url: mod.previewUrl || '',
                    hcontent_preview: '',
                    title: mod.title || '',
                    description: mod.description || '',
                    time_created: mod.timeCreated || 0,
                    time_updated: mod.timeUpdated || 0,
                    visibility: 0,
                    banned: 0,
                    ban_reason: '',
                    subscriptions: mod.subscriberCount || 0,
                    favorited: 0,
                    lifetime_subscriptions: mod.subscriberCount || 0,
                    lifetime_favorited: 0,
                    views: 0,
                    tags: mod.tags?.map(tag => ({ tag: String(tag) })) || [],
                  }));
                  
                  enrichedMods = modClassifier.classifyMods(workshopItems);
                  
                  // Try to detect map from enriched mods if not already found
                  if (!detectedMap) {
                    const mapFromMods = modClassifier.detectMapFromEnrichedMods(enrichedMods);
                    if (mapFromMods) {
                      detectedMap = mapFromMods;
                    }
                  }
                } catch (error) {
                  console.error(`[Cache] Failed to enrich mods for ${server.address}:`, error);
                }
              }
              
              // Use detected perspective from BattleMetrics, preserve existing valid values
              const finalPerspective = server.perspective && server.perspective !== 'Unknown' && server.perspective.trim() !== '' 
                ? server.perspective 
                : serverDetails.perspective;
              
              await storage.updateServer(server.address, {
                name: serverDetails.name,
                map: detectedMap,
                playerCount: serverDetails.playerCount,
                maxPlayers: serverDetails.maxPlayers,
                passwordProtected: serverDetails.passwordProtected,
                perspective: finalPerspective,
                region: serverDetails.region,
                version: serverDetails.version,
                mods: serverDetails.mods,
                modList: enrichedMods.length > 0 ? enrichedMods : undefined,
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
        if (i + batchSize < serversToRefresh.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      await this.loadFromDatabase();
      
      // Clean up stale "MOVED" servers
      await this.cleanupStaleServers();
      
      // If server count dropped significantly after cleanup, rediscover servers
      const MIN_SERVERS = 1000;
      if (this.serverCache.length < MIN_SERVERS) {
        console.log(`[Cache] Server count (${this.serverCache.length}) below minimum (${MIN_SERVERS}), rediscovering...`);
        await this.discoverAndQueryNewServers();
      }
      
      // Enrich servers with BattleMetrics data
      await this.enrichServersWithBattleMetrics();
      
      const duration = Date.now() - startTime;
      const successRate = ((successCount / serversToRefresh.length) * 100).toFixed(1);
      console.log(`[Cache] Refresh complete: ${successCount}/${serversToRefresh.length} servers (${successRate}%) in ${(duration / 1000).toFixed(1)}s`);
      
      this.lastRefreshTime = new Date();
    } catch (error) {
      console.error('[Cache] Refresh failed:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  async cleanupStaleServers() {
    try {
      const staleKeywords = ['MOVED', 'MIGRATED', 'RELOCATED'];
      let removedCount = 0;

      for (const server of this.serverCache) {
        const serverName = server.name?.toUpperCase() || '';
        
        // Check if server name contains stale keywords
        const isStale = staleKeywords.some(keyword => serverName.includes(keyword));
        
        if (isStale) {
          await storage.deleteServer(server.address);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        console.log(`[Cache] Cleaned up ${removedCount} stale servers`);
        await this.loadFromDatabase(); // Reload cache after cleanup
      }
    } catch (error) {
      console.error('[Cache] Failed to cleanup stale servers:', error);
    }
  }

  async enrichServersWithBattleMetrics(servers?: Server[]) {
    try {
      const serversToEnrich = servers || [...this.serverCache]
        .sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0))
        .slice(0, 50);

      if (serversToEnrich.length === 0) {
        return;
      }

      console.log(`[BattleMetrics] Enriching ${serversToEnrich.length} servers...`);

      let enrichedCount = 0;
      for (const server of serversToEnrich) {
        const existingCache = await storage.getBattleMetricsCache(server.id);
        const cacheAge = existingCache?.cachedAt 
          ? Date.now() - new Date(existingCache.cachedAt).getTime()
          : Infinity;
        
        const detailCacheAge = existingCache?.lastDetailRefresh
          ? Date.now() - new Date(existingCache.lastDetailRefresh).getTime()
          : Infinity;
        
        const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
        const DETAIL_CACHE_MAX_AGE = 15 * 60 * 1000;

        if (cacheAge < CACHE_MAX_AGE && detailCacheAge < DETAIL_CACHE_MAX_AGE) {
          continue;
        }

        const bmData = await battleMetricsService.searchServerByAddress(server.address);
        if (bmData) {
          await storage.cacheBattleMetrics({ 
            ...bmData, 
            serverId: server.id,
            lastDetailRefresh: new Date()
          });
          
          if (bmData.workshopIds && Array.isArray(bmData.workshopIds) && bmData.workshopIds.length > 0) {
            const workshopIds = bmData.workshopIds as string[];
            const modNames = (bmData.details?.modNames || []) as string[];
            const modsWithWorkshopIds = workshopIds.map((workshopId, index) => ({
              id: workshopId,
              name: modNames[index] || `Mod ${workshopId}`,
              workshopId: workshopId,
              size: 0,
              required: true,
              installed: false,
            }));
            
            await storage.updateServer(server.address, {
              mods: modsWithWorkshopIds
            });
          }
          
          enrichedCount++;
          
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
