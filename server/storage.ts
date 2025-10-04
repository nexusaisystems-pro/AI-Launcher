import { type Server, type InsertServer, type ServerAnalytics, type InsertServerAnalytics, type UserPreferences, type InsertUserPreferences, type WorkshopMod, type InsertWorkshopMod, type ServerStats, type ServerFilters, servers, serverAnalytics, userPreferences, workshopMods } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";

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
  
  // Workshop mods
  getWorkshopMod(workshopId: string): Promise<WorkshopMod | undefined>;
  getWorkshopMods(workshopIds: string[]): Promise<WorkshopMod[]>;
  cacheWorkshopMod(mod: InsertWorkshopMod): Promise<WorkshopMod>;
  cacheWorkshopMods(mods: InsertWorkshopMod[]): Promise<WorkshopMod[]>;
}

export class DatabaseStorage implements IStorage {
  async getServers(filters?: ServerFilters): Promise<Server[]> {
    const conditions = [];
    
    if (filters) {
      if (filters.map && filters.map !== "All Maps") {
        conditions.push(eq(servers.map, filters.map));
      }
      if (filters.minPlayers !== undefined) {
        conditions.push(sql`COALESCE(${servers.playerCount}, 0) >= ${filters.minPlayers}`);
      }
      if (filters.maxPing !== undefined) {
        conditions.push(sql`COALESCE(${servers.ping}, 999) <= ${filters.maxPing}`);
      }
      if (filters.perspective && filters.perspective !== "Both") {
        conditions.push(eq(servers.perspective, filters.perspective));
      }
      if (filters.region && filters.region.length > 0) {
        conditions.push(inArray(servers.region, filters.region));
      }
      if (!filters.showFull) {
        conditions.push(sql`COALESCE(${servers.playerCount}, 0) < COALESCE(${servers.maxPlayers}, 999)`);
      }
      if (!filters.showPasswordProtected) {
        conditions.push(eq(servers.passwordProtected, false));
      }
    }
    
    let query = db.select().from(servers);
    
    if (conditions.length === 1) {
      query = query.where(conditions[0]) as typeof query;
    } else if (conditions.length > 1) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    const results = await query.orderBy(sql`COALESCE(${servers.playerCount}, 0) DESC`);
    
    if (filters?.modCount) {
      return results.filter(s => {
        const modCount = (s.mods ?? []).length;
        switch (filters.modCount) {
          case "vanilla":
            return modCount === 0;
          case "1-10":
            return modCount >= 1 && modCount <= 10;
          case "10+":
            return modCount > 10;
          default:
            return true;
        }
      });
    }
    
    return results;
  }

  async getServer(address: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.address, address));
    return server || undefined;
  }

  async createServer(server: InsertServer): Promise<Server> {
    const [createdServer] = await db
      .insert(servers)
      .values(server)
      .returning();
    return createdServer;
  }

  async updateServer(address: string, updates: Partial<InsertServer>): Promise<Server | undefined> {
    const [updatedServer] = await db
      .update(servers)
      .set({
        ...updates,
        lastSeen: new Date(),
      })
      .where(eq(servers.address, address))
      .returning();
    return updatedServer || undefined;
  }

  async deleteServer(address: string): Promise<boolean> {
    const result = await db.delete(servers).where(eq(servers.address, address));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async addServerAnalytics(analytics: InsertServerAnalytics): Promise<ServerAnalytics> {
    const [createdAnalytics] = await db
      .insert(serverAnalytics)
      .values(analytics)
      .returning();
    return createdAnalytics;
  }

  async getServerStats(): Promise<ServerStats> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const [stats] = await db
      .select({
        serversOnline: sql<number>`COUNT(*) FILTER (WHERE ${servers.lastSeen} >= ${fiveMinutesAgo})`,
        totalPlayers: sql<number>`COALESCE(SUM(${servers.playerCount}), 0)`,
        avgPing: sql<number>`COALESCE(ROUND(AVG(${servers.ping})), 0)`,
      })
      .from(servers);
    
    return {
      serversOnline: stats?.serversOnline ?? 0,
      totalPlayers: stats?.totalPlayers ?? 0,
      avgPing: stats?.avgPing ?? 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getUserPreferences(sessionId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.sessionId, sessionId));
    return prefs || undefined;
  }

  async createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(preferences.sessionId);
    
    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userPreferences)
        .values(preferences)
        .returning();
      return created;
    }
  }

  async getWorkshopMod(workshopId: string): Promise<WorkshopMod | undefined> {
    const [mod] = await db
      .select()
      .from(workshopMods)
      .where(eq(workshopMods.workshopId, workshopId));
    return mod || undefined;
  }

  async getWorkshopMods(workshopIds: string[]): Promise<WorkshopMod[]> {
    if (workshopIds.length === 0) return [];
    
    return await db
      .select()
      .from(workshopMods)
      .where(inArray(workshopMods.workshopId, workshopIds));
  }

  async cacheWorkshopMod(mod: InsertWorkshopMod): Promise<WorkshopMod> {
    const [cached] = await db
      .insert(workshopMods)
      .values(mod)
      .onConflictDoUpdate({
        target: workshopMods.workshopId,
        set: {
          ...mod,
          cachedAt: new Date(),
        },
      })
      .returning();
    return cached;
  }

  async cacheWorkshopMods(mods: InsertWorkshopMod[]): Promise<WorkshopMod[]> {
    if (mods.length === 0) return [];
    
    const results = await Promise.all(
      mods.map(mod => this.cacheWorkshopMod(mod))
    );
    return results;
  }
}

export const storage = new DatabaseStorage();
