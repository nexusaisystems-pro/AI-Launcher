import type { ServerMod } from "@shared/schema";

export function generateSteamLaunchUrl(serverAddress: string, mods: ServerMod[]): string {
  const modParams = mods
    .filter(mod => mod.required)
    .map(mod => `@${mod.id}`)
    .join(";");
  
  const params = new URLSearchParams();
  params.set("connect", serverAddress);
  if (modParams) {
    params.set("mod", modParams);
  }
  
  return `steam://rungameid/221100//${params.toString()}`;
}

export function formatModSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

export function estimateDownloadTime(totalBytes: number, speedMbps = 50): number {
  const speedBytesPerSecond = (speedMbps * 1024 * 1024) / 8;
  const seconds = totalBytes / speedBytesPerSecond;
  return Math.ceil(seconds / 60); // Return minutes
}

export function getWorkshopUrl(workshopId: string): string {
  return `https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`;
}

export function validateServerAddress(address: string): boolean {
  const pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\d{1,5}$/;
  return pattern.test(address);
}

export function parseServerAddress(address: string): { ip: string; port: number } | null {
  if (!validateServerAddress(address)) {
    return null;
  }
  
  const [ip, portStr] = address.split(":");
  const port = parseInt(portStr, 10);
  
  if (port < 1 || port > 65535) {
    return null;
  }
  
  return { ip, port };
}
