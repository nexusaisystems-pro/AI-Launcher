import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const servers = pgTable("servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: varchar("address", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  map: varchar("map", { length: 100 }),
  playerCount: integer("player_count").default(0),
  maxPlayers: integer("max_players").default(0),
  ping: integer("ping"),
  passwordProtected: boolean("password_protected").default(false),
  perspective: varchar("perspective", { length: 10 }), // "1PP", "3PP", "Both"
  region: varchar("region", { length: 50 }),
  version: varchar("version", { length: 50 }),
  mods: jsonb("mods").$type<ServerMod[]>().default([]),
  queue: integer("queue").default(0),
  verified: boolean("verified").default(false),
  lastWipe: timestamp("last_wipe"),
  restartSchedule: text("restart_schedule"),
  lastSeen: timestamp("last_seen").default(sql`CURRENT_TIMESTAMP`),
  uptime: integer("uptime").default(0), // percentage
  tags: jsonb("tags").$type<string[]>().default([]),
});

export const serverAnalytics = pgTable("server_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverAddress: varchar("server_address", { length: 50 }).notNull(),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
  playerCount: integer("player_count"),
  responseTime: integer("response_time_ms"),
  isOnline: boolean("is_online").default(true),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  favoriteServers: jsonb("favorite_servers").$type<string[]>().default([]),
  recentServers: jsonb("recent_servers").$type<string[]>().default([]),
  filters: jsonb("filters").$type<ServerFilters>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const workshopMods = pgTable("workshop_mods", {
  workshopId: varchar("workshop_id", { length: 50 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileSize: integer("file_size"),
  previewUrl: text("preview_url"),
  timeCreated: integer("time_created"),
  timeUpdated: integer("time_updated"),
  tags: jsonb("tags").$type<string[]>().default([]),
  creator: varchar("creator", { length: 100 }),
  subscriberCount: integer("subscriber_count"),
  cachedAt: timestamp("cached_at").default(sql`CURRENT_TIMESTAMP`),
});

export const battlemetricsCache = pgTable("battlemetrics_cache", {
  serverId: varchar("server_id", { length: 50 }).primaryKey(),
  serverAddress: varchar("server_address", { length: 50 }).notNull(),
  battlemetricsId: varchar("battlemetrics_id", { length: 50 }),
  rank: integer("rank"),
  uptimePercent7d: integer("uptime_percent_7d"),
  uptimePercent30d: integer("uptime_percent_30d"),
  avgPlayerCount7d: integer("avg_player_count_7d"),
  peakPlayerCount7d: integer("peak_player_count_7d"),
  maxPlayerCount: integer("max_player_count"),
  serverAge: integer("server_age_days"),
  status: varchar("status", { length: 20 }),
  country: varchar("country", { length: 50 }),
  cityName: varchar("city_name", { length: 100 }),
  details: jsonb("details").$type<BattleMetricsDetails>(),
  cachedAt: timestamp("cached_at").default(sql`CURRENT_TIMESTAMP`),
});

// Types
export interface ServerMod {
  id: string;
  name: string;
  workshopId?: string;
  size: number; // in bytes
  required: boolean;
  installed?: boolean;
  version?: string;
}

export interface BattleMetricsDetails {
  firstSeen?: string;
  lastSeen?: string;
  privateServer?: boolean;
  createdAt?: string;
  updatedAt?: string;
  portQuery?: number;
  portGame?: number;
  players?: number;
  maxPlayers?: number;
  map?: string;
  version?: string;
  queryStatus?: string;
}

export interface ServerFilters {
  map?: string;
  minPlayers?: number;
  maxPing?: number;
  perspective?: string;
  region?: string[];
  showFull?: boolean;
  showPasswordProtected?: boolean;
  showWhitelisted?: boolean;
  modCount?: "vanilla" | "1-10" | "10+";
  tags?: string[];
  favoriteAddresses?: string[];
  recentAddresses?: string[];
}

export interface ServerStats {
  serversOnline: number;
  totalPlayers: number;
  avgPing: number;
  lastUpdated: string;
}

// Insert schemas
export const insertServerSchema = createInsertSchema(servers).omit({
  id: true,
  lastSeen: true,
});

export const insertServerAnalyticsSchema = createInsertSchema(serverAnalytics).omit({
  id: true,
  timestamp: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkshopModSchema = createInsertSchema(workshopMods).omit({
  cachedAt: true,
});

export const insertBattleMetricsCacheSchema = createInsertSchema(battlemetricsCache).omit({
  cachedAt: true,
});

// Types
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;
export type InsertServerAnalytics = z.infer<typeof insertServerAnalyticsSchema>;
export type ServerAnalytics = typeof serverAnalytics.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertWorkshopMod = z.infer<typeof insertWorkshopModSchema>;
export type WorkshopMod = typeof workshopMods.$inferSelect;
export type InsertBattleMetricsCache = z.infer<typeof insertBattleMetricsCacheSchema>;
export type BattleMetricsCache = typeof battlemetricsCache.$inferSelect;
