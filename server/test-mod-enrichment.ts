import { storage } from './storage';
import { battleMetricsService } from './battlemetrics-service';
import { steamWorkshopService } from './steam-workshop-service';
import { modClassifier } from './mod-classifier';

async function testModEnrichment() {
  console.log('Testing mod enrichment pipeline...\n');

  // Get a server with mods
  const servers = await storage.getServers();
  const serverWithMods = servers.find(s => s.mods && s.mods.length > 0);

  if (!serverWithMods) {
    console.log('No servers with mods found');
    process.exit(0);
  }

  console.log(`Testing with server: ${serverWithMods.name}`);
  console.log(`Address: ${serverWithMods.address}`);
  console.log(`Current map: ${serverWithMods.map || 'Unknown'}`);
  console.log(`Mod count: ${serverWithMods.mods.length}\n`);

  // Get server details from BattleMetrics
  const serverDetails = await battleMetricsService.getServerDetails(serverWithMods.address);

  if (!serverDetails) {
    console.log('Failed to get server details from BattleMetrics');
    process.exit(1);
  }

  console.log(`Workshop IDs found: ${serverDetails.workshopIds?.length || 0}`);
  if (serverDetails.workshopIds && serverDetails.workshopIds.length > 0) {
    console.log('Workshop IDs:', serverDetails.workshopIds.slice(0, 5).join(', ') + (serverDetails.workshopIds.length > 5 ? '...' : ''));
  }

  // Enrich mods with Workshop data
  if (serverDetails.workshopIds && serverDetails.workshopIds.length > 0) {
    console.log('\nFetching Workshop metadata...');
    const workshopModData = await steamWorkshopService.getWorkshopItemDetails(serverDetails.workshopIds);
    console.log(`Got metadata for ${workshopModData.length} mods`);

    // Convert to SteamWorkshopItem format
    const workshopItems = workshopModData.map(mod => ({
      publishedfileid: mod.workshopId,
      result: 1,
      creator: mod.creator || '',
      creator_appid: 221100,
      consumer_appid: 221100,
      filename: '',
      file_size: mod.fileSize || 0,
      preview_url: mod.previewUrl || '',
      hcontent_preview: '',
      title: mod.title || '',
      description: mod.description || '',
      time_created: mod.timeCreated || 0,
      time_updated: mod.timeUpdated || 0,
      visibility: 0,
      banned: 0,
      ban_reason: '',
      subscriptions: mod.subscriberCount || 0,
      favorited: 0,
      lifetime_subscriptions: mod.subscriberCount || 0,
      lifetime_favorited: 0,
      views: 0,
      tags: mod.tags?.map(tag => ({ tag: String(tag) })) || [],
    }));

    // Classify mods
    const enrichedMods = modClassifier.classifyMods(workshopItems);
    console.log(`\nClassified ${enrichedMods.length} mods`);

    // Find map mods
    const mapMods = enrichedMods.filter(m => m.isMap);
    console.log(`Found ${mapMods.length} map mod(s):`);
    mapMods.forEach(mod => {
      console.log(`  - ${mod.name} (${mod.workshopId})`);
    });

    // Detect map
    const detectedMap = modClassifier.detectMapFromEnrichedMods(enrichedMods);
    console.log(`\nDetected map: ${detectedMap || 'None'}`);

    // Show category distribution
    const categories = enrichedMods.reduce((acc, mod) => {
      acc[mod.category || 'Unknown'] = (acc[mod.category || 'Unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('\nCategory distribution:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

    // Test update
    console.log('\nTesting database update...');
    await storage.updateServer(serverWithMods.address, {
      modList: enrichedMods,
      map: detectedMap || serverWithMods.map,
    });
    console.log('✓ Successfully updated server with enriched mod data');

    // Verify update
    const updated = await storage.getServer(serverWithMods.address);
    console.log(`\nVerification:`);
    console.log(`  modList length: ${updated?.modList?.length || 0}`);
    console.log(`  Updated map: ${updated?.map}`);
  } else {
    console.log('\nNo Workshop IDs found for this server');
  }

  console.log('\nTest complete!');
  process.exit(0);
}

testModEnrichment().catch(console.error);
