import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DesktopContextType {
  isDesktop: boolean;
  steamPath: string | null;
  dayzPath: string | null;
  steamAvailable: boolean;
  authToken: string | null;
  authUser: any | null;
  getInstalledMods: () => Promise<InstalledMod[]>;
  launchServer: (data: LaunchServerData) => Promise<LaunchResult>;
  subscribeToMods: (modIds: number[]) => Promise<SubscribeResult>;
  openLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

interface InstalledMod {
  workshopId: string;
  name: string;
  path: string;
  size: number;
}

interface LaunchServerData {
  serverAddress: string;
  requiredMods: Array<{
    name: string;
    steamWorkshopId: number;
  }>;
}

interface LaunchResult {
  canLaunch: boolean;
  missingMods?: Array<{
    name: string;
    steamWorkshopId: number;
  }>;
  error?: string;
}

interface SubscribeResult {
  success: boolean;
  error?: string;
}

const DesktopContext = createContext<DesktopContextType>({
  isDesktop: false,
  steamPath: null,
  dayzPath: null,
  steamAvailable: false,
  authToken: null,
  authUser: null,
  getInstalledMods: async () => [],
  launchServer: async () => ({ canLaunch: false }),
  subscribeToMods: async () => ({ success: false }),
  openLogin: async () => {},
  logout: async () => {}
});

export function DesktopProvider({ children }: { children: ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [steamPath, setSteamPath] = useState<string | null>(null);
  const [dayzPath, setDayzPath] = useState<string | null>(null);
  const [steamAvailable, setSteamAvailable] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);

  useEffect(() => {
    // Check if running in Electron
    if (window.electronAPI) {
      setIsDesktop(true);
      
      // Listen for desktop ready event
      window.electronAPI.onDesktopReady((data: any) => {
        setSteamPath(data.steamPath);
        setDayzPath(data.dayzPath);
        setSteamAvailable(data.steamAvailable);
        console.log('[Desktop] Ready:', data);
      });

      // Listen for auth success
      window.electronAPI.onAuthSuccess((data: any) => {
        setAuthToken(data.token);
        setAuthUser(data.user);
        console.log('[Desktop] Auth success:', data.user);
      });

      // Load stored auth on startup
      window.electronAPI.getAuthToken().then(setAuthToken);
      window.electronAPI.getAuthUser().then(setAuthUser);
    }
  }, []);

  const getInstalledMods = async (): Promise<InstalledMod[]> => {
    if (!window.electronAPI) return [];
    return window.electronAPI.getInstalledMods();
  };

  const launchServer = async (data: LaunchServerData): Promise<LaunchResult> => {
    if (!window.electronAPI) {
      return { canLaunch: false, error: 'Not running in desktop mode' };
    }
    return window.electronAPI.launchServer(data);
  };

  const subscribeToMods = async (modIds: number[]): Promise<SubscribeResult> => {
    if (!window.electronAPI) {
      return { success: false, error: 'Not running in desktop mode' };
    }
    return window.electronAPI.subscribeToMods({ modIds });
  };

  const openLogin = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.openLogin();
  };

  const logout = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.logout();
    setAuthToken(null);
    setAuthUser(null);
  };

  return (
    <DesktopContext.Provider
      value={{
        isDesktop,
        steamPath,
        dayzPath,
        steamAvailable,
        authToken,
        authUser,
        getInstalledMods,
        launchServer,
        subscribeToMods,
        openLogin,
        logout
      }}
    >
      {children}
    </DesktopContext.Provider>
  );
}

export function useDesktop() {
  return useContext(DesktopContext);
}

// Type definitions for window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      isDesktop: boolean;
      getInstalledMods: () => Promise<InstalledMod[]>;
      launchServer: (data: LaunchServerData) => Promise<LaunchResult>;
      subscribeToMods: (data: { modIds: number[] }) => Promise<SubscribeResult>;
      getSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<any>;
      getAuthToken: () => Promise<string | null>;
      getAuthUser: () => Promise<any | null>;
      openLogin: () => Promise<void>;
      logout: () => Promise<void>;
      onDesktopReady: (callback: (data: any) => void) => void;
      onAuthSuccess: (callback: (data: any) => void) => void;
      onDeepLinkJoin: (callback: (data: any) => void) => void;
    };
  }
}
