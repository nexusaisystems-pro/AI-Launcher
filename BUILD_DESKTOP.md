# Build GameHub Launcher Desktop App

## Prerequisites
- Node.js 18+ installed
- Git installed

## Quick Build Instructions

### 1. Download the Source Code
```bash
# Clone or download this repository
git clone <your-repo-url>
cd gamehub-launcher
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Fix Package Dependencies (One-time setup)
Move electron and electron-builder to devDependencies:
```bash
npm install --save-dev electron electron-builder
npm uninstall electron electron-builder
npm install --save-dev electron electron-builder
```

### 4. Add Build Scripts to package.json
Add these to the "scripts" section in package.json:
```json
"scripts": {
  ...existing scripts...
  "build:desktop": "npm run build && electron-builder",
  "build:desktop:win": "npm run build && electron-builder --win",
  "build:desktop:linux": "npm run build && electron-builder --linux",
  "build:desktop:mac": "npm run build && electron-builder --mac"
}
```

Add this "main" field at the top level:
```json
{
  "name": "gamehub-launcher",
  "main": "desktop/main.js",
  ...rest of config...
}
```

### 5. Build the Desktop App

**For Windows:**
```bash
npm run build:desktop:win
```
Output: `release/GameHub Launcher Setup.exe` and `release/GameHub Launcher.exe` (portable)

**For macOS:**
```bash
npm run build:desktop:mac
```
Output: `release/GameHub Launcher.dmg`

**For Linux:**
```bash
npm run build:desktop:linux
```
Output: `release/GameHub Launcher.AppImage` and `release/GameHub Launcher.deb`

## What You Get

- ✅ **Windows**: Installable .exe with desktop shortcuts
- ✅ **Linux**: AppImage (run anywhere) or .deb package
- ✅ **macOS**: .dmg installer

All built apps are in the `release/` folder after building.

## Installation & Use

1. Run the installer for your platform
2. Launch "GameHub Launcher" from your applications
3. First run: Set your Steam path in settings
4. Browse servers and click "Join Server"
5. Desktop app auto-downloads mods and launches DayZ!

## Troubleshooting

**Build fails on Windows?**
- Install Windows Build Tools: `npm install --global windows-build-tools`

**Build fails on macOS?**
- You need Xcode Command Line Tools: `xcode-select --install`

**Build fails on Linux?**
- Install required packages: `sudo apt-get install -y rpm`
