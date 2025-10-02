import { type Server, type InsertServer, type ServerAnalytics, type InsertServerAnalytics, type UserPreferences, type InsertUserPreferences, type ServerStats, type ServerFilters, type ServerMod } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Server operations
  getServers(filters?: ServerFilters): Promise<Server[]>;
  getServer(address: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(address: string, updates: Partial<InsertServer>): Promise<Server | undefined>;
  deleteServer(address: string): Promise<boolean>;
  
  // Server analytics
  addServerAnalytics(analytics: InsertServerAnalytics): Promise<ServerAnalytics>;
  getServerStats(): Promise<ServerStats>;
  
  // User preferences
  getUserPreferences(sessionId: string): Promise<UserPreferences | undefined>;
  createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
}

export class MemStorage implements IStorage {
  private servers: Map<string, Server>;
  private analytics: Map<string, ServerAnalytics>;
  private userPreferences: Map<string, UserPreferences>;

  constructor() {
    this.servers = new Map();
    this.analytics = new Map();
    this.userPreferences = new Map();
    
    // Initialize with some sample servers for development
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleServers: InsertServer[] = [
      {
        address: "185.23.67.142:2302",
        name: "DayZ Europa | Hardcore Survival | Namalsk",
        map: "Namalsk",
        playerCount: 47,
        maxPlayers: 60,
        ping: 23,
        passwordProtected: false,
        perspective: "1PP",
        region: "EU",
        version: "1.23.159565",
        mods: [
          { id: "cf", name: "CF (Community Framework)", workshopId: "1559212036", size: 125 * 1024 * 1024, required: true, installed: true },
          { id: "expansion", name: "DayZ-Expansion-Core", workshopId: "2291785437", size: 892 * 1024 * 1024, required: true, installed: true },
          { id: "scopes", name: "Advanced Weapon Scopes", workshopId: "2143128974", size: 234 * 1024 * 1024, required: true, installed: false },
        ],
        queue: 2,
        verified: true,
        restartSchedule: "Every 4 hours",
        uptime: 99,
        tags: ["hardcore", "survival"],
      },
      {
        address: "92.114.23.89:2402",
        name: "Project X | PvP | Traders | High Loot | Chernarus",
        map: "Chernarus",
        playerCount: 89,
        maxPlayers: 100,
        ping: 78,
        passwordProtected: false,
        perspective: "3PP",
        region: "NA-EAST",
        version: "1.23.159565",
        mods: [
          { id: "traders", name: "Trader Mod", workshopId: "1590841260", size: 45 * 1024 * 1024, required: true, installed: true },
        ],
        queue: 0,
        verified: false,
        uptime: 95,
        tags: ["pvp", "traders", "high-loot"],
      },
      {
        address: "45.138.50.214:2302",
        name: "Vanilla Survival | Fresh Wipe | Livonia | No KOS Safe Zones",
        map: "Livonia",
        playerCount: 34,
        maxPlayers: 80,
        ping: 31,
        passwordProtected: false,
        perspective: "1PP",
        region: "EU",
        version: "1.23.159565",
        mods: [],
        queue: 0,
        verified: true,
        uptime: 98,
        tags: ["vanilla", "fresh-wipe", "safe-zones"],
      },
    ];

    sampleServers.forEach(server => {
      const id = randomUUID();
      const fullServer: Server = {
        id,
        address: server.address,
        name: server.name,
        map: server.map ?? null,
        playerCount: server.playerCount ?? null,
        maxPlayers: server.maxPlayers ?? null,
        ping: server.ping ?? null,
        passwordProtected: server.passwordProtected ?? null,
        perspective: server.perspective ?? null,
        region: server.region ?? null,
        version: server.version ?? null,
        mods: (server.mods ?? null) as ServerMod[] | null,
        queue: server.queue ?? null,
        verified: server.verified ?? null,
        lastWipe: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        restartSchedule: server.restartSchedule ?? null,
        lastSeen: new Date(),
        uptime: server.uptime ?? null,
        tags: (server.tags ? [...server.tags] : null) as string[] | null,
      };
      this.servers.set(server.address, fullServer);
    });
  }

  async getServers(filters?: ServerFilters): Promise<Server[]> {
    let servers = Array.from(this.servers.values());
    
    if (filters) {
      if (filters.map && filters.map !== "All Maps") {
        servers = servers.filter(s => s.map === filters.map);
      }
      if (filters.minPlayers !== undefined) {
        servers = servers.filter(s => (s.playerCount ?? 0) >= filters.minPlayers!);
      }
      if (filters.maxPing !== undefined) {
        servers = servers.filter(s => (s.ping ?? 0) <= filters.maxPing!);
      }
      if (filters.perspective && filters.perspective !== "Both") {
        servers = servers.filter(s => s.perspective === filters.perspective);
      }
      if (filters.region && filters.region.length > 0) {
        servers = servers.filter(s => s.region && filters.region!.includes(s.region));
      }
      if (!filters.showFull) {
        servers = servers.filter(s => (s.playerCount ?? 0) < (s.maxPlayers ?? 0));
      }
      if (!filters.showPasswordProtected) {
        servers = servers.filter(s => !s.passwordProtected);
      }
      if (filters.modCount) {
        switch (filters.modCount) {
          case "vanilla":
            servers = servers.filter(s => (s.mods ?? []).length === 0);
            break;
          case "1-10":
            servers = servers.filter(s => (s.mods ?? []).length >= 1 && (s.mods ?? []).length <= 10);
            break;
          case "10+":
            servers = servers.filter(s => (s.mods ?? []).length > 10);
            break;
        }
      }
    }
    
    return servers.sort((a, b) => (b.playerCount ?? 0) - (a.playerCount ?? 0));
  }

