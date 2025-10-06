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
import { OpenAIService, type RecommendationResponse } from "./openai-service";
import { nanoid } from "nanoid";
import { setupAuth, isAuthenticated, isOwner, isAdmin } from "./replitAuth";

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

// Simple in-memory cache for recommendations (5 minute TTL)
const recommendationsCache = new Map<string, { data: RecommendationResponse; expiresAt: number }>();
const RECOMMENDATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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
                battlemetricsId: bmData?.battlemetricsId || null,
                battlemetricsName: bmData?.serverName || null,
                cacheAge: bmData?.cachedAt 
                  ? Math.floor((Date.now() - new Date(bmData.cachedAt).getTime()) / (1000 * 60 * 60)) // hours
                  : null,
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
      const includeIntelligence = req.query.intelligence === 'true';
      const server = await storage.getServer(address);
      
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      if (includeIntelligence) {
        const existingCache = await storage.getBattleMetricsCache(server.id);
        const cacheAge = existingCache?.cachedAt 
          ? Date.now() - new Date(existingCache.cachedAt).getTime()
          : Infinity;
        
        if (cacheAge > 24 * 60 * 60 * 1000 || !existingCache) {
          const bmData = await battleMetricsService.searchServerByAddress(address);
          if (bmData) {
            await storage.cacheBattleMetrics({ 
              ...bmData, 
              serverId: server.id,
              lastDetailRefresh: new Date()
            });
          }
        }
        
        const bmData = await storage.getBattleMetricsCache(server.id);
        const quality = serverIntelligence.calculateQualityScore(server, bmData);
        
        return res.json({
          ...server,
          intelligence: {
            qualityScore: quality.score,
            grade: quality.grade,
            verified: quality.verified,
            trustIndicators: quality.trustIndicators,
            fraudFlags: quality.fraudFlags,
            battlemetricsRank: bmData?.rank || null,
            battlemetricsStatus: bmData?.status || null,
            battlemetricsId: bmData?.battlemetricsId || null,
            battlemetricsName: bmData?.serverName || null,
            cacheAge: bmData?.cachedAt 
              ? Math.floor((Date.now() - new Date(bmData.cachedAt).getTime()) / (1000 * 60 * 60))
              : null,
          }
        });
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

  // Real-time search ALL DayZ servers on BattleMetrics (not just cached)
  app.get("/api/servers/search/realtime", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ 
          error: "Search query must be at least 2 characters" 
        });
      }

      console.log(`[API] Real-time search for: "${query}"`);
      
      const searchResults = await battleMetricsService.searchServersByName(query.trim(), 50);
      
      const enrichedServers = await Promise.all(
        searchResults.map(async (serverData) => {
          let dbServer = await storage.getServer(serverData.address);
          
          if (!dbServer) {
            dbServer = await storage.createServer({
              address: serverData.address,
              name: serverData.name,
              map: serverData.map || 'Unknown',
              playerCount: serverData.playerCount,
              maxPlayers: serverData.maxPlayers,
              passwordProtected: serverData.passwordProtected,
              region: serverData.region,
              version: serverData.version,
              mods: serverData.mods || [],
              verified: serverData.verified || false,
            });
          }
          
          if (serverData.battlemetricsId) {
            const existingCache = await storage.getBattleMetricsCache(dbServer.id);
            const needsEnrichment = !existingCache || 
              (existingCache.cachedAt && Date.now() - new Date(existingCache.cachedAt).getTime() > 24 * 60 * 60 * 1000);
            
            if (needsEnrichment) {
              const bmData = await battleMetricsService.getServerDetailsWithRelationships(serverData.battlemetricsId);
              if (bmData) {
                await storage.cacheBattleMetrics({ 
                  ...bmData, 
                  serverId: dbServer.id,
                  lastDetailRefresh: new Date()
                });
              }
            }
          }
          
          const bmCache = await storage.getBattleMetricsCache(dbServer.id);
          const quality = serverIntelligence.calculateQualityScore(dbServer, bmCache);
          
          return {
            ...serverData,
            intelligence: {
              qualityScore: quality.score,
              grade: quality.grade,
              verified: quality.verified,
              trustIndicators: quality.trustIndicators,
              fraudFlags: quality.fraudFlags,
              battlemetricsRank: bmCache?.rank || null,
              battlemetricsStatus: bmCache?.status || null,
              battlemetricsId: bmCache?.battlemetricsId || null,
              battlemetricsName: bmCache?.serverName || null,
              cacheAge: bmCache?.cachedAt 
                ? Math.floor((Date.now() - new Date(bmCache.cachedAt).getTime()) / (1000 * 60 * 60))
                : null,
            }
          };
        })
      );
      
      res.json({
        query: query.trim(),
        count: enrichedServers.length,
        servers: enrichedServers,
        source: 'battlemetrics',
        cached: false
      });
    } catch (error) {
      console.error('[API] Real-time search failed:', error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Claim server ownership
  app.post("/api/servers/:address/claim", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const claimSchema = z.object({
        ownerEmail: z.string().email(),
        sessionId: z.string(),
        method: z.enum(["server_name"]),
      });

      const { ownerEmail, sessionId, method } = claimSchema.parse(req.body);

      // Check if server exists
      const server = await storage.getServer(address);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // Check if already claimed
      const existingOwner = await storage.getServerOwner(address);
      if (existingOwner) {
        return res.status(400).json({ error: "Server already claimed" });
      }

      // Generate verification token (6-character alphanumeric)
      const token = nanoid(6).toUpperCase();
      
      // Create verification token (expires in 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await storage.createVerificationToken({
        serverAddress: address,
        token,
        sessionId,
        ownerEmail,
        method,
        expiresAt,
        verified: false,
      });

      res.json({
        success: true,
        token,
        method,
        expiresAt: expiresAt.toISOString(),
        instructions: {
          server_name: `Add the verification code [${token}] to your server name. For example: "YourServer [${token}]". We'll check within 5 minutes.`
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid claim data", details: error.errors });
      }
      console.error('Server claim error:', error);
      res.status(500).json({ error: "Failed to initiate server claim" });
    }
  });

  // Verify server ownership
  app.post("/api/servers/:address/verify", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const verifySchema = z.object({
        token: z.string(),
        sessionId: z.string(),
      });

      const { token, sessionId } = verifySchema.parse(req.body);

      // Get verification token
      const verificationToken = await storage.getVerificationToken(address, token);
      if (!verificationToken) {
        return res.status(404).json({ error: "Verification token not found" });
      }

      // Check if already verified
      if (verificationToken.verified) {
        return res.status(400).json({ error: "Verification token already used" });
      }

      // Check if token expired
      if (new Date() > new Date(verificationToken.expiresAt)) {
        return res.status(400).json({ error: "Verification token expired" });
      }

      // Check if session matches
      if (verificationToken.sessionId !== sessionId) {
        return res.status(403).json({ error: "Session mismatch" });
      }

      // Query server to verify token in name
      const server = await a2sService.queryServer(address);
      if (!server) {
        return res.status(400).json({ 
          error: "Could not query server", 
          verified: false 
        });
      }

      // Check if server name contains the token
      const serverNameUpper = server.name.toUpperCase();
      const tokenFound = serverNameUpper.includes(`[${token}]`) || 
                        serverNameUpper.includes(token);

      if (!tokenFound) {
        return res.status(400).json({ 
          error: `Verification code not found in server name. Current name: "${server.name}"`,
          verified: false,
          currentServerName: server.name,
          expectedToken: token
        });
      }

      // Mark token as verified
      await storage.verifyToken(verificationToken.id);

      // Create server owner record with 7-day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const serverOwner = await storage.createServerOwner({
        serverAddress: address,
        ownerEmail: verificationToken.ownerEmail,
        ownerSessionId: sessionId,
        verificationMethod: verificationToken.method,
        subscriptionTier: "free",
        subscriptionStatus: "trial",
        trialEndsAt,
      });

      res.json({
        success: true,
        verified: true,
        serverOwner,
        message: "Server successfully claimed! You now have 7-day free trial of AI Insights."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid verification data", details: error.errors });
      }
      console.error('Server verification error:', error);
      res.status(500).json({ error: "Failed to verify server ownership" });
    }
  });

  // Get server owner info
  app.get("/api/servers/:address/owner", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const sessionId = req.query.sessionId as string;

      const owner = await storage.getServerOwner(address);
      if (!owner) {
        return res.status(404).json({ error: "Server not claimed" });
      }

      // Only return owner data if session matches
      if (owner.ownerSessionId !== sessionId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      res.json(owner);
    } catch (error) {
      console.error('Get server owner error:', error);
      res.status(500).json({ error: "Failed to fetch server owner" });
    }
  });

  // Get server mods with workshop metadata
  app.get("/api/servers/:address/mods", async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.address);
      const server = await storage.getServer(address);
      
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      const modsWithMetadata = await Promise.all(
        (server.mods || []).map(async (mod) => {
          if (mod.workshopId) {
            try {
              const workshopData = await steamWorkshopService.getWorkshopItemDetails(mod.workshopId);
              return {
                ...mod,
                workshop: workshopData ? {
                  title: workshopData.title,
                  author: workshopData.creator,
                  subscriberCount: workshopData.subscriptions,
                  fileSize: workshopData.file_size,
                  lastUpdated: workshopData.time_updated,
                  previewUrl: workshopData.preview_url,
                } : null
              };
            } catch (error) {
              console.error(`Failed to fetch workshop data for ${mod.workshopId}:`, error);
              return mod;
            }
          }
          return mod;
        })
      );

      res.json({
        serverAddress: address,
        serverName: server.name,
        mods: modsWithMetadata,
        totalMods: modsWithMetadata.length,
      });
    } catch (error) {
      console.error('Get server mods error:', error);
      res.status(500).json({ error: "Failed to fetch server mods" });
    }
  });

  // Get all servers owned by session
  app.get("/api/servers/owned", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const ownedServers = await storage.getOwnedServers(sessionId);
      res.json(ownedServers);
    } catch (error) {
      console.error('Get owned servers error:', error);
      res.status(500).json({ error: "Failed to fetch owned servers" });
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

  // Parse natural language search query into filters
  app.post("/api/search/ai", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query string required" });
      }

      const filters = await OpenAIService.parseNaturalLanguageSearch(query);
      res.json({ filters, query });
    } catch (error) {
      console.error("AI search error:", error);
      res.status(500).json({ 
        error: "Failed to parse search query",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get AI-powered server recommendations
  app.get("/api/recommendations/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const maxRecommendations = parseInt(req.query.limit as string) || 5;

      // Check cache first
      const cached = recommendationsCache.get(sessionId);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json({ ...cached.data, fromCache: true });
      }

      // Get user preferences
      const preferences = await storage.getUserPreferences(sessionId);
      if (!preferences) {
        return res.status(404).json({ error: "User preferences not found" });
      }

      // Get favorite and recent servers with full details
      const favoriteAddresses = preferences.favoriteServers || [];
      const recentAddresses = preferences.recentServers || [];
      
      const [favoriteServers, recentServers] = await Promise.all([
        Promise.all(favoriteAddresses.map(addr => storage.getServer(addr))),
        Promise.all(recentAddresses.map(addr => storage.getServer(addr))),
      ]);

      // Filter out nulls and undefined
      const validFavorites = favoriteServers.filter((s): s is NonNullable<typeof s> => s !== null && s !== undefined);
      const validRecents = recentServers.filter((s): s is NonNullable<typeof s> => s !== null && s !== undefined);

      // Analyze user profile
      const profile = OpenAIService.analyzeUserProfile(validFavorites, validRecents);

      // Get available servers (top 100 by player count)
      const allServers = await storage.getServers();
      const availableServers = allServers
        .filter(s => s.playerCount && s.playerCount > 0) // Only populated servers
        .sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0))
        .slice(0, 100);

      if (availableServers.length === 0) {
        return res.json({
          recommendations: [],
          generatedAt: new Date().toISOString(),
          message: "No servers available for recommendations",
        });
      }

      // Generate recommendations using OpenAI
      const recommendations = await OpenAIService.generateRecommendations({
        userProfile: {
          ...profile,
          favoriteServers: validFavorites,
          recentServers: validRecents,
        },
        availableServers,
        maxRecommendations,
      });

      // Cache the results
      recommendationsCache.set(sessionId, {
        data: recommendations,
        expiresAt: Date.now() + RECOMMENDATION_CACHE_TTL,
      });

      res.json({ ...recommendations, fromCache: false });
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ 
        error: "Failed to generate recommendations",
        message: error instanceof Error ? error.message : "Unknown error"
      });
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

  // ============================================
  // OWNER PORTAL ROUTES (Requires owner/admin role)
  // ============================================
  
  // Get servers owned by the authenticated user
  app.get("/api/owner/servers", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ownedServers = await storage.getOwnedServers(userId);
      res.json(ownedServers);
    } catch (error) {
      console.error("Error fetching owned servers:", error);
      res.status(500).json({ error: "Failed to fetch owned servers" });
    }
  });

  // Create a new server claim request
  app.post("/api/owner/claims", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { serverAddress } = req.body;
      
      if (!serverAddress) {
        return res.status(400).json({ error: "Server address is required" });
      }

      // Check if server exists
      const server = await storage.getServer(serverAddress);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // Check if already claimed
      const existingOwner = await storage.getServerOwner(serverAddress);
      if (existingOwner) {
        return res.status(400).json({ error: "Server is already claimed" });
      }

      // Generate verification token
      const verificationToken = nanoid(16);
      
      // Create pending claim (will implement pending claims storage later)
      // For now, just return the token
      res.json({
        message: "Claim created successfully",
        serverAddress,
        verificationToken,
        instructions: `Add this token to your server's name or MOTD: ${verificationToken}`,
        expiresIn: "72 hours"
      });
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(500).json({ error: "Failed to create claim" });
    }
  });

  // Get all claims for the authenticated user
  app.get("/api/owner/claims", isAuthenticated, isOwner, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Will implement pending claims retrieval later
      res.json([]);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // ============================================
  // ADMIN PORTAL ROUTES (Requires admin role)
  // ============================================
  
  // Get all pending claims
  app.get("/api/admin/claims", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Will implement pending claims retrieval later
      res.json([]);
    } catch (error) {
      console.error("Error fetching pending claims:", error);
      res.status(500).json({ error: "Failed to fetch pending claims" });
    }
  });

  // Approve a claim
  app.put("/api/admin/claims/:id/approve", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      // Will implement claim approval later
      res.json({ message: "Claim approved successfully" });
    } catch (error) {
      console.error("Error approving claim:", error);
      res.status(500).json({ error: "Failed to approve claim" });
    }
  });

  // Reject a claim
  app.put("/api/admin/claims/:id/reject", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      // Will implement claim rejection later
      res.json({ message: "Claim rejected successfully" });
    } catch (error) {
      console.error("Error rejecting claim:", error);
      res.status(500).json({ error: "Failed to reject claim" });
    }
  });

  // Get all users
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Will implement user listing later
      res.json([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user role
  app.put("/api/admin/users/:id/role", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!["owner", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Will implement role update later
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Get system metrics
  app.get("/api/admin/metrics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Will implement metrics retrieval later
      res.json({
        totalUsers: 0,
        totalServers: 0,
        totalClaims: 0,
        pendingClaims: 0
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
