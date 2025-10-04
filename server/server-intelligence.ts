import type { Server, BattleMetricsCache } from "@shared/schema";

export interface TrustIndicators {
  uptime7d: number | null;
  rank: number | null;
  trend: "rising" | "stable" | "declining" | "unknown";
  playerConsistency: number;
  a2sVsBmMatch: number;
}

export interface QualityScore {
  score: number; // 0-100
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  verified: boolean;
  trustIndicators: TrustIndicators;
  fraudFlags: FraudFlag[];
}

export interface FraudFlag {
  type: "INFLATED_PLAYERS" | "FALSE_UPTIME" | "SUSPICIOUS_RANK" | "BM_MISMATCH";
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
          playerConsistency: 0,
          a2sVsBmMatch: 0,
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

    // Factor 3: Player Count Consistency (20% weight)
    // Check if A2S player count is reasonably close to BM expected ranges
    const a2sPlayers = server.playerCount || 0;
    const bmMaxPlayers = bmData.maxPlayerCount || server.maxPlayers || 100;
    const bmAvgPlayers = bmData.avgPlayerCount7d || 0;

    if (a2sPlayers > bmMaxPlayers * 1.2) {
      // A2S reports more players than max capacity
      score -= 20;
    } else if (bmAvgPlayers > 0 && Math.abs(a2sPlayers - bmAvgPlayers) < bmAvgPlayers * 0.5) {
      // A2S is within reasonable range of BM average
      // Small bonus for consistency
    } else if (a2sPlayers > bmMaxPlayers) {
      score -= 10;
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

    // Flag 1: Inflated player counts
    const a2sPlayers = server.playerCount || 0;
    const bmCurrentPlayers = bmData.details?.players ?? null;
    const bmMaxPlayers = bmData.maxPlayerCount || server.maxPlayers || 100;

    if (bmCurrentPlayers !== null && a2sPlayers > bmCurrentPlayers * 1.5 && a2sPlayers > 5) {
      flags.push({
        type: "INFLATED_PLAYERS",
        severity: "high",
        evidence: `A2S reports ${a2sPlayers} players, BattleMetrics shows ${bmCurrentPlayers}`,
      });
    }

    // Flag 2: A2S claims more players than max capacity
    if (a2sPlayers > bmMaxPlayers * 1.2) {
      flags.push({
        type: "INFLATED_PLAYERS",
        severity: "medium",
        evidence: `A2S reports ${a2sPlayers}/${server.maxPlayers} but BM max is ${bmMaxPlayers}`,
      });
    }

    // Flag 3: Server claims 100% uptime but BM shows it's new
    if (server.uptime === 100 && bmData.details?.createdAt) {
      const ageMs = Date.now() - new Date(bmData.details.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays < 7) {
        flags.push({
          type: "SUSPICIOUS_RANK",
          severity: "low",
          evidence: `Server claims 100% uptime but only tracked for ${ageDays.toFixed(1)} days`,
        });
      }
    }

    // Flag 4: Very high rank but claims to be established
    if (bmData.rank && bmData.rank > 80000) {
      if (server.uptime && server.uptime > 95) {
        flags.push({
          type: "BM_MISMATCH",
          severity: "low",
          evidence: `High BattleMetrics rank (${bmData.rank}) inconsistent with claimed uptime`,
        });
      }
    }

    return flags;
  }

  private buildTrustIndicators(server: Server, bmData: BattleMetricsCache): TrustIndicators {
    // Calculate player consistency
    const a2sPlayers = server.playerCount || 0;
    const bmAvgPlayers = bmData.avgPlayerCount7d || 0;
    
    let playerConsistency = 0;
    if (bmAvgPlayers > 0) {
      const diff = Math.abs(a2sPlayers - bmAvgPlayers);
      playerConsistency = Math.max(0, 100 - (diff / bmAvgPlayers) * 100);
    }

    // Calculate A2S vs BM match
    const bmCurrentPlayers = bmData.details?.players ?? null;
    let a2sVsBmMatch = 0;
    if (bmCurrentPlayers !== null) {
      const maxDiff = Math.max(a2sPlayers, bmCurrentPlayers) || 1;
      const diff = Math.abs(a2sPlayers - bmCurrentPlayers);
      a2sVsBmMatch = Math.max(0, 100 - (diff / maxDiff) * 100);
    }

    return {
      uptime7d: bmData.uptimePercent7d,
      rank: bmData.rank,
      trend: this.calculateTrend(bmData),
      playerConsistency: Math.round(playerConsistency),
      a2sVsBmMatch: Math.round(a2sVsBmMatch),
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
