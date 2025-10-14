const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const Store = require('electron-store');

// Initialize settings store (like DZSA's settings.json)
const store = new Store({
  defaults: {
    dayzPath: null,
    steamPath: null,
    favorites: [],
    latestJoined: [],
    additionalParameters: ''
  }
});

let mainWindow;
let steamworks;

// Initialize Steamworks if available
function initSteam() {
  try {
    steamworks = require('steamworks.js');
    const client = steamworks.init(221100); // DayZ App ID
    console.log('[Steam] Initialized successfully');
    return client;
  } catch (error) {
    console.log('[Steam] Not available or not logged in:', error.message);
    return null;
  }
}

// Detect Steam installation path
function detectSteamPath() {
  const commonPaths = [
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
    process.env.PROGRAMFILES + '\\Steam',
    process.env['PROGRAMFILES(X86)'] + '\\Steam'
  ];

  for (const steamPath of commonPaths) {
    if (fs.existsSync(steamPath)) {
      store.set('steamPath', steamPath);
      return steamPath;
    }
  }

  return null;
}

// Detect DayZ installation path
function detectDayZPath(steamPath) {
  if (!steamPath) return null;

  const dayzPath = path.join(steamPath, 'steamapps', 'common', 'DayZ');
  
  if (fs.existsSync(dayzPath)) {
    store.set('dayzPath', dayzPath);
    return dayzPath;
  }

  return null;
}

// Scan installed mods from Steam Workshop
function scanInstalledMods(steamPath) {
  if (!steamPath) return [];

  const workshopPath = path.join(steamPath, 'steamapps', 'workshop', 'content', '221100');
  
  if (!fs.existsSync(workshopPath)) {
    return [];
  }

  try {
    const mods = [];
    const modFolders = fs.readdirSync(workshopPath);

    for (const workshopId of modFolders) {
      const modPath = path.join(workshopPath, workshopId);
      const stat = fs.statSync(modPath);

      if (stat.isDirectory()) {
        // Try to read mod.cpp or meta.cpp for mod name
        let modName = `Mod_${workshopId}`;
        
        const metaFiles = ['mod.cpp', 'meta.cpp', 'addons/mod.cpp'];
        for (const metaFile of metaFiles) {
          const metaPath = path.join(modPath, metaFile);
          if (fs.existsSync(metaPath)) {
            try {
              const content = fs.readFileSync(metaPath, 'utf8');
              const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
              if (nameMatch) {
                modName = nameMatch[1];
                break;
              }
            } catch (e) {
              // Continue with default name
            }
          }
        }

        mods.push({
          workshopId,
          name: modName,
          path: modPath,
          size: getFolderSize(modPath)
        });
      }
    }

    return mods;
  } catch (error) {
    console.error('[Mods] Error scanning:', error);
    return [];
  }
}

// Get folder size
function getFolderSize(folderPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        totalSize += getFolderSize(filePath);
      } else {
        totalSize += stat.size;
      }
    }
  } catch (error) {
    // Skip errors
  }
  
  return totalSize;
}

// Launch DayZ with mods
function launchDayZ(serverAddress, requiredMods) {
  const steamPath = store.get('steamPath');
  const installedMods = scanInstalledMods(steamPath);
  
  // Build mod paths from installed mods
  const modPaths = requiredMods.map(reqMod => {
    const installed = installedMods.find(m => m.workshopId === reqMod.steamWorkshopId.toString());
    if (installed) {
      // Use actual installed path
      return `${steamPath}/steamapps/workshop/content/221100/${installed.workshopId}`;
    }
    // Fallback to workshop ID if not found in scan
    return `${steamPath}/steamapps/workshop/content/221100/${reqMod.steamWorkshopId}`;
  });
  
  const modString = modPaths.join(';');
  const additionalParams = store.get('additionalParameters', '');
  
  // Build launch command
  const params = [
    `-mod=${modString}`,
    `-connect=${serverAddress}`,
    additionalParams
  ].filter(Boolean).join(' ');

  // Launch via Steam protocol
  const launchUrl = `steam://run/221100//${params}`;
  
  console.log('[Launch]', launchUrl);
  console.log('[Launch] Mod paths:', modPaths);
  
  const command = process.platform === 'win32' 
    ? `start "" "${launchUrl}"`
    : `open "${launchUrl}"`;
    
  exec(command, (error) => {
    if (error) {
      console.error('[Launch] Error:', error);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'GameHub Launcher'
  });

  // In development, load from dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    // __dirname resolves correctly both in dev and when packaged
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    
    console.log('[Desktop] Loading from:', indexPath);
    console.log('[Desktop] __dirname:', __dirname);
    console.log('[Desktop] File exists:', fs.existsSync(indexPath));
    
    mainWindow.loadFile(indexPath);
  }

  // Initialize Steam
  const steam = initSteam();
  
  // Detect paths
  const steamPath = detectSteamPath();
  const dayzPath = detectDayZPath(steamPath);

  console.log('[Desktop] Steam path:', steamPath);
  console.log('[Desktop] DayZ path:', dayzPath);

  // Send desktop info to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('desktop-ready', {
      isDesktop: true,
      steamPath,
      dayzPath,
      steamAvailable: !!steam
    });
  });
}

// IPC Handlers
ipcMain.handle('get-installed-mods', async () => {
  const steamPath = store.get('steamPath');
  return scanInstalledMods(steamPath);
});

ipcMain.handle('launch-server', async (event, { serverAddress, requiredMods }) => {
  try {
    const installedMods = scanInstalledMods(store.get('steamPath'));
    const installedIds = installedMods.map(m => m.workshopId);
    
    // Find missing mods
    const missing = requiredMods.filter(mod => 
      !installedIds.includes(mod.steamWorkshopId.toString())
    );

    if (missing.length > 0) {
      // Return missing mods info
      return {
        canLaunch: false,
        missingMods: missing
      };
    }

    // All mods installed, launch
    launchDayZ(serverAddress, requiredMods);
    
    // Save to recent
    const latestJoined = store.get('latestJoined', []);
    const [ip, port] = serverAddress.split(':');
    latestJoined.unshift({
      joined: new Date().toISOString(),
      endpoint: { ip, port: parseInt(port) }
    });
    store.set('latestJoined', latestJoined.slice(0, 50)); // Keep last 50

    return {
      canLaunch: true,
      missingMods: []
    };
  } catch (error) {
    console.error('[Launch] Error:', error);
    return {
      canLaunch: false,
      error: error.message
    };
  }
});

ipcMain.handle('subscribe-to-mods', async (event, { modIds }) => {
  if (!steamworks) {
    return { success: false, error: 'Steam not available' };
  }

  try {
    for (const modId of modIds) {
      steamworks.ugc.SubscribeItem(modId);
      console.log('[Steam] Subscribed to mod:', modId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Steam] Subscribe error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-settings', async () => {
  return store.store;
});

ipcMain.handle('save-settings', async (event, settings) => {
  Object.keys(settings).forEach(key => {
    store.set(key, settings[key]);
  });
  return { success: true };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
