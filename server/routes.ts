import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertServerSchema, insertUserPreferencesSchema, type ServerFilters } from "@shared/schema";
import { z } from "zod";

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

  // Mock server discovery/refresh endpoint
  app.post("/api/servers/refresh", async (req, res) => {
    try {
      // In a real implementation, this would query Steam master servers
      // For now, just return current servers with updated timestamps
      const servers = await storage.getServers();
      
      // Simulate some random changes
      for (const server of servers.slice(0, 3)) {
        await storage.updateServer(server.address, {
          playerCount: Math.max(0, (server.playerCount ?? 0) + Math.floor(Math.random() * 10 - 5)),
          ping: Math.max(1, (server.ping ?? 0) + Math.floor(Math.random() * 20 - 10)),
        });
      }
      
      const updatedServers = await storage.getServers();
      res.json({ message: "Servers refreshed", count: updatedServers.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh servers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
