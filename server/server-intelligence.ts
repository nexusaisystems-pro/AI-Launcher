import type { Server, BattleMetricsCache } from "@shared/schema";

export interface TrustIndicators {
  uptime7d: number | null;
  rank: number | null;
  trend: "rising" | "stable" | "declining" | "unknown";
  playerActivity: number;
  serverAge: number | null;
}

export interface QualityScore {
  score: number; // 0-100
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  verified: boolean;
  trustIndicators: TrustIndicators;
  fraudFlags: FraudFlag[];
}

export interface FraudFlag {
  type: "SUSPICIOUS_RANK" | "LOW_UPTIME" | "NEW_SERVER" | "INCONSISTENT_DATA";
  severity: "high" | "medium" | "low";
  evidence: string;
}

export class ServerIntelligence {
  calculateQualityScore(server: Server, bmData?: BattleMetricsCache | null): QualityScore {
    if (!bmData) {
      return {
        score: 50,
        grade: "C",
        verified: false,
        trustIndicators: {
          uptime7d: null,
          rank: null,
          trend: "unknown",
          playerActivity: 0,
          serverAge: null,
        },
        fraudFlags: [],
      };
    }

    const fraudFlags = this.detectFraud(server, bmData);
    const trustScore = this.calculateTrustScore(server, bmData, fraudFlags);

    return {
      score: trustScore,
      grade: this.scoreToGrade(trustScore),
      verified: fraudFlags.length === 0 && trustScore >= 70,
      trustIndicators: this.buildTrustIndicators(server, bmData),
      fraudFlags,
    };
  }

