# 📥 Download & Run GameHub Launcher Desktop

## 🚀 Easiest Way to Test (2 Minutes)

### Step 1: Download from Replit
1. In the Replit file explorer (left sidebar), click the **three dots (⋮)** at the top
2. Click **"Download as ZIP"**
3. Save the `workspace.zip` file to your computer
4. **Extract the ZIP** to a folder (e.g., `C:\GameHub` or `~/GameHub`)

### Step 2: Install Node.js (if you don't have it)
- Download from: https://nodejs.org/ (get the LTS version)
- Install with default settings
- Restart your computer after installation

### Step 3: Run the Desktop App

#### 🪟 Windows:
1. Open the extracted folder
2. Hold **Shift** and **right-click** in the empty space
3. Click **"Open PowerShell window here"** or **"Open in Terminal"**
4. Run these commands:
   ```bash
   npm install
   npm run dev
   ```
5. Open **another terminal** (same way) and run:
   ```bash
   node desktop/main.js
   ```

**🎉 The desktop app will open!**

#### 🍎 Mac:
1. Open the extracted folder in Finder
2. Right-click the folder → **Services** → **"New Terminal at Folder"**
3. Run these commands:
   ```bash
   npm install
   npm run dev
   ```
4. Open **another terminal** (⌘+T) and run:
   ```bash
   node desktop/main.js
   ```

**🎉 The desktop app will open!**

#### 🐧 Linux:
1. Open terminal in the extracted folder
2. Run these commands:
   ```bash
   npm install
   npm run dev
   ```
3. Open **another terminal** and run:
   ```bash
   node desktop/main.js
   ```

**🎉 The desktop app will open!**

---

## ⚙️ First Time Setup

When the app opens:
1. Click the **Settings** icon (⚙️) in the top-right
2. Set your **Steam path**:
   - Windows: `C:\Program Files (x86)\Steam`
   - Mac: `~/Library/Application Support/Steam`
   - Linux: `~/.steam/steam`
3. Click **Save**

---

## 🎮 How to Use

1. **Browse Servers** - Scroll through the server list
2. **Search** - Type server name or map
3. **Filter** - Select map, perspective, or region
4. **Click "Join Server"** on any server

The desktop app will:
- ✅ Check which mods are installed
- ✅ Show missing mods
- ✅ Let you download them via Steam (one click)
- ✅ Launch DayZ with correct mod parameters

---

## 🏗️ Want a Real Installer? (.exe / .dmg / .deb)

The above method requires Node.js to be installed. If you want a **standalone installer** (double-click to run, no Node.js needed):

1. Follow steps 1-3 above to get the code and install dependencies
2. Move `electron` and `electron-builder` to devDependencies:
   ```bash
   npm install --save-dev electron electron-builder
   ```
3. Add to `package.json` under `scripts`:
   ```json
   "build:desktop:win": "npm run build && electron-builder --win",
   "build:desktop:mac": "npm run build && electron-builder --mac",
   "build:desktop:linux": "npm run build && electron-builder --linux"
   ```
4. Add `"main": "desktop/main.js"` at the top level of `package.json`
5. Build for your platform:
   ```bash
   # Windows
   npm run build:desktop:win
   
   # Mac
   npm run build:desktop:mac
   
   # Linux
   npm run build:desktop:linux
   ```

Your installer will be in the `release/` folder! 🎉

---

## ❓ Troubleshooting

**Terminal says "npm: command not found"**
→ Node.js isn't installed. Download from https://nodejs.org/

**Desktop app won't detect mods**
→ Check Steam path in Settings matches your actual Steam installation

**Can't launch DayZ**
→ Make sure Steam is running and DayZ is installed

**Port 5000 already in use**
→ Another app is using port 5000. Close it or edit `server/index.ts` to use a different port
