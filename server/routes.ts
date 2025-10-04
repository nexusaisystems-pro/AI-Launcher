import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertServerSchema, insertUserPreferencesSchema, type ServerFilters } from "@shared/schema";
import { z } from "zod";
import { a2sService } from "./a2s-service";
import { cacheService } from "./cache-service";
import { steamWorkshopService } from "./steam-workshop-service";
import { battleMetricsService } from "./battlemetrics-service";
import { serverIntelligence } from "./server-intelligence";

const serverFiltersSchema = z.object({
  map: z.string().optional(),
  minPlayers: z.number().optional(),
  maxPing: z.number().optional(),
  perspective: z.string().optional(),
  region: z.array(z.string()).optional(),
  showFull: z.boolean().optional(),
  showPasswordProtected: z.boolean().optional(),
  showWhitelisted: z.boolean().optional(),
  modCount: z.enum(["vanilla", "1-10", "10+"]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all servers with optional filtering
  app.get("/api/servers", async (req, res) => {
    try {
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
      const validatedFilters = filters ? serverFiltersSchema.parse(filters) : undefined;
      const includeIntelligence = req.query.intelligence === 'true';
      
      const servers = await storage.getServers(validatedFilters);
      
      if (includeIntelligence) {
        // Enrich servers with BattleMetrics intelligence
        const enrichedServers = await Promise.all(
          servers.map(async (server) => {
            const bmData = await storage.getBattleMetricsCache(server.id);
            const quality = serverIntelligence.calculateQualityScore(server, bmData);
            
            return {
              ...server,
              intelligence: {
                qualityScore: quality.score,
                grade: quality.grade,
                verified: quality.verified,
                trustIndicators: quality.trustIndicators,
                fraudFlags: quality.fraudFlags,
                battlemetricsRank: bmData?.rank || null,
                battlemetricsStatus: bmData?.status || null,
              }
            };
          })
        );
        return res.json(enrichedServers);
      }
      
      res.json(servers);
    } catch (error) {
      res.status(400).json({ error: "Invalid filters provided" });
    }
  });

  // Get specific server by address
  app.get("/api/servers/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const server = await storage.getServer(address);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch server" });
    }
  });

  // Create new server (for server owners)
  app.post("/api/servers", async (req, res) => {
    try {
      const validatedServer = insertServerSchema.parse(req.body);
      const server = await storage.createServer(validatedServer);
      res.status(201).json(server);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid server data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create server" });
    }
  });

  // Update server information
  app.patch("/api/servers/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const updates = req.body;
      const server = await storage.updateServer(address, updates);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ error: "Failed to update server" });
    }
  });

  // Get server statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getServerStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Get user preferences
  app.get("/api/preferences/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const preferences = await storage.getUserPreferences(sessionId);
      if (!preferences) {
        return res.status(404).json({ error: "Preferences not found" });
      }
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Create or update user preferences
  app.post("/api/preferences", async (req, res) => {
    try {
      const validatedPreferences = insertUserPreferencesSchema.parse(req.body);
      const preferences = await storage.createOrUpdateUserPreferences(validatedPreferences);
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid preferences data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // Discover DayZ servers from Steam master servers
  app.post("/api/servers/discover", async (req, res) => {
    try {
      const maxServers = req.body.maxServers || 50;
      const addresses = await a2sService.discoverDayZServers(maxServers);
      
      res.json({ 
        message: `Discovered ${addresses.length} servers`,
        addresses,
        count: addresses.length 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to discover servers" });
    }
  });

  // Query server using A2S protocol and save/update in database
  app.post("/api/servers/query/:address", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const serverInfo = await a2sService.queryServer(address);
      
      if (!serverInfo) {
        return res.status(404).json({ error: "Server not found or not responding" });
      }

      const existing = await storage.getServer(address);
      let savedServer;

      if (existing) {
        savedServer = await storage.updateServer(address, {
          name: serverInfo.name,
          map: serverInfo.map,
          playerCount: serverInfo.playerCount,
          maxPlayers: serverInfo.maxPlayers,
          ping: serverInfo.ping,
          passwordProtected: serverInfo.passwordProtected,
          perspective: serverInfo.perspective,
          region: serverInfo.region,
          version: serverInfo.version,
          mods: serverInfo.mods,
          verified: serverInfo.verified,
        });
      } else {
        savedServer = await storage.createServer({
          address: serverInfo.address,
          name: serverInfo.name,
          map: serverInfo.map,
          playerCount: serverInfo.playerCount,
          maxPlayers: serverInfo.maxPlayers,
          ping: serverInfo.ping,
          passwordProtected: serverInfo.passwordProtected,
          perspective: serverInfo.perspective,
          region: serverInfo.region,
          version: serverInfo.version,
          mods: serverInfo.mods,
          verified: serverInfo.verified,
        });
      }

      await storage.addServerAnalytics({
        serverAddress: address,
        playerCount: serverInfo.playerCount,
        responseTime: serverInfo.ping,
        isOnline: true,
      });

      res.json(savedServer);
    } catch (error) {
      res.status(500).json({ error: "Failed to query server" });
    }
  });

  // Refresh all existing servers in database
  app.post("/api/servers/refresh", async (req, res) => {
    try {
      const servers = await storage.getServers();
      const addresses = servers.map(s => s.address);
      
      const concurrency = req.body.concurrency || 5;
      const updatedServers = await a2sService.queryMultipleServers(addresses, concurrency);
      
      for (const serverInfo of updatedServers) {
        await storage.updateServer(serverInfo.address, {
          name: serverInfo.name,
          map: serverInfo.map,
          playerCount: serverInfo.playerCount,
          maxPlayers: serverInfo.maxPlayers,
          ping: serverInfo.ping,
          passwordProtected: serverInfo.passwordProtected,
          perspective: serverInfo.perspective,
          region: serverInfo.region,
          version: serverInfo.version,
          mods: serverInfo.mods,
          verified: serverInfo.verified,
        });

        await storage.addServerAnalytics({
          serverAddress: serverInfo.address,
          playerCount: serverInfo.playerCount,
          responseTime: serverInfo.ping,
          isOnline: true,
        });
      }
      
      res.json({ 
        message: "Servers refreshed",
        updated: updatedServers.length,
        total: servers.length 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh servers" });
    }
  });

  // Get workshop mod details by IDs
  app.post("/api/workshop/mods", async (req, res) => {
    try {
      const workshopIdsSchema = z.object({
        workshopIds: z.array(z.string()),
        forceRefresh: z.boolean().optional().default(false),
      });
      
      const { workshopIds, forceRefresh } = workshopIdsSchema.parse(req.body);
      
      if (workshopIds.length === 0) {
        return res.json([]);
      }

      const cacheAge = 7 * 24 * 60 * 60 * 1000;
      const cachedMods = await storage.getWorkshopMods(workshopIds);
      
      const freshIds: string[] = [];
      const staleIds: string[] = [];
      
      workshopIds.forEach(id => {
        const cached = cachedMods.find(m => m.workshopId === id);
        if (!cached || forceRefresh) {
          freshIds.push(id);
        } else if (cached.cachedAt) {
          const age = Date.now() - new Date(cached.cachedAt).getTime();
          if (age > cacheAge) {
            staleIds.push(id);
          }
        }
      });
      
      const idsToFetch = [...freshIds, ...staleIds];
      
      if (idsToFetch.length > 0) {
        console.log(`[Workshop API] Fetching ${idsToFetch.length} mod(s) from Steam API (${freshIds.length} fresh, ${staleIds.length} stale):`, idsToFetch);
        const freshData = await steamWorkshopService.getWorkshopItemDetails(idsToFetch);
        
        const fetchedIds = new Set(freshData.map(mod => mod.workshopId));
        const unresolvedFreshIds = freshIds.filter(id => !fetchedIds.has(id));
        const unresolvedStaleIds = staleIds.filter(id => !fetchedIds.has(id));
        
        if (unresolvedFreshIds.length > 0) {
          console.error(`[Workshop API] Failed to fetch ${unresolvedFreshIds.length} fresh ID(s):`, unresolvedFreshIds);
          return res.status(502).json({ 
            error: "Steam Workshop API unavailable", 
            message: "Unable to fetch mod metadata from Steam. Please try again later.",
            unresolvedIds: unresolvedFreshIds
          });
        }
        
        if (freshData.length === 0 && idsToFetch.length > 0) {
          console.error(`[Workshop API] Steam API returned 0 items for ${idsToFetch.length} requested ID(s) - API likely unavailable`);
          return res.status(502).json({ 
            error: "Steam Workshop API unavailable", 
            message: "Unable to fetch mod metadata from Steam. Please try again later."
          });
        }
        
        if (freshData.length > 0) {
          await storage.cacheWorkshopMods(freshData);
          console.log(`[Workshop API] Successfully fetched ${freshData.length} mod(s) from Steam API`);
        }
        
        if (unresolvedStaleIds.length > 0) {
          console.warn(`[Workshop API] Failed to refresh ${unresolvedStaleIds.length} stale ID(s), returning cached data:`, unresolvedStaleIds);
        }
      }
      
      const allMods = await storage.getWorkshopMods(workshopIds);
      res.json(allMods);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error('Workshop API error:', error);
      res.status(500).json({ error: "Failed to fetch workshop mods" });
    }
  });

  // Get single workshop mod details
  app.get("/api/workshop/mods/:workshopId", async (req, res) => {
    try {
      const { workshopId } = req.params;
      const forceRefresh = req.query.forceRefresh === 'true';
      
      let mod = await storage.getWorkshopMod(workshopId);
      
      if (!mod || forceRefresh) {
        const freshData = await steamWorkshopService.getWorkshopItemDetail(workshopId);
        if (freshData) {
          mod = await storage.cacheWorkshopMod(freshData);
        }
      }
      
      if (!mod) {
        return res.status(404).json({ error: "Workshop mod not found" });
      }
      
      res.json(mod);
    } catch (error) {
      console.error('Workshop API error:', error);
      res.status(500).json({ error: "Failed to fetch workshop mod" });
    }
  });

  // Enrich server with BattleMetrics data
  app.post("/api/battlemetrics/enrich", async (req, res) => {
    try {
      const serversSchema = z.object({
        servers: z.array(z.object({
          id: z.string(),
          address: z.string(),
        })),
        forceRefresh: z.boolean().optional().default(false),
      });

      const { servers: serversToEnrich, forceRefresh } = serversSchema.parse(req.body);

      if (serversToEnrich.length === 0) {
        return res.json([]);
      }

      console.log(`[BattleMetrics] Enriching ${serversToEnrich.length} server(s)`);

      const cacheAge = 24 * 60 * 60 * 1000; // 24 hours
      const results = [];

      for (const server of serversToEnrich) {
        let bmData = await storage.getBattleMetricsCache(server.id);

        if (!bmData || forceRefresh || (bmData.cachedAt && (Date.now() - new Date(bmData.cachedAt).getTime()) > cacheAge)) {
          console.log(`[BattleMetrics] Fetching fresh data for ${server.address}`);
          const freshData = await battleMetricsService.searchServerByAddress(server.address);
          
          if (freshData) {
            bmData = await storage.cacheBattleMetrics({ ...freshData, serverId: server.id });
            console.log(`[BattleMetrics] Cached data for ${server.address} (rank: ${bmData.rank})`);
          } else {
            console.warn(`[BattleMetrics] No data found for ${server.address}`);
          }
        }

        if (bmData) {
          results.push(bmData);
        }
      }

      console.log(`[BattleMetrics] Enriched ${results.length}/${serversToEnrich.length} servers`);
      res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error('BattleMetrics API error:', error);
      res.status(500).json({ error: "Failed to enrich servers with BattleMetrics data" });
    }
  });

  // Get BattleMetrics data for a single server
  app.get("/api/battlemetrics/:serverId", async (req, res) => {
    try {
      const { serverId } = req.params;
      const forceRefresh = req.query.forceRefresh === 'true';

      let bmData = await storage.getBattleMetricsCache(serverId);

      if (!bmData || forceRefresh) {
        const server = await storage.getServer(serverId);
        if (!server) {
          return res.status(404).json({ error: "Server not found" });
        }

        const freshData = await battleMetricsService.searchServerByAddress(server.address);
        if (freshData) {
          bmData = await storage.cacheBattleMetrics({ ...freshData, serverId });
        }
      }

      if (!bmData) {
        return res.status(404).json({ error: "BattleMetrics data not found" });
      }

      res.json(bmData);
    } catch (error) {
      console.error('BattleMetrics API error:', error);
      res.status(500).json({ error: "Failed to fetch BattleMetrics data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
