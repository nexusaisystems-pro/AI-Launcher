import { storage } from "./storage";
import { battleMetricsService } from "./battlemetrics-service";
import type { Server } from "@shared/schema";

export interface EnrichmentProgress {
  totalServers: number;
  processedServers: number;
  successfulEnrichments: number;
  failedEnrichments: number;
  skippedServers: number;
  isRunning: boolean;
  startTime: Date | null;
  estimatedCompletionTime: Date | null;
  currentBatch: number;
  totalBatches: number;
  errors: string[];
}

export class BulkEnrichmentService {
  private progress: EnrichmentProgress = {
    totalServers: 0,
    processedServers: 0,
    successfulEnrichments: 0,
    failedEnrichments: 0,
    skippedServers: 0,
    isRunning: false,
    startTime: null,
    estimatedCompletionTime: null,
    currentBatch: 0,
    totalBatches: 0,
    errors: [],
  };

  private readonly BATCH_SIZE = 10; // Process 10 servers at a time
  private readonly DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
  private readonly DELAY_BETWEEN_REQUESTS = 1500; // 1.5 seconds between individual requests
  private readonly CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  getProgress(): EnrichmentProgress {
    return { ...this.progress };
  }

  async enrichAllServers(prioritizeUncached = true): Promise<void> {
    if (this.progress.isRunning) {
      throw new Error("Enrichment is already in progress");
    }

    console.log("[BulkEnrichment] Starting bulk enrichment process...");
    this.progress.isRunning = true;
    this.progress.startTime = new Date();
    this.progress.processedServers = 0;
    this.progress.successfulEnrichments = 0;
    this.progress.failedEnrichments = 0;
    this.progress.skippedServers = 0;
    this.progress.errors = [];

    try {
      // Get all servers from database
      const allServers = await storage.getServers();
      console.log(`[BulkEnrichment] Found ${allServers.length} total servers`);

      // Fetch all cache records at once (much faster!)
      const allCacheRecords = await storage.getAllBattleMetricsCache();
      const cacheMap = new Map(allCacheRecords.map(cache => [cache.serverId, cache]));
      console.log(`[BulkEnrichment] Loaded ${allCacheRecords.length} cache records`);

      // Categorize servers by cache status
      const serversToEnrich: Server[] = [];
      
      for (const server of allServers) {
        const existingCache = cacheMap.get(server.id);
        const cacheAge = existingCache?.cachedAt 
          ? Date.now() - new Date(existingCache.cachedAt).getTime()
          : Infinity;

        if (!existingCache || cacheAge > this.CACHE_MAX_AGE) {
          serversToEnrich.push(server);
        }
      }

      console.log(`[BulkEnrichment] ${serversToEnrich.length} servers need enrichment`);
      console.log(`[BulkEnrichment] ${allServers.length - serversToEnrich.length} servers have fresh cache`);

      this.progress.totalServers = serversToEnrich.length;
      this.progress.totalBatches = Math.ceil(serversToEnrich.length / this.BATCH_SIZE);

      // Calculate estimated completion time
      const estimatedSeconds = 
        (this.progress.totalBatches * this.DELAY_BETWEEN_BATCHES / 1000) +
        (serversToEnrich.length * this.DELAY_BETWEEN_REQUESTS / 1000);
      this.progress.estimatedCompletionTime = new Date(
        Date.now() + estimatedSeconds * 1000
      );

      console.log(`[BulkEnrichment] Estimated completion: ${this.progress.estimatedCompletionTime.toLocaleTimeString()}`);
      console.log(`[BulkEnrichment] Processing ${this.progress.totalBatches} batches of ${this.BATCH_SIZE} servers`);

      // Process servers in batches
      for (let i = 0; i < serversToEnrich.length; i += this.BATCH_SIZE) {
        const batch = serversToEnrich.slice(i, i + this.BATCH_SIZE);
        this.progress.currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;

        console.log(
          `[BulkEnrichment] Processing batch ${this.progress.currentBatch}/${this.progress.totalBatches} ` +
          `(${this.progress.processedServers}/${this.progress.totalServers} servers completed)`
        );

        // Process each server in the batch sequentially to avoid rate limits
        for (const server of batch) {
          await this.enrichServer(server);
          
          // Delay between individual requests within a batch
          if (batch.indexOf(server) < batch.length - 1) {
            await this.delay(this.DELAY_BETWEEN_REQUESTS);
          }
        }

        // Delay between batches
        if (i + this.BATCH_SIZE < serversToEnrich.length) {
          await this.delay(this.DELAY_BETWEEN_BATCHES);
        }
      }

      console.log("[BulkEnrichment] ✓ Bulk enrichment completed successfully!");
      console.log(`[BulkEnrichment] Results:`);
      console.log(`  - Total processed: ${this.progress.processedServers}`);
      console.log(`  - Successful: ${this.progress.successfulEnrichments}`);
      console.log(`  - Failed: ${this.progress.failedEnrichments}`);
      console.log(`  - Skipped: ${this.progress.skippedServers}`);

    } catch (error) {
      console.error("[BulkEnrichment] Fatal error during enrichment:", error);
      this.progress.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      this.progress.isRunning = false;
    }
  }

  private async enrichServer(server: Server): Promise<void> {
    try {
      console.log(`[BulkEnrichment] Enriching ${server.address} (${server.name})...`);

      const bmData = await battleMetricsService.searchServerByAddress(server.address);
      
      if (bmData) {
        await storage.cacheBattleMetrics({ 
          ...bmData, 
          serverId: server.id,
          lastDetailRefresh: new Date()
        });
        
        this.progress.successfulEnrichments++;
        console.log(`[BulkEnrichment] ✓ Successfully enriched ${server.address}`);
      } else {
        this.progress.failedEnrichments++;
        const errorMsg = `No BattleMetrics data found for ${server.address}`;
        console.log(`[BulkEnrichment] ✗ ${errorMsg}`);
        this.progress.errors.push(errorMsg);
      }
    } catch (error) {
      this.progress.failedEnrichments++;
      const errorMsg = `Failed to enrich ${server.address}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[BulkEnrichment] ✗ ${errorMsg}`);
      this.progress.errors.push(errorMsg);
    } finally {
      this.progress.processedServers++;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  resetProgress(): void {
    this.progress = {
      totalServers: 0,
      processedServers: 0,
      successfulEnrichments: 0,
      failedEnrichments: 0,
      skippedServers: 0,
      isRunning: false,
      startTime: null,
      estimatedCompletionTime: null,
      currentBatch: 0,
      totalBatches: 0,
      errors: [],
    };
  }
}

export const bulkEnrichmentService = new BulkEnrichmentService();
