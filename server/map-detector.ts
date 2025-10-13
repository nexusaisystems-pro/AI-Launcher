// Map detection utility for extracting map names from server names
// Since A2S and BattleMetrics don't provide reliable map data,
// we extract it from server names where servers typically include the map

const MAP_KEYWORDS: Record<string, string[]> = {
  'Chernarus': ['chernarus', 'cherno', 'chernarusplus', 'chernarus+'],
  'Livonia': ['livonia'],
  'Namalsk': ['namalsk'],
  'Deer Isle': ['deer isle', 'deerisle'],
  'Esseker': ['esseker'],
  'Takistan': ['takistan'],
  'Banov': ['banov'],
  'Rostow': ['rostow'],
  'Sakhal': ['sakhal'],
  'DeerIsle': ['deerisle'],
  'Enoch': ['enoch'],
  'ChernarusPlusBanovDLCEnochLivonia': ['chernarusplus', 'banov', 'enoch', 'livonia'],
};

export function detectMapFromServerName(serverName: string, existingMap?: string): string {
  // If existing map is already set and not "Unknown", keep it
  if (existingMap && existingMap !== 'Unknown' && existingMap.trim() !== '') {
    return existingMap;
  }

  const nameLower = serverName.toLowerCase();
  
  // Check each map and its keywords
  for (const [mapName, keywords] of Object.entries(MAP_KEYWORDS)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return mapName;
      }
    }
  }
  
  return 'Unknown';
}

export function getAllKnownMaps(): string[] {
  return Object.keys(MAP_KEYWORDS);
}
