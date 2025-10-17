const { app, BrowserWindow, ipcMain, shell } = require('electron');
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
    additionalParameters: '',
    authToken: null,
    authUser: null
  }
});

// Production backend URL (or localhost for dev)
const BACKEND_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://gamehublauncher.com';

// Register custom protocol handler for auth callback
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('gamehub', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('gamehub');
}

let mainWindow;
let steamworks;
let pendingProtocolUrl = null; // Buffer for protocol URLs that arrive before window is ready

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
    mainWindow.loadURL('http://localhost:5000/#/launcher');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files and navigate to launcher
    // __dirname resolves correctly both in dev and when packaged
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    
    console.log('[Desktop] Loading from:', indexPath);
    console.log('[Desktop] __dirname:', __dirname);
    console.log('[Desktop] File exists:', fs.existsSync(indexPath));
    
    // Load the file first, then navigate to launcher route
    mainWindow.loadFile(indexPath).then(() => {
      mainWindow.webContents.executeJavaScript(`window.location.hash = '#/launcher'`);
    });
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

// Auth IPC handlers
ipcMain.handle('get-auth-token', async () => {
  return store.get('authToken');
});

ipcMain.handle('get-auth-user', async () => {
  return store.get('authUser');
});

ipcMain.handle('open-login', async () => {
  // Open browser to web login page with desktop callback
  const loginUrl = `${BACKEND_URL}/api/login?desktop=true`;
  shell.openExternal(loginUrl);
  return { success: true };
});

ipcMain.handle('logout', async () => {
  try {
    const { session, net } = require('electron');
    const cookieUrl = BACKEND_URL.startsWith('https') ? BACKEND_URL : 'http://localhost:5000';
    
    // Call backend logout endpoint to invalidate session
    const request = net.request({
      method: 'GET',
      url: `${BACKEND_URL}/api/logout`,
      session: session.defaultSession
    });
    
    request.on('response', () => {
      // Response handled, we don't need to process it
    });
    
    request.on('error', (error) => {
      console.error('[Auth] Logout error:', error);
    });
    
    request.end();
    
    // Remove cookie from Electron session
    await session.defaultSession.cookies.remove(cookieUrl, 'connect.sid');
    
    // Clear local storage
    store.delete('authToken');
    store.delete('authUser');
    
    return { success: true };
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return { success: false, error: error.message };
  }
});

// Handle protocol deep links (auth and join)
async function handleProtocolUrl(url) {
  // If main window isn't ready yet, buffer the URL and process it later
  if (!mainWindow) {
    console.log('[Protocol] Window not ready, buffering URL:', url);
    pendingProtocolUrl = url;
    return;
  }

  if (url.startsWith('gamehub://auth-callback')) {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    
    if (token) {
      // Store token
      store.set('authToken', decodeURIComponent(token));
      
      // Set cookie in Electron session for authenticated requests
      const { session } = require('electron');
      const cookieUrl = BACKEND_URL.startsWith('https') ? BACKEND_URL : 'http://localhost:5000';
      
      await session.defaultSession.cookies.set({
        url: cookieUrl,
        name: 'connect.sid',
        value: decodeURIComponent(token),
        httpOnly: true,
        secure: BACKEND_URL.startsWith('https'),
      });
      
      // Fetch user profile (now cookie is set)
      fetchUserProfile().then(user => {
        if (user) {
          store.set('authUser', user);
          mainWindow.webContents.send('auth-success', { user, token: decodeURIComponent(token) });
        }
      });
    }
  } else if (url.startsWith('gamehub://join')) {
    // Handle join server request from web browser
    const urlObj = new URL(url);
    const serverAddress = urlObj.searchParams.get('server');
    const modsParam = urlObj.searchParams.get('mods');
    const serverName = urlObj.searchParams.get('name') || serverAddress;
    
    if (serverAddress) {
      // Bring window to front
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Parse mods (comma-separated Workshop IDs), filter out invalid IDs
      const modIds = modsParam ? modsParam.split(',').filter(id => id.trim() && !isNaN(parseInt(id))) : [];
      const requiredMods = modIds.map(id => ({
        name: `Workshop Item ${id}`,
        steamWorkshopId: parseInt(id)
      }));
      
      console.log('[Deep Link] Join server request:', { serverAddress, serverName, requiredMods });
      
      // Send join request to renderer
      mainWindow.webContents.send('deep-link-join', {
        serverAddress,
        serverName: decodeURIComponent(serverName),
        requiredMods
      });
    }
  }
}

// Handle protocol deep links - macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleProtocolUrl(url);
});

// Handle protocol deep links - Windows/Linux
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window and handle the protocol
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Check for protocol URL in command line args
      const url = commandLine.find(arg => arg.startsWith('gamehub://'));
      if (url) {
        handleProtocolUrl(url);
      }
    }
  });
}

// Check for protocol URL on first launch (Windows/Linux)
if (process.platform === 'win32' || process.platform === 'linux') {
  const url = process.argv.find(arg => arg.startsWith('gamehub://'));
  if (url) {
    app.whenReady().then(() => {
      setTimeout(() => handleProtocolUrl(url), 1000); // Wait for window to be ready
    });
  }
}

// Fetch user profile from backend (cookie already set in session)
async function fetchUserProfile() {
  try {
    const { net } = require('electron');
    
    return new Promise((resolve) => {
      const request = net.request({
        method: 'GET',
        url: `${BACKEND_URL}/api/auth/user`,
        session: require('electron').session.defaultSession
      });
      
      request.on('response', (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk.toString();
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
      
      request.on('error', (error) => {
        console.error('[Auth] Error fetching user:', error);
        resolve(null);
      });
      
      request.end();
    });
  } catch (error) {
    console.error('[Auth] Error fetching user:', error);
    return null;
  }
}

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
