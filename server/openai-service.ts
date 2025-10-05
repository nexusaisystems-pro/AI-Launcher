import OpenAI from "openai";
import type { Server } from "@shared/schema";

// This is using OpenAI's API with Replit's managed integration
// The newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ServerRecommendation {
  serverAddress: string;
  confidence: number; // 0-1
  reason: string;
  category: "perfect-match" | "hidden-gem" | "similar" | "try-new" | "hot-now";
  highlights: string[];
}

export interface UserProfile {
  favoriteServers: Server[];
  recentServers: Server[];
  preferredMaps: string[];
  avgPing: number;
  modComplexity: "vanilla" | "light" | "medium" | "heavy";
  playstyle: "vanilla" | "modded" | "mixed";
}

export interface RecommendationRequest {
  userProfile: UserProfile;
  availableServers: Server[];
  maxRecommendations?: number;
}

export interface RecommendationResponse {
  recommendations: ServerRecommendation[];
  generatedAt: string;
}

export class OpenAIService {
  private static readonly MODEL = "gpt-4o";
  private static readonly MAX_TOKENS = 4096;

  static async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const { userProfile, availableServers, maxRecommendations = 5 } = request;

    // Build a concise prompt with user context
    const systemPrompt = `You are a DayZ server recommendation expert. Analyze the user's play history and preferences to recommend the best servers from the available options.

Consider:
- Server quality (trust score, uptime, player count trends)
- Match with user preferences (maps, mod count, ping)
- Server popularity vs. hidden gems
- Time of day (recommend populated servers)

Return JSON with this exact structure:
{
  "recommendations": [
    {
      "serverAddress": "ip:port",
      "confidence": 0.95,
      "reason": "one-line explanation",
      "category": "perfect-match" | "hidden-gem" | "similar" | "try-new" | "hot-now",
      "highlights": ["feature 1", "feature 2", "feature 3"]
    }
  ]
}`;

    const userPrompt = this.buildUserPrompt(userProfile, availableServers, maxRecommendations);

    try {
      const response = await openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: this.MAX_TOKENS,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      const result = JSON.parse(content) as { recommendations: ServerRecommendation[] };

      return {
        recommendations: result.recommendations,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static buildUserPrompt(
    profile: UserProfile,
    servers: Server[],
    maxRecs: number
  ): string {
    // Summarize user preferences
    const favSummary = profile.favoriteServers.slice(0, 3).map(s => ({
      name: s.name,
      map: s.map,
      mods: s.mods?.length || 0,
      players: `${s.playerCount}/${s.maxPlayers}`,
      ping: s.ping,
    }));

    const recentSummary = profile.recentServers.slice(0, 3).map(s => ({
      name: s.name,
      map: s.map,
      mods: s.mods?.length || 0,
    }));

    // Summarize available servers (top 50 to keep token count reasonable)
    const serverSummary = servers.slice(0, 50).map(s => ({
      address: s.address,
      name: s.name,
      map: s.map,
      players: `${s.playerCount}/${s.maxPlayers}`,
      ping: s.ping,
      mods: s.mods?.length || 0,
      perspective: s.perspective,
      region: s.region,
      uptime: s.uptime,
      tags: s.tags,
    }));

    return `User Profile:
- Preferred Maps: ${profile.preferredMaps.join(", ") || "any"}
- Avg Ping Tolerance: ${profile.avgPing}ms
- Mod Complexity: ${profile.modComplexity}
- Play Style: ${profile.playstyle}
- Favorite Servers: ${JSON.stringify(favSummary, null, 2)}
- Recent Servers: ${JSON.stringify(recentSummary, null, 2)}

Available Servers (${servers.length} total, showing top 50):
${JSON.stringify(serverSummary, null, 2)}

Please recommend the top ${maxRecs} servers for this user. Focus on:
1. Servers that match their preferred maps and mod complexity
2. Good ping and population
3. Mix of "safe bets" and interesting discoveries
4. Current time consideration (populated servers are better)

Return ${maxRecs} recommendations in the specified JSON format.`;
  }

  static analyzeUserProfile(
    favorites: Server[],
    recents: Server[]
  ): Omit<UserProfile, 'favoriteServers' | 'recentServers'> {
    // Extract preferences from user's server history
    const allServers = [...favorites, ...recents];
    
    if (allServers.length === 0) {
      return {
        preferredMaps: [],
        avgPing: 100,
        modComplexity: "vanilla",
        playstyle: "vanilla",
      };
    }

    // Calculate preferred maps (most common)
    const mapCounts = new Map<string, number>();
    allServers.forEach(s => {
      if (s.map) {
        mapCounts.set(s.map, (mapCounts.get(s.map) || 0) + 1);
      }
    });
    const preferredMaps = Array.from(mapCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([map]) => map);

    // Calculate average ping tolerance
    const pings = allServers.map(s => s.ping).filter((p): p is number => p !== null && p !== undefined);
    const avgPing = pings.length > 0 ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : 100;

    // Determine mod complexity
    const modCounts = allServers.map(s => s.mods?.length || 0);
    const avgMods = modCounts.reduce((a, b) => a + b, 0) / modCounts.length;
    let modComplexity: "vanilla" | "light" | "medium" | "heavy";
    if (avgMods === 0) modComplexity = "vanilla";
    else if (avgMods <= 5) modComplexity = "light";
    else if (avgMods <= 15) modComplexity = "medium";
    else modComplexity = "heavy";

    // Determine playstyle
    const vanillaCount = modCounts.filter(c => c === 0).length;
    const moddedCount = modCounts.filter(c => c > 0).length;
    let playstyle: "vanilla" | "modded" | "mixed";
    if (vanillaCount === 0 && moddedCount > 0) playstyle = "modded";
    else if (moddedCount === 0 && vanillaCount > 0) playstyle = "vanilla";
    else playstyle = "mixed";

    return {
      preferredMaps,
      avgPing,
      modComplexity,
      playstyle,
    };
  }
}
