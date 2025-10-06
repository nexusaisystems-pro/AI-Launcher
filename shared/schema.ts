import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Games table for multi-game support
export const games = pgTable("games", {
  id: varchar("id", { length: 50 }).primaryKey(), // 'dayz', 'rust', 'arma3', etc.
  name: varchar("name", { length: 100 }).notNull(), // Display name
  queryProtocol: varchar("query_protocol", { length: 20 }).notNull(), // 'a2s', 'minecraft', 'custom'
  steamAppId: integer("steam_app_id"), // For Workshop integration
  logo: text("logo"), // Logo URL
  enabled: boolean("enabled").default(true),
  features: jsonb("features").$type<GameFeatures>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Users table for authentication (owners and admins)
// Compatible with Replit Auth blueprint requirements
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique(),
  // Replit Auth fields
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  // Custom fields for platform
  steamId: varchar("steam_id", { length: 100 }).unique(), // For Steam OAuth
  role: varchar("role", { length: 20 }).notNull().default("owner"), // 'owner', 'admin'
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: timestamp("last_login_at"),
});

export const servers = pgTable("servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id", { length: 50 }).notNull().default("dayz"), // FK to games
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
  mods: jsonb("mods").$type<ServerMod[]>().notNull().default([]),
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
  queue: integer("queue"),
  ping: integer("ping"),
  uptime: integer("uptime"),
  responseTime: integer("response_time_ms"),
  isOnline: boolean("is_online").default(true),
});

export const serverOwners = pgTable("server_owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverAddress: varchar("server_address", { length: 50 }).notNull().unique(),
  userId: varchar("user_id", { length: 100 }), // FK to users (nullable for backwards compat)
  ownerEmail: varchar("owner_email", { length: 255 }).notNull(),
  ownerSessionId: varchar("owner_session_id", { length: 100 }).notNull(), // Keep for backwards compat
  verificationMethod: varchar("verification_method", { length: 50 }).notNull(), // "server_name", "dns", "steam_admin"
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("free"), // "free", "insights_pro", "premium"
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"), // "active", "canceled", "trial"
  trialEndsAt: timestamp("trial_ends_at"),
  claimedAt: timestamp("claimed_at").default(sql`CURRENT_TIMESTAMP`),
  verifiedAt: timestamp("verified_at"),
});

// Pending server claims (replaces verification_tokens with enhanced workflow)
export const pendingClaims = pgTable("pending_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull(), // FK to users
  serverAddress: varchar("server_address", { length: 50 }).notNull(),
  verificationToken: varchar("verification_token", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'verified', 'expired', 'rejected'
  method: varchar("method", { length: 50 }).notNull().default("server_name"),
  lastCheckedAt: timestamp("last_checked_at"),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Admin activity log
export const adminActivityLog = pgTable("admin_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id", { length: 100 }).notNull(), // FK to users
  action: varchar("action", { length: 50 }).notNull(), // 'approve_claim', 'reject_claim', 'verify_server', 'ban_owner'
  targetType: varchar("target_type", { length: 20 }).notNull(), // 'server', 'user', 'claim'
  targetId: varchar("target_id", { length: 100 }).notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

// System metrics for monitoring
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // 'api_calls', 'cache_hits', 'a2s_queries', 'openai_tokens'
  value: integer("value").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverAddress: varchar("server_address", { length: 50 }).notNull(),
  token: varchar("token", { length: 20 }).notNull().unique(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  ownerEmail: varchar("owner_email", { length: 255 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  verified: boolean("verified").default(false),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  favoriteServers: jsonb("favorite_servers").$type<string[]>().default([]),
  recentServers: jsonb("recent_servers").$type<string[]>().default([]),
  watchlistServers: jsonb("watchlist_servers").$type<string[]>().default([]),
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
  serverName: varchar("server_name", { length: 255 }),
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
export interface GameFeatures {
  hasMods?: boolean;
  hasWorkshop?: boolean;
  hasVoice?: boolean;
  hasRanking?: boolean;
  supportsClaiming?: boolean;
}

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
  modNames?: string[];
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
  watchlistAddresses?: string[];
  minQualityScore?: number;
  hideFraud?: boolean;
  verifiedOnly?: boolean;
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

export const insertServerOwnerSchema = createInsertSchema(serverOwners).omit({
  id: true,
  claimedAt: true,
  verifiedAt: true,
});

export const insertVerificationTokenSchema = createInsertSchema(verificationTokens).omit({
  id: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertPendingClaimSchema = createInsertSchema(pendingClaims).omit({
  id: true,
  createdAt: true,
});

export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLog).omit({
  id: true,
  timestamp: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
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
export type InsertServerOwner = z.infer<typeof insertServerOwnerSchema>;
export type ServerOwner = typeof serverOwners.$inferSelect;
export type InsertVerificationToken = z.infer<typeof insertVerificationTokenSchema>;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert; // Required for Replit Auth
export type InsertPendingClaim = z.infer<typeof insertPendingClaimSchema>;
export type PendingClaim = typeof pendingClaims.$inferSelect;
export type InsertAdminActivityLog = z.infer<typeof insertAdminActivityLogSchema>;
export type AdminActivityLog = typeof adminActivityLog.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
