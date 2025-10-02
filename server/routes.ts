import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertServerSchema, insertUserPreferencesSchema, type ServerFilters } from "@shared/schema";
import { z } from "zod";
import { a2sService } from "./a2s-service";
import { cacheService } from "./cache-service";

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
      const servers = await storage.getServers(validatedFilters);
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

  const httpServer = createServer(app);
  return httpServer;
}
