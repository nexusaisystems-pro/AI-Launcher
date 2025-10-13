// Update Unknown servers with BattleMetrics map data
import { db } from "./db";
import { servers } from "@shared/schema";
import { battleMetricsService } from "./battlemetrics-service";
import { eq } from "drizzle-orm";

async function updateMapsFromBattleMetrics() {
  console.log('[UpdateMaps] Fetching servers with Unknown maps...');
  
  // Get servers with Unknown maps  
  const unknownServers = await db
    .select()
    .from(servers)
    .where(eq(servers.map, 'Unknown'))
    .limit(100); // Process 100 at a time to avoid overwhelming the API
  
  console.log(`[UpdateMaps] Found ${unknownServers.length} servers with Unknown maps`);
  
  let updated = 0;
  let failed = 0;
  let noMapData = 0;
  
  for (const server of unknownServers) {
    try {
      // Fetch BattleMetrics data for this server
      const bmData = await battleMetricsService.searchServerByAddress(server.address);
      
      if (bmData && bmData.details?.map) {
        // Update server with BattleMetrics map
        await db.update(servers)
          .set({ map: bmData.details.map })
          .where(eq(servers.id, server.id));
        
        console.log(`[UpdateMaps] ✓ ${server.address}: Unknown -> ${bmData.details.map}`);
        updated++;
      } else {
        noMapData++;
      }
      
      // Rate limiting - wait 1.5s between requests
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`[UpdateMaps] ✗ Failed to update ${server.address}:`, error);
      failed++;
    }
  }
  
  console.log(`[UpdateMaps] Complete! Updated: ${updated}, No Map Data: ${noMapData}, Failed: ${failed}`);
  
  // Show new distribution
  const mapCounts = await db
    .select({
      map: servers.map,
      count: db.$count(servers.id)
    })
    .from(servers)
    .groupBy(servers.map);
    
  console.log('[UpdateMaps] New map distribution:');
  for (const { map, count } of mapCounts) {
    console.log(`  ${map}: ${count}`);
  }
}

updateMapsFromBattleMetrics()
  .then(() => {
    console.log('[UpdateMaps] Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[UpdateMaps] Error:', error);
    process.exit(1);
  });
