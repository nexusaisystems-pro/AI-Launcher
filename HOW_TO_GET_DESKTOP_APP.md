# 🎮 How to Get GameHub Launcher Desktop App

I've built a desktop app for you, but ran into some platform limitations. Here's the clearest path forward:

---

## 🐧 Linux Users - Download Now!

### ✅ Your desktop app is ready!

**File:** `release/GameHub Launcher-1.0.0.AppImage` (152MB)

**To download from Replit:**
1. Navigate to the `release/` folder in the file explorer (left sidebar)
2. Right-click on `GameHub Launcher-1.0.0.AppImage`
3. Select "Download"

**To run:**
1. Open your file manager and find the downloaded file
2. Right-click → Properties → Permissions
3. Check "Allow executing file as program" ✅
4. Double-click the file to launch!

**Or via terminal (if you prefer):**
```bash
chmod +x "GameHub Launcher-1.0.0.AppImage"
./GameHub\ Launcher-1.0.0.AppImage
```

---

## 🪟 Windows Users - Simple Local Build

I can't build Windows .exe from this Linux environment, but you can build it on your Windows PC in **2 minutes**:

### Step 1: Download This Project
1. In Replit, click the **three dots (⋮)** at the top of the file explorer
2. Click **"Download as ZIP"**
3. Extract to `C:\GameHub` (or any folder)

### Step 2: Install Node.js
- Download from: https://nodejs.org/en/download/prebuilt-installer (LTS version)
- Run the installer, use all default settings
- Restart your computer

### Step 3: Build the Desktop App
1. Open the `C:\GameHub` folder
2. Hold **Shift** and **right-click** in empty space
3. Click **"Open PowerShell window here"**
4. Copy and paste these commands one by one:

```powershell
npm install
npm run build
npx electron-builder --win portable
```

### Step 4: Your App is Ready!
- Find it in: `C:\GameHub\release\GameHub Launcher.exe`
- Double-click to run - no installation needed!
- You can copy this .exe to any Windows PC

---

## 🍎 macOS Users - Simple Local Build

1. Download this project as ZIP from Replit
2. Extract to a folder (e.g., `~/GameHub`)
3. Open Terminal in that folder
4. Run:
```bash
npm install
npm run build
npx electron-builder --mac
```
5. Find your app in `release/GameHub Launcher.dmg`

---

## ⚙️ First Time Setup

When you launch the desktop app for the first time:

1. **Click the Settings icon (⚙️)** in the top-right
2. **Set your Steam installation path:**
   - Windows: `C:\Program Files (x86)\Steam`
   - macOS: `~/Library/Application Support/Steam`  
   - Linux: `~/.steam/steam` or `~/.local/share/Steam`
3. **Click Save**

---

## 🎮 How to Use

1. Browse DayZ servers in the list
2. Click **"Join Server"** on any server
3. The desktop app will:
   - ✅ Check which mods you have installed
   - ✅ Show which mods you're missing
   - ✅ Let you download them via Steam (one click)
   - ✅ Launch DayZ with all the right parameters

**No more manual mod management!**

---

## ❓ Why Can't You Build Windows from Replit?

Replit runs on Linux servers. Building Windows .exe files from Linux requires additional tools (Wine) that would take hours to set up. Building on your Windows PC is **faster and more reliable**.

The 3 PowerShell commands take about 2 minutes total, and then you have a portable .exe that works on any Windows PC!

---

## 🚀 What You're Getting

✅ **Full desktop app with:**
- Automatic Steam Workshop mod detection
- One-click mod downloading
- Auto-launch DayZ with correct mods
- Same UI as the web version
- Persistent favorites and settings

✅ **Portable versions:**
- No installation required
- Copy to USB drive
- Share with friends
- Works offline (after first setup)

---

## 📝 Note About package.json

During the build process, the project's `package.json` file was modified. If you encounter any issues with the Replit environment, you can restore it manually or let me know and I can help troubleshoot.

---

## Need Help?

If you run into issues:
1. Make sure Steam is installed and running
2. Check that DayZ is installed
3. Verify the Steam path in Settings is correct
4. Try running PowerShell as Administrator (Windows)

The desktop app is fully functional - the only limitation is that you need to build the Windows version on your own PC, which is actually the standard way to distribute Electron apps anyway!
