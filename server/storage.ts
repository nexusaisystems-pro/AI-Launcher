import { type Server, type InsertServer, type ServerAnalytics, type InsertServerAnalytics, type UserPreferences, type InsertUserPreferences, type WorkshopMod, type InsertWorkshopMod, type BattleMetricsCache, type InsertBattleMetricsCache, type ServerStats, type ServerFilters, type ServerOwner, type InsertServerOwner, type VerificationToken, type InsertVerificationToken, type User, type UpsertUser, type PendingClaim, type InsertPendingClaim, servers, serverAnalytics, userPreferences, workshopMods, battlemetricsCache, serverOwners, verificationTokens, users, pendingClaims } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  
  // Server operations
  getServers(filters?: ServerFilters): Promise<Server[]>;
  getServersPaginated(filters?: ServerFilters, page?: number, limit?: number, sortBy?: string): Promise<{ servers: Server[], total: number }>;
  getSponsoredServers(limit?: number): Promise<Server[]>;
  getServer(address: string): Promise<Server | undefined>;
  searchServersByName(query: string, limit?: number): Promise<Server[]>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(address: string, updates: Partial<InsertServer>): Promise<Server | undefined>;
  deleteServer(address: string): Promise<boolean>;
  
  // Server analytics
  addServerAnalytics(analytics: InsertServerAnalytics): Promise<ServerAnalytics>;
  getServerStats(): Promise<ServerStats>;
  getAvailableMaps(): Promise<string[]>;
  
  // User preferences
  getUserPreferences(sessionId: string): Promise<UserPreferences | undefined>;
  createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Workshop mods
  getWorkshopMod(workshopId: string): Promise<WorkshopMod | undefined>;
  getWorkshopMods(workshopIds: string[]): Promise<WorkshopMod[]>;
  cacheWorkshopMod(mod: InsertWorkshopMod): Promise<WorkshopMod>;
  cacheWorkshopMods(mods: InsertWorkshopMod[]): Promise<WorkshopMod[]>;
  
  // BattleMetrics cache
  getBattleMetricsCache(serverId: string): Promise<BattleMetricsCache | undefined>;
  getBattleMetricsCacheByAddress(serverAddress: string): Promise<BattleMetricsCache | undefined>;
  getAllBattleMetricsCache(): Promise<BattleMetricsCache[]>;
  cacheBattleMetrics(data: InsertBattleMetricsCache): Promise<BattleMetricsCache>;
  cacheBattleMetricsBatch(data: InsertBattleMetricsCache[]): Promise<BattleMetricsCache[]>;
  
  // Server ownership
  getServerOwner(serverAddress: string): Promise<ServerOwner | undefined>;
  getOwnedServers(sessionId: string): Promise<any[]>;
  createServerOwner(owner: InsertServerOwner): Promise<ServerOwner>;
  updateServerOwner(serverAddress: string, updates: Partial<InsertServerOwner>): Promise<ServerOwner | undefined>;
  
  // Verification tokens
  getVerificationToken(serverAddress: string, token: string): Promise<VerificationToken | undefined>;
  createVerificationToken(tokenData: InsertVerificationToken): Promise<VerificationToken>;
  verifyToken(tokenId: string): Promise<VerificationToken | undefined>;
  
  // Pending claims
  getAllPendingClaims(): Promise<PendingClaim[]>;
  getPendingClaim(id: string): Promise<PendingClaim | undefined>;
  createPendingClaim(claim: InsertPendingClaim): Promise<PendingClaim>;
  approveClaim(id: string, adminId: string): Promise<PendingClaim | undefined>;
  rejectClaim(id: string, adminId: string, reason: string): Promise<PendingClaim | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Try to find existing user by ID or email
    const existingUser = await db
      .select()
      .from(users)
      .where(sql`${users.id} = ${userData.id} OR ${users.email} = ${userData.email}`)
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      return user;
    } else {
      // Insert new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getServers(filters?: ServerFilters): Promise<Server[]> {
    const conditions = [];
    
    if (filters) {
      if (filters.map && filters.map !== "All Maps") {
        conditions.push(sql`LOWER(${servers.map}) = LOWER(${filters.map})`);
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

  async getServersPaginated(filters?: ServerFilters, page: number = 1, limit: number = 50, sortBy: string = "players"): Promise<{ servers: Server[], total: number }> {
    const conditions = [];
    
    if (filters) {
      if (filters.map && filters.map !== "All Maps") {
        conditions.push(sql`LOWER(${servers.map}) = LOWER(${filters.map})`);
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
    
    let baseQuery = db.select().from(servers);
    
    if (conditions.length === 1) {
      baseQuery = baseQuery.where(conditions[0]) as typeof baseQuery;
    } else if (conditions.length > 1) {
      baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
    }
    
    // Determine sort order
    let orderByClause;
    switch (sortBy) {
      case "quality":
        orderByClause = sql`COALESCE(${servers.playerCount}, 0) DESC`; // TODO: Add quality score column
        break;
      case "players":
        orderByClause = sql`COALESCE(${servers.playerCount}, 0) DESC`;
        break;
      case "ping":
        orderByClause = sql`COALESCE(${servers.ping}, 999) ASC`;
        break;
      case "name":
        orderByClause = sql`${servers.name} ASC`;
        break;
      case "map":
        orderByClause = sql`${servers.map} ASC`;
        break;
      default:
        orderByClause = sql`COALESCE(${servers.playerCount}, 0) DESC`;
    }
    
    // Get total count (for pagination metadata)
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(servers);
    if (conditions.length === 1) {
      countQuery.where(conditions[0]);
    } else if (conditions.length > 1) {
      countQuery.where(and(...conditions));
    }
    const [{ count: total }] = await countQuery;
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const results = await baseQuery
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
    
    // Apply client-side mod count filter if needed (can't do in SQL easily with JSON arrays)
    let filteredResults = results;
    if (filters?.modCount) {
      filteredResults = results.filter(s => {
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
    
    return { servers: filteredResults, total };
  }

  async getSponsoredServers(limit: number = 5): Promise<Server[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.isSponsored, true),
          sql`(${servers.sponsorExpiresAt} IS NULL OR ${servers.sponsorExpiresAt} > ${now})`
        )
      )
      .orderBy(sql`COALESCE(${servers.sponsorPriority}, 0) DESC`)
      .limit(limit);
    return results;
  }

  async getServer(address: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.address, address));
    return server || undefined;
  }

  async searchServersByName(query: string, limit: number = 100): Promise<Server[]> {
    const searchPattern = `%${query}%`;
    const results = await db
      .select()
      .from(servers)
      .where(sql`
        ${servers.name} ILIKE ${searchPattern} OR 
        COALESCE(${servers.address}, '') ILIKE ${searchPattern} OR 
        COALESCE(${servers.map}, '') ILIKE ${searchPattern}
      `)
      .orderBy(sql`COALESCE(${servers.playerCount}, 0) DESC`)
      .limit(limit);
    return results;
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
    const [stats] = await db
      .select({
        serversOnline: sql<number>`COUNT(*)`,
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

  async getAvailableMaps(): Promise<string[]> {
    const result = await db
      .selectDistinct({ map: servers.map })
      .from(servers)
      .where(sql`${servers.map} IS NOT NULL`)
      .orderBy(servers.map);
    
    return result.map(r => r.map).filter((map): map is string => map !== null);
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

  async getBattleMetricsCache(serverId: string): Promise<BattleMetricsCache | undefined> {
    const [cached] = await db
      .select()
      .from(battlemetricsCache)
      .where(eq(battlemetricsCache.serverId, serverId));
    return cached || undefined;
  }

  async getBattleMetricsCacheByAddress(serverAddress: string): Promise<BattleMetricsCache | undefined> {
    const [cached] = await db
      .select()
      .from(battlemetricsCache)
      .where(eq(battlemetricsCache.serverAddress, serverAddress));
    return cached || undefined;
  }

  async getAllBattleMetricsCache(): Promise<BattleMetricsCache[]> {
    return await db.select().from(battlemetricsCache);
  }

  async cacheBattleMetrics(data: InsertBattleMetricsCache): Promise<BattleMetricsCache> {
    const [cached] = await db
      .insert(battlemetricsCache)
      .values(data)
      .onConflictDoUpdate({
        target: battlemetricsCache.serverId,
        set: {
          ...data,
          cachedAt: new Date(),
        },
      })
      .returning();
    return cached;
  }

  async cacheBattleMetricsBatch(data: InsertBattleMetricsCache[]): Promise<BattleMetricsCache[]> {
    if (data.length === 0) return [];
    
    const results = await Promise.all(
      data.map(item => this.cacheBattleMetrics(item))
    );
    return results;
  }

  async getServerOwner(serverAddress: string): Promise<ServerOwner | undefined> {
    const [owner] = await db
      .select()
      .from(serverOwners)
      .where(eq(serverOwners.serverAddress, serverAddress));
    return owner || undefined;
  }

  async getOwnedServers(sessionId: string): Promise<any[]> {
    const ownedServerAddresses = await db
      .select()
      .from(serverOwners)
      .where(eq(serverOwners.ownerSessionId, sessionId));

    if (ownedServerAddresses.length === 0) {
      return [];
    }

    const serverData = await Promise.all(
      ownedServerAddresses.map(async (ownership) => {
        const server = await this.getServer(ownership.serverAddress);
        return {
          ...server,
          ownership,
        };
      })
    );

    return serverData.filter(s => s.id);
  }

  async createServerOwner(owner: InsertServerOwner): Promise<ServerOwner> {
    const [created] = await db
      .insert(serverOwners)
      .values({
        ...owner,
        verifiedAt: new Date(),
      })
      .returning();
    return created;
  }

  async updateServerOwner(serverAddress: string, updates: Partial<InsertServerOwner>): Promise<ServerOwner | undefined> {
    const [updated] = await db
      .update(serverOwners)
      .set(updates)
      .where(eq(serverOwners.serverAddress, serverAddress))
      .returning();
    return updated || undefined;
  }

  async getVerificationToken(serverAddress: string, token: string): Promise<VerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.serverAddress, serverAddress),
          eq(verificationTokens.token, token)
        )
      );
    return verificationToken || undefined;
  }

  async createVerificationToken(tokenData: InsertVerificationToken): Promise<VerificationToken> {
    const [created] = await db
      .insert(verificationTokens)
      .values(tokenData)
      .returning();
    return created;
  }

  async verifyToken(tokenId: string): Promise<VerificationToken | undefined> {
    const [updated] = await db
      .update(verificationTokens)
      .set({ verified: true })
      .where(eq(verificationTokens.id, tokenId))
      .returning();
    return updated || undefined;
  }

  async getAllPendingClaims(): Promise<PendingClaim[]> {
    return await db
      .select()
      .from(pendingClaims)
      .where(eq(pendingClaims.status, 'pending'));
  }

  async getPendingClaim(id: string): Promise<PendingClaim | undefined> {
    const [claim] = await db
      .select()
      .from(pendingClaims)
      .where(eq(pendingClaims.id, id));
    return claim;
  }

  async createPendingClaim(claimData: InsertPendingClaim): Promise<PendingClaim> {
    const [claim] = await db
      .insert(pendingClaims)
      .values(claimData)
      .returning();
    return claim;
  }

  async approveClaim(id: string, adminId: string): Promise<PendingClaim | undefined> {
    const [claim] = await db
      .update(pendingClaims)
      .set({ 
        status: 'verified',
        verifiedAt: new Date()
      })
      .where(eq(pendingClaims.id, id))
      .returning();
    return claim;
  }

  async rejectClaim(id: string, adminId: string, reason: string): Promise<PendingClaim | undefined> {
    const [claim] = await db
      .update(pendingClaims)
      .set({ 
        status: 'rejected',
        adminNotes: reason,
        lastCheckedAt: new Date()
      })
      .where(eq(pendingClaims.id, id))
      .returning();
    return claim;
  }
}

export const storage = new DatabaseStorage();