  async getServer(address: string): Promise<Server | undefined> {
    return this.servers.get(address);
  }

  async createServer(server: InsertServer): Promise<Server> {
    const id = randomUUID();
    const fullServer: Server = {
      id,
      address: server.address,
      name: server.name,
      map: server.map ?? null,
      playerCount: server.playerCount ?? null,
      maxPlayers: server.maxPlayers ?? null,
      ping: server.ping ?? null,
      passwordProtected: server.passwordProtected ?? null,
      perspective: server.perspective ?? null,
      region: server.region ?? null,
      version: server.version ?? null,
      mods: (server.mods ?? null) as ServerMod[] | null,
      queue: server.queue ?? null,
      verified: server.verified ?? null,
      lastWipe: server.lastWipe ?? null,
      restartSchedule: server.restartSchedule ?? null,
      lastSeen: new Date(),
      uptime: server.uptime ?? null,
      tags: server.tags ?? null,
    };
    this.servers.set(server.address, fullServer);
    return fullServer;
  }

  async updateServer(address: string, updates: Partial<InsertServer>): Promise<Server | undefined> {
    const server = this.servers.get(address);
    if (!server) return undefined;
    
    const updatedServer: Server = {
      ...server,
      map: updates.map !== undefined ? updates.map ?? null : server.map,
      playerCount: updates.playerCount !== undefined ? updates.playerCount ?? null : server.playerCount,
      maxPlayers: updates.maxPlayers !== undefined ? updates.maxPlayers ?? null : server.maxPlayers,
      ping: updates.ping !== undefined ? updates.ping ?? null : server.ping,
      passwordProtected: updates.passwordProtected !== undefined ? updates.passwordProtected ?? null : server.passwordProtected,
      perspective: updates.perspective !== undefined ? updates.perspective ?? null : server.perspective,
      region: updates.region !== undefined ? updates.region ?? null : server.region,
      version: updates.version !== undefined ? updates.version ?? null : server.version,
      mods: updates.mods !== undefined ? updates.mods as ServerMod[] | null ?? null : server.mods,
      queue: updates.queue !== undefined ? updates.queue ?? null : server.queue,
      verified: updates.verified !== undefined ? updates.verified ?? null : server.verified,
      lastWipe: updates.lastWipe !== undefined ? updates.lastWipe ?? null : server.lastWipe,
      restartSchedule: updates.restartSchedule !== undefined ? updates.restartSchedule ?? null : server.restartSchedule,
      uptime: updates.uptime !== undefined ? updates.uptime ?? null : server.uptime,
      tags: updates.tags !== undefined ? (updates.tags ?? null) as string[] | null : server.tags,
      lastSeen: new Date(),
    };
    this.servers.set(address, updatedServer);
    return updatedServer;
  }

  async deleteServer(address: string): Promise<boolean> {
    return this.servers.delete(address);
  }

  async addServerAnalytics(analytics: InsertServerAnalytics): Promise<ServerAnalytics> {
    const id = randomUUID();
    const fullAnalytics: ServerAnalytics = {
      id,
      serverAddress: analytics.serverAddress,
      timestamp: new Date(),
      playerCount: analytics.playerCount ?? null,
      responseTime: analytics.responseTime ?? null,
      isOnline: analytics.isOnline ?? null,
    };
    this.analytics.set(id, fullAnalytics);
    return fullAnalytics;
  }

  async getServerStats(): Promise<ServerStats> {
    const servers = Array.from(this.servers.values());
    const onlineServers = servers.filter(s => {
      if (!s.lastSeen) return false;
      const timeSinceLastSeen = Date.now() - new Date(s.lastSeen).getTime();
      return timeSinceLastSeen < 5 * 60 * 1000; // Consider online if seen within 5 minutes
    });
    
    const totalPlayers = servers.reduce((sum, s) => sum + (s.playerCount ?? 0), 0);
    const avgPing = servers.length > 0 
      ? Math.round(servers.reduce((sum, s) => sum + (s.ping ?? 0), 0) / servers.length)
      : 0;
    
    return {
      serversOnline: onlineServers.length,
      totalPlayers,
      avgPing,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getUserPreferences(sessionId: string): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(p => p.sessionId === sessionId);
  }

  async createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(preferences.sessionId);
    
    if (existing) {
      const updated: UserPreferences = {
        ...existing,
        favoriteServers: preferences.favoriteServers !== undefined ? (preferences.favoriteServers ?? null) as string[] | null : existing.favoriteServers,
        recentServers: preferences.recentServers !== undefined ? (preferences.recentServers ?? null) as string[] | null : existing.recentServers,
        filters: preferences.filters !== undefined ? (preferences.filters ?? null) as ServerFilters | null : existing.filters,
        updatedAt: new Date(),
      };
      this.userPreferences.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newPreferences: UserPreferences = {
        id,
        sessionId: preferences.sessionId,
        favoriteServers: (preferences.favoriteServers ?? null) as string[] | null,
        recentServers: (preferences.recentServers ?? null) as string[] | null,
        filters: (preferences.filters ?? null) as ServerFilters | null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.userPreferences.set(id, newPreferences);
      return newPreferences;
    }
  }
}

export const storage = new MemStorage();
