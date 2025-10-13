import type { EnrichedMod } from '@shared/schema';
import type { SteamWorkshopItem } from './steam-workshop-service';

export class ModClassifier {
  private readonly MAP_TAGS = [
    'map',
    'maps',
    'terrain',
    'island',
    'chernarus',
    'livonia',
    'namalsk',
    'sakhal',
    'esseker',
    'banov',
    'takistan',
    'deer isle',
    'valning',
    'expansion',
  ];

  private readonly MAP_CATEGORIES = [
    'Map',
    'Maps',
    'Terrain',
    'Island',
    'World',
  ];

  isMapMod(workshopItem: SteamWorkshopItem): boolean {
    const tags = workshopItem.tags?.map(t => t.tag.toLowerCase()) || [];
    const title = workshopItem.title.toLowerCase();
    const description = workshopItem.description.toLowerCase();

    // Check tags first (most reliable)
    const hasMapTag = tags.some(tag => 
      this.MAP_TAGS.some(mapTag => tag.includes(mapTag))
    );

    if (hasMapTag) {
      return true;
    }

    // Check title for map indicators
    const titleHasMapIndicator = this.MAP_TAGS.some(mapTag => 
      title.includes(mapTag)
    );

    if (titleHasMapIndicator) {
      return true;
    }

    // Check description for strong map indicators (be conservative)
    const descriptionWords = description.split(/\s+/);
    const hasStrongMapIndicator = descriptionWords.some(word => 
      ['map', 'terrain', 'island'].includes(word)
    );

    return hasStrongMapIndicator;
  }

  classifyMod(workshopItem: SteamWorkshopItem): EnrichedMod {
    const tags = workshopItem.tags?.map(t => t.tag) || [];
    const isMap = this.isMapMod(workshopItem);

    // Determine category from tags
    let category = 'Unknown';
    if (isMap) {
      category = 'Map';
    } else if (tags.some(t => ['weapon', 'gun', 'firearms'].includes(t.toLowerCase()))) {
      category = 'Weapons';
    } else if (tags.some(t => ['vehicle', 'car', 'helicopter'].includes(t.toLowerCase()))) {
      category = 'Vehicles';
    } else if (tags.some(t => ['clothing', 'gear', 'equipment'].includes(t.toLowerCase()))) {
      category = 'Gear';
    } else if (tags.some(t => ['building', 'base'].includes(t.toLowerCase()))) {
      category = 'Building';
    }

    return {
      workshopId: workshopItem.publishedfileid,
      name: workshopItem.title,
      isMap,
      category,
      tags,
      fileSize: workshopItem.file_size,
      previewUrl: workshopItem.preview_url,
      subscriberCount: workshopItem.subscriptions || workshopItem.lifetime_subscriptions || 0,
    };
  }

  classifyMods(workshopItems: SteamWorkshopItem[]): EnrichedMod[] {
    return workshopItems.map(item => this.classifyMod(item));
  }

  extractMapModsFromEnriched(enrichedMods: EnrichedMod[]): EnrichedMod[] {
    return enrichedMods.filter(mod => mod.isMap);
  }

  detectMapFromEnrichedMods(enrichedMods: EnrichedMod[]): string | null {
    const mapMods = this.extractMapModsFromEnriched(enrichedMods);
    
    if (mapMods.length === 0) {
      return null;
    }

    // Return the first map mod's name (servers typically have one primary map)
    return mapMods[0].name;
  }
}

export const modClassifier = new ModClassifier();
