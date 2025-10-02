import { db } from "./db";
import { servers, type InsertServer } from "@shared/schema";

async function seed() {
  console.log("Seeding database with sample servers...");

  const sampleServers: InsertServer[] = [
    {
      address: "185.23.67.142:2302",
      name: "DayZ Europa | Hardcore Survival | Namalsk",
      map: "Namalsk",
      playerCount: 47,
      maxPlayers: 60,
      ping: 23,
      passwordProtected: false,
      perspective: "1PP",
      region: "EU",
      version: "1.23.159565",
      mods: [
        { id: "cf", name: "CF (Community Framework)", workshopId: "1559212036", size: 125 * 1024 * 1024, required: true, installed: true },
        { id: "expansion", name: "DayZ-Expansion-Core", workshopId: "2291785437", size: 892 * 1024 * 1024, required: true, installed: true },
        { id: "scopes", name: "Advanced Weapon Scopes", workshopId: "2143128974", size: 234 * 1024 * 1024, required: true, installed: false },
      ],
      queue: 2,
      verified: true,
      restartSchedule: "Every 4 hours",
      uptime: 99,
      tags: ["hardcore", "survival"],
      lastWipe: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      address: "92.114.23.89:2402",
      name: "Project X | PvP | Traders | High Loot | Chernarus",
      map: "Chernarus",
      playerCount: 89,
      maxPlayers: 100,
      ping: 78,
      passwordProtected: false,
      perspective: "3PP",
      region: "NA-EAST",
      version: "1.23.159565",
      mods: [
        { id: "traders", name: "Trader Mod", workshopId: "1590841260", size: 45 * 1024 * 1024, required: true, installed: true },
      ],
      queue: 0,
      verified: false,
      uptime: 95,
      tags: ["pvp", "traders", "high-loot"],
    },
    {
      address: "45.138.50.214:2302",
      name: "Vanilla Survival | Fresh Wipe | Livonia | No KOS Safe Zones",
      map: "Livonia",
      playerCount: 34,
      maxPlayers: 80,
      ping: 31,
      passwordProtected: false,
      perspective: "1PP",
      region: "EU",
      version: "1.23.159565",
      mods: [],
      queue: 0,
      verified: true,
      uptime: 98,
      tags: ["vanilla", "fresh-wipe", "safe-zones"],
      lastWipe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  await db.insert(servers).values(sampleServers).onConflictDoNothing();

  console.log(`✅ Seeded ${sampleServers.length} servers`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
