// One-time script to fix map names for all existing servers
import { db } from "./db";
import { servers } from "@shared/schema";
import { detectMapFromServerName } from "./map-detector";
import { eq } from "drizzle-orm";

async function fixMaps() {
  console.log('[FixMaps] Starting map detection for all servers...');
  
  // Get all servers
  const allServers = await db.select().from(servers);
  console.log(`[FixMaps] Found ${allServers.length} servers to process`);
  
  let updated = 0;
  let unchanged = 0;
  
  for (const server of allServers) {
    const detectedMap = detectMapFromServerName(server.name, server.map || undefined);
    
    if (detectedMap !== server.map) {
      await db.update(servers)
        .set({ map: detectedMap })
        .where(eq(servers.id, server.id));
      
      console.log(`[FixMaps] Updated ${server.address}: ${server.map || 'null'} -> ${detectedMap}`);
      updated++;
    } else {
      unchanged++;
    }
  }
  
  console.log(`[FixMaps] Complete! Updated: ${updated}, Unchanged: ${unchanged}`);
  
  // Show distribution
  const mapCounts = await db
    .select({
      map: servers.map,
      count: db.$count(servers.id)
    })
    .from(servers)
    .groupBy(servers.map);
    
  console.log('[FixMaps] Map distribution:');
  for (const { map, count } of mapCounts) {
    console.log(`  ${map}: ${count}`);
  }
}

fixMaps()
  .then(() => {
    console.log('[FixMaps] Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[FixMaps] Error:', error);
    process.exit(1);
  });
