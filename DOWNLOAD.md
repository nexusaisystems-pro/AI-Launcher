# 📥 Download GameHub Launcher Desktop

## ✅ What's Ready Now

### Linux Users - Ready to Download!
**File:** `GameHub Launcher-1.0.0.AppImage` (152MB)
**Location:** In the `release/` folder

**How to use:**
1. Download the AppImage file from Replit
2. Make it executable: `chmod +x "GameHub Launcher-1.0.0.AppImage"`
3. Double-click to run!

---

## 🪟 Windows Users - Build on Your PC (2 Minutes)

The Windows .exe can't be built from this Linux environment, but you can build it easily on your Windows PC:

### Quick Windows Build Steps:

1. **Download this project from Replit:**
   - Click the three dots (⋮) in the file explorer
   - Click "Download as ZIP"
   - Extract to a folder (e.g., `C:\GameHub`)

2. **Install Node.js** (if you don't have it):
   - Download from https://nodejs.org/ (get the LTS version)
   - Install with default settings

3. **Build the Windows desktop app:**
   - Open PowerShell in the extracted folder (Shift + Right-click → "Open PowerShell here")
   - Run these commands:
     ```powershell
     npm install
     node build-desktop.js win
     ```

4. **Your portable app is ready!**
   - Find it in: `release\GameHub Launcher.exe`
   - Double-click to run - no installation needed!

---

## 🍎 macOS Users - Build on Your Mac

1. Download the project as ZIP from Replit
2. Extract and open Terminal in that folder
3. Run:
   ```bash
   npm install
   node build-desktop.js mac
   ```
4. Find your app in `release/GameHub Launcher.dmg`

---

## 🎮 First Time Setup

When you launch the desktop app:

1. **Set Steam Path:**
   - Click Settings (⚙️ icon)
   - Enter your Steam installation path:
     - Windows: `C:\Program Files (x86)\Steam`
     - macOS: `~/Library/Application Support/Steam`
     - Linux: `~/.steam/steam`
   - Click Save

2. **Start using:**
   - Browse DayZ servers
   - Click "Join Server" on any server
   - Desktop app will:
     - ✅ Check your installed mods
     - ✅ Show missing mods
     - ✅ Download them via Steam (one click)
     - ✅ Launch DayZ automatically

---

## 📦 Alternative: No-Build Quick Test

If you just want to test without building:

1. Download project from Replit
2. Install Node.js
3. Open terminal and run:
   ```bash
   npm install
   npm run dev
   ```
4. In another terminal:
   ```bash
   node desktop/main.js
   ```

This runs the desktop app directly (requires Node.js to be running).

---

## ❓ Troubleshooting

**"npm: command not found"**  
→ Install Node.js from https://nodejs.org/

**Build fails on Windows?**  
→ Run PowerShell as Administrator and try again

**Can't detect Steam?**  
→ Make sure Steam path in Settings matches your actual Steam installation

**App won't launch DayZ?**  
→ Steam must be running, and DayZ must be installed

---

## 📋 What You Get

✅ **Desktop Features:**
- Automatic mod detection from Steam Workshop
- One-click mod downloading via Steam
- Auto-launch DayZ with correct parameters
- Persistent settings and favorites

✅ **Available Formats:**
- Windows: Portable .exe (no installation needed!)
- Linux: AppImage (works anywhere)
- macOS: .dmg installer

---

## 🚀 Next Steps

Once you build the Windows .exe, you can:
- Run it directly from the `release` folder
- Copy it to any Windows PC (no dependencies needed)
- Share it with friends
- Put it on a USB drive
