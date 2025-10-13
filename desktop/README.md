# GameHub Launcher - Desktop Application

This is the Electron-based desktop version of GameHub Launcher with automatic mod management and 1-click server joining.

## Features

- 🎮 **1-Click Server Joining** - Automatically launch DayZ with the correct mods
- 📦 **Automatic Mod Detection** - Scans your installed Steam Workshop mods
- ⬇️ **Auto Mod Downloads** - Subscribe to missing mods via Steam Workshop
- 🔄 **Seamless Integration** - Same UI as the web version with desktop superpowers

## Prerequisites

- Node.js 18+ installed
- Steam client running
- DayZ installed via Steam
- Electron and steamworks.js packages installed

## Running the Desktop App

### Development Mode

1. **Start the backend server:**
   ```bash
   npm run dev
   ```

2. **In a new terminal, start Electron:**
   ```bash
   NODE_ENV=development electron .
   ```

   The desktop app will load your React UI from `http://localhost:5000` and add desktop capabilities.

### Production Mode

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start the desktop app:**
   ```bash
   NODE_ENV=production electron .
   ```

## Quick Start Script

For convenience, you can use the provided start scripts:

**Linux/Mac:**
```bash
chmod +x desktop/start-dev.sh
./desktop/start-dev.sh
```

**Windows:**
```bash
desktop\start-dev.bat
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│  Electron Main Process (desktop/main.js)│
│  ├─ Steam Integration (Steamworks API)  │
│  ├─ Mod Scanner (Workshop folder)       │
│  └─ Game Launcher (Steam protocol)      │
└─────────────────────────────────────────┘
           ↕ IPC Communication
┌─────────────────────────────────────────┐
│  React Renderer (Your Web App)          │
│  ├─ Server Browser                      │
│  ├─ Desktop Join Modal                  │
│  └─ Mod Management UI                   │
└─────────────────────────────────────────┘
           ↕ API Calls
┌─────────────────────────────────────────┐
│  Express Backend                        │
│  └─ /api/v2/launcher/servers/dayz       │
└─────────────────────────────────────────┘
```

### Automatic Mod Management Flow

1. **User clicks "Join Server"** on any modded server
2. **Desktop app detects missing mods** by comparing:
   - Server requirements (from database/API)
   - Installed mods (from Steam Workshop folder)
3. **Missing mods are subscribed** via Steamworks API:
   ```javascript
   steamworks.ugc.SubscribeItem(workshopId)
   ```
4. **Steam downloads mods** automatically in the background
5. **Game launches** with proper `-mod` parameters:
   ```
   steam://run/221100//-mod=@CF;@Terje -connect=IP:PORT
   ```

### File Locations

**Steam Workshop Mods:**
```
Windows: C:\Program Files (x86)\Steam\steamapps\workshop\content\221100\
Linux: ~/.steam/steam/steamapps/workshop/content/221100/
Mac: ~/Library/Application Support/Steam/steamapps/workshop/content/221100/
```

**DayZ Installation:**
```
Windows: C:\Program Files (x86)\Steam\steamapps\common\DayZ\
Linux: ~/.steam/steam/steamapps/common/DayZ/
Mac: ~/Library/Application Support/Steam/steamapps/common/DayZ/
```

**Desktop App Settings:**
```
Windows: %APPDATA%\gamehub-launcher\
Linux: ~/.config/gamehub-launcher/
Mac: ~/Library/Application Support/gamehub-launcher/
```

## Desktop-Specific Features

### Mod Detection
The app automatically scans your Steam Workshop folder and reads mod metadata from `mod.cpp` files.

### Steam Integration
Uses `steamworks.js` to:
- Subscribe to Workshop items
- Monitor download progress
- Launch games with proper parameters

### Settings Persistence
User preferences are stored locally using `electron-store`:
- DayZ/Steam paths
- Favorite servers
- Recent servers
- Launch parameters

## API Endpoints

### Desktop Server List
```
GET /api/v2/launcher/servers/dayz
```

Returns servers in DZSA-compatible format with Workshop IDs:
```json
[
  {
    "ip": "193.34.77.57",
    "port": 2302,
    "name": "Frigid Namalsk",
    "map": "namalsk",
    "players": 45,
    "maxPlayers": 60,
    "mods": [
      {
        "name": "Community Framework",
        "steamWorkshopId": 1559212036
      }
    ]
  }
]
```

## Troubleshooting

### "Steam not available" error
- Ensure Steam client is running
- Restart the desktop app
- Check Steam is logged in

### Mods not downloading
- Verify Steam is running
- Check your Steam download region
- Ensure you own DayZ

### Game won't launch
- Verify DayZ installation path in settings
- Check mod compatibility
- Review launch parameters

## Building for Distribution

To create distributable packages:

1. **Install electron-builder:**
   ```bash
   npm install --save-dev electron-builder
   ```

2. **Build for your platform:**
   ```bash
   npm run electron:build
   ```

This creates installers in the `dist/` directory.

## Comparison: Web vs Desktop

| Feature | Web Version | Desktop Version |
|---------|-------------|-----------------|
| Server Browser | ✅ | ✅ |
| Search & Filters | ✅ | ✅ |
| Server Intelligence | ✅ | ✅ |
| Favorites/Recents | ✅ | ✅ |
| Mod Detection | ❌ | ✅ |
| Auto Mod Download | ❌ | ✅ |
| 1-Click Join | ❌ | ✅ |
| Offline Mode | ❌ | ✅ |

## Next Steps

- [ ] Add mod update checker
- [ ] Implement mod presets
- [ ] Add download bandwidth limiter
- [ ] Create system tray integration
- [ ] Build auto-updater for launcher