  private calculateTrustScore(
    server: Server,
    bmData: BattleMetricsCache,
    fraudFlags: FraudFlag[]
  ): number {
    let score = 100;

    // Check BM cache freshness - reduce penalties for stale data
    const cacheAge = bmData.cachedAt 
      ? Date.now() - new Date(bmData.cachedAt).getTime()
      : Infinity;
    const FRESH_CACHE_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours
    const cacheFreshnessFactor = cacheAge < FRESH_CACHE_THRESHOLD ? 1.0 : 0.5; // Half penalties for stale cache

    // Penalty for fraud flags (reduced for stale BM data)
    fraudFlags.forEach(flag => {
      let penalty = 0;
      switch (flag.severity) {
        case "high":
          penalty = 30;
          break;
        case "medium":
          penalty = 15;
          break;
        case "low":
          penalty = 5;
          break;
      }
      score -= Math.floor(penalty * cacheFreshnessFactor);
    });

    // Factor 1: BattleMetrics Rank (40% weight)
    // Lower rank is better (rank 1 is best)
    // Scale: rank < 1000 = 40pts, rank < 10000 = 30pts, rank < 50000 = 20pts, else 10pts
    if (bmData.rank) {
      if (bmData.rank < 1000) {
        score += 0; // Already at 100, no boost
      } else if (bmData.rank < 10000) {
        score -= 10;
      } else if (bmData.rank < 50000) {
        score -= 20;
      } else {
        score -= 30;
      }
    }

    // Factor 2: Server Status (20% weight)
    if (bmData.status === "online") {
      // No penalty for online servers
    } else {
      score -= 20;
    }

    // Factor 3: Player Activity (20% weight)
    // Use BattleMetrics player data to assess activity
    const bmCurrentPlayers = bmData.details?.players ?? 0;
    const bmMaxPlayers = bmData.maxPlayerCount || server.maxPlayers || 100;
    const bmAvgPlayers = bmData.avgPlayerCount7d || 0;

    if (bmAvgPlayers > 0) {
      // Server has consistent player activity
      const activityRatio = bmAvgPlayers / bmMaxPlayers;
      if (activityRatio > 0.5) {
        // High activity server (>50% capacity on average)
        // No penalty
      } else if (activityRatio > 0.2) {
        // Medium activity
        score -= 5;
      } else {
        // Low activity
        score -= 10;
      }
    } else if (bmCurrentPlayers === 0) {
      // Empty server
      score -= 15;
    }

    // Factor 4: Location Data Available (10% weight)
    if (bmData.country && bmData.cityName) {
      // Bonus for having complete location data (sign of legitimate server)
    } else {
      score -= 10;
    }

    // Factor 5: BattleMetrics Age (10% weight)
    // Servers tracked longer are more trustworthy
    if (bmData.details?.createdAt) {
      const ageMs = Date.now() - new Date(bmData.details.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays > 90) {
        // Server tracked for 3+ months, bonus points
      } else if (ageDays > 30) {
        // 1-3 months
        score -= 5;
      } else if (ageDays > 7) {
        // 1 week - 1 month
        score -= 10;
      } else {
        // Less than 1 week - suspicious
        score -= 15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private detectFraud(server: Server, bmData: BattleMetricsCache): FraudFlag[] {
    const flags: FraudFlag[] = [];

    // Flag 1: Very low uptime indicates unreliable server
    if (bmData.uptimePercent7d !== null && bmData.uptimePercent7d < 80) {
      flags.push({
        type: "LOW_UPTIME",
        severity: "medium",
        evidence: `Server uptime only ${bmData.uptimePercent7d.toFixed(1)}% over last 7 days`,
      });
    }

    // Flag 2: Server is very new (less than 7 days old)
    if (bmData.details?.createdAt) {
      const ageMs = Date.now() - new Date(bmData.details.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays < 7) {
        flags.push({
          type: "NEW_SERVER",
          severity: "low",
          evidence: `Server only tracked for ${ageDays.toFixed(1)} days on BattleMetrics`,
        });
      }
    }

    // Flag 3: Very poor rank suggests low quality
    if (bmData.rank && bmData.rank > 100000) {
      flags.push({
        type: "SUSPICIOUS_RANK",
        severity: "low",
        evidence: `Very poor BattleMetrics rank (${bmData.rank.toLocaleString()})`,
      });
    }

    // Flag 4: Inconsistent data (offline status with players)
    const bmCurrentPlayers = bmData.details?.players ?? 0;
    if (bmData.status !== "online" && bmCurrentPlayers > 0) {
      flags.push({
        type: "INCONSISTENT_DATA",
        severity: "medium",
        evidence: `Server marked as ${bmData.status} but shows ${bmCurrentPlayers} players`,
      });
    }

    return flags;
  }

  private buildTrustIndicators(server: Server, bmData: BattleMetricsCache): TrustIndicators {
    // Calculate player activity based on BattleMetrics data
    const bmAvgPlayers = bmData.avgPlayerCount7d || 0;
    const bmMaxPlayers = bmData.maxPlayerCount || server.maxPlayers || 100;
    
    let playerActivity = 0;
    if (bmMaxPlayers > 0 && bmAvgPlayers > 0) {
      playerActivity = Math.round((bmAvgPlayers / bmMaxPlayers) * 100);
    }

    // Calculate server age in days
    let serverAge: number | null = null;
    if (bmData.details?.createdAt) {
      const ageMs = Date.now() - new Date(bmData.details.createdAt).getTime();
      serverAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }

    return {
      uptime7d: bmData.uptimePercent7d,
      rank: bmData.rank,
      trend: this.calculateTrend(bmData),
      playerActivity: Math.min(100, playerActivity),
      serverAge,
    };
  }

  private calculateTrend(bmData: BattleMetricsCache): "rising" | "stable" | "declining" | "unknown" {
    // For Phase 2, we don't have historical data yet
    // This will be enhanced in Phase 3 with time-series analysis
    
    // Simple heuristic: if rank is very good, assume stable/rising
    if (bmData.rank && bmData.rank < 5000) {
      return "rising";
    }
    
    // If recent activity matches expectations, stable
    if (bmData.status === "online" && bmData.details?.players !== undefined) {
      return "stable";
    }

    return "unknown";
  }

  private scoreToGrade(score: number): "S" | "A" | "B" | "C" | "D" | "F" {
    if (score >= 95) return "S";
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 55) return "C";
    if (score >= 40) return "D";
    return "F";
  }

  formatQualityBadge(quality: QualityScore): string {
    const gradeEmojis = {
      S: "🏆",
      A: "⭐",
      B: "✓",
      C: "○",
      D: "△",
      F: "⚠",
    };

    return `${gradeEmojis[quality.grade]} Grade ${quality.grade} (${quality.score}/100)`;
  }
}

export const serverIntelligence = new ServerIntelligence();
