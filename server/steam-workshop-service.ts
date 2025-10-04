import type { InsertWorkshopMod } from '@shared/schema';

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const WORKSHOP_API_URL = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/';

export interface SteamWorkshopResponse {
  response: {
    result: number;
    resultcount: number;
    publishedfiledetails: SteamWorkshopItem[];
  };
}

export interface SteamWorkshopItem {
  publishedfileid: string;
  result: number;
  creator: string;
  creator_appid: number;
  consumer_appid: number;
  filename: string;
  file_size: number;
  preview_url: string;
  hcontent_preview: string;
  title: string;
  description: string;
  time_created: number;
  time_updated: number;
  visibility: number;
  banned: number;
  ban_reason: string;
  subscriptions: number;
  favorited: number;
  lifetime_subscriptions: number;
  lifetime_favorited: number;
  views: number;
  tags?: Array<{
    tag: string;
  }>;
}

export class SteamWorkshopService {
  async getWorkshopItemDetails(workshopIds: string[]): Promise<InsertWorkshopMod[]> {
    if (!STEAM_API_KEY) {
      console.error('STEAM_API_KEY is not configured');
      return [];
    }

    if (workshopIds.length === 0) {
      return [];
    }

    try {
      const formData = new URLSearchParams();
      formData.append('itemcount', workshopIds.length.toString());
      
      workshopIds.forEach((id, index) => {
        formData.append(`publishedfileids[${index}]`, id);
      });

      const response = await fetch(WORKSHOP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        console.error(`Steam API returned ${response.status}: ${response.statusText}`);
        return [];
      }

      const data: SteamWorkshopResponse = await response.json();

      if (!data.response || !data.response.publishedfiledetails) {
        console.error('Invalid response from Steam API');
        return [];
      }

      return data.response.publishedfiledetails
        .filter(item => item.result === 1)
        .map(item => this.mapToWorkshopMod(item));
    } catch (error) {
      console.error('Error fetching workshop item details:', error);
      return [];
    }
  }

  async getWorkshopItemDetail(workshopId: string): Promise<InsertWorkshopMod | null> {
    const results = await this.getWorkshopItemDetails([workshopId]);
    return results.length > 0 ? results[0] : null;
  }

  private mapToWorkshopMod(item: SteamWorkshopItem): InsertWorkshopMod {
    return {
      workshopId: item.publishedfileid,
      title: item.title,
      description: item.description,
      fileSize: item.file_size,
      previewUrl: item.preview_url,
      timeCreated: item.time_created,
      timeUpdated: item.time_updated,
      tags: item.tags?.map(t => t.tag) || [],
      creator: item.creator,
      subscriberCount: item.subscriptions || item.lifetime_subscriptions || 0,
    };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  }
}

export const steamWorkshopService = new SteamWorkshopService();
