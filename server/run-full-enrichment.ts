// Run full enrichment for all uncached servers
import { bulkEnrichmentService } from "./bulk-enrichment";
import { storage } from "./storage";
import { serverIntelligence } from "./server-intelligence";

async function runFullEnrichment() {
  console.log("=" .repeat(70));
  console.log("FULL BULK ENRICHMENT - Starting...");
  console.log("=".repeat(70));
  
  try {
    // Check current status
    const allServers = await storage.getServers();
    console.log(`\nTotal servers: ${allServers.length}`);
    
    console.log("\nStarting enrichment process...");
    console.log("This will take approximately 1-2 hours.");
    console.log("Progress will be logged every batch (10 servers).\n");
    
    // Run enrichment
    await bulkEnrichmentService.enrichAllServers(true);
    
    // Get final progress
    const finalProgress = bulkEnrichmentService.getProgress();
    
    console.log("\n" + "=".repeat(70));
    console.log("ENRICHMENT COMPLETE!");
    console.log("=".repeat(70));
    console.log(`\nFinal Statistics:`);
    console.log(`  Total Processed: ${finalProgress.processedServers}`);
    console.log(`  Successful: ${finalProgress.successfulEnrichments}`);
    console.log(`  Failed: ${finalProgress.failedEnrichments}`);
    console.log(`  Success Rate: ${Math.round((finalProgress.successfulEnrichments / finalProgress.processedServers) * 100)}%`);
    
    // Sample quality distribution
    console.log(`\nSampling quality distribution from first 100 servers...`);
    const sampleServers = allServers.slice(0, 100);
    const gradeCount: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    for (const server of sampleServers) {
      const bmData = await storage.getBattleMetricsCache(server.id);
      const quality = serverIntelligence.calculateQualityScore(server, bmData);
      gradeCount[quality.grade] = (gradeCount[quality.grade] || 0) + 1;
    }
    
    console.log(`\nQuality Distribution (100 server sample):`);
    console.log(`  S-grade: ${gradeCount.S}%`);
    console.log(`  A-grade: ${gradeCount.A}%`);
    console.log(`  B-grade: ${gradeCount.B}%`);
    console.log(`  C-grade: ${gradeCount.C}%`);
    console.log(`  D-grade: ${gradeCount.D}%`);
    console.log(`  F-grade: ${gradeCount.F}%`);
    
    if (finalProgress.errors.length > 0 && finalProgress.errors.length <= 10) {
      console.log(`\nErrors encountered:`);
      finalProgress.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    } else if (finalProgress.errors.length > 10) {
      console.log(`\nTotal errors: ${finalProgress.errors.length} (showing first 10):`);
      finalProgress.errors.slice(0, 10).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    console.log("\n" + "=".repeat(70));
    
  } catch (error) {
    console.error("\nFatal error during enrichment:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

runFullEnrichment();
