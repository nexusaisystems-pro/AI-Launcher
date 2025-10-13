# Quick Start - GameHub Launcher Desktop (No Build Required)

## Fastest Way to Test (Windows/Mac/Linux)

### Prerequisites
- Node.js 18+ installed ([Download here](https://nodejs.org/))
- Steam installed with DayZ

### Steps

1. **Download this entire project** as a ZIP file from Replit
   - Click the three dots (⋮) in the file explorer
   - Select "Download as ZIP"
   - Extract the ZIP to a folder on your computer

2. **Open Terminal/Command Prompt in the extracted folder**
   - Windows: Right-click in folder → "Open in Terminal" or press Shift+Right-click → "Open PowerShell here"
   - Mac: Right-click folder → "Services" → "New Terminal at Folder"
   - Linux: Right-click → "Open in Terminal"

3. **Install dependencies** (one-time setup)
   ```bash
   npm install
   ```

4. **Run the desktop app**
   ```bash
   npm run dev
   ```
   Then in a new terminal:
   ```bash
   node desktop/main.js
   ```

   **OR use the convenient startup scripts:**
   
   **Windows:**
   ```bash
   desktop\start-dev.bat
   ```
   
   **Mac/Linux:**
   ```bash
   chmod +x desktop/start-dev.sh
   ./desktop/start-dev.sh
   ```

5. **First Launch Setup**
   - The desktop app will open
   - Go to Settings (gear icon)
   - Set your Steam installation path (e.g., `C:\Program Files (x86)\Steam`)
   - Start browsing servers!

## Why This is Different from the Web Version

✅ **Desktop Version:**
- Detects mods installed in Steam Workshop
- Shows which mods you need to download
- One-click subscribe to missing mods via Steam
- Auto-launches DayZ with correct mod parameters
- Settings saved locally

❌ **Web Version (browser):**
- Can browse servers
- Shows server info
- No mod detection or auto-launch

## To Get a Real Installer (.exe, .app, .deb)

See `BUILD_DESKTOP.md` for instructions to build a proper installer you can distribute to others!
