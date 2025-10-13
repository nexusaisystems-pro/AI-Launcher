# GitHub Release & Distribution Guide

This guide explains how to set up and use GitHub Actions to automatically build and distribute GameHub Launcher desktop apps.

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [How to Create a Release](#how-to-create-a-release)
3. [Update Download Page](#update-download-page)
4. [What Gets Built](#what-gets-built)
5. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Push Your Code to GitHub

First, push this project to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: GameHub Launcher with desktop app"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/gamehub-launcher.git

# Push to GitHub
git push -u origin main
```

### 2. Configure GitHub Repository for Downloads

You need to set the `VITE_GITHUB_REPO` environment variable so the downloads page knows where to fetch installers.

**Option A: Using Replit Secrets (Recommended)**
1. In Replit, click the "Secrets" tool (🔒 icon in left sidebar)
2. Add a new secret:
   - Key: `VITE_GITHUB_REPO`
   - Value: `yourusername/gamehub-launcher` (replace with your actual GitHub username/repo)
3. Restart your Replit app

**Option B: Using .env file (Local Development)**
1. Create a `.env` file in the project root:
   ```bash
   echo "VITE_GITHUB_REPO=yourusername/gamehub-launcher" > .env
   ```
2. Restart your dev server

**Option C: Hardcode it (Quick Testing)**
Edit `client/src/pages/downloads.tsx` and change:
```typescript
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || '';
```
To:
```typescript
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'yourusername/gamehub-launcher';
```

⚠️ **Important:** Replace `yourusername/gamehub-launcher` with your actual GitHub repository path.

---

## How to Create a Release

### Method 1: GitHub Web UI (Easiest)

1. **Go to your GitHub repository**
2. **Click on "Releases"** (right sidebar)
3. **Click "Create a new release"**
4. **Fill in the details:**
   - **Tag version:** `v1.0.0` (or any version number)
   - **Release title:** `GameHub Launcher v1.0.0`
   - **Description:** Add release notes (what's new, bug fixes, etc.)
5. **Click "Publish release"**

**That's it!** GitHub Actions will automatically:
- Build Windows .exe (portable)
- Build macOS .dmg installer
- Build Linux .AppImage
- Upload them to your release page

### Method 2: Command Line (Git Tag)

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# Then go to GitHub and create the release from the tag
```

---

## What Gets Built

When you create a release, GitHub Actions builds:

### Windows
- **File:** `GameHub-Launcher.exe` (~160MB)
- **Type:** Portable executable (no installation needed)
- **Works on:** Windows 10, 11

### macOS
- **File:** `GameHub-Launcher.dmg` (~165MB)
- **Type:** DMG installer
- **Works on:** macOS 10.15+

### Linux
- **File:** `GameHub-Launcher.AppImage` (~155MB)
- **Type:** Universal AppImage
- **Works on:** Ubuntu, Debian, Fedora, etc.

All files are automatically uploaded to your GitHub release page with download links.

---

## Download Links

After the build completes (takes ~5-10 minutes), your users can download from:

### Direct Links (Auto-Generated):
```
https://github.com/YOUR_USERNAME/gamehub-launcher/releases/latest/download/GameHub-Launcher.exe
https://github.com/YOUR_USERNAME/gamehub-launcher/releases/latest/download/GameHub-Launcher.dmg
https://github.com/YOUR_USERNAME/gamehub-launcher/releases/latest/download/GameHub-Launcher.AppImage
```

### Release Page:
```
https://github.com/YOUR_USERNAME/gamehub-launcher/releases/latest
```

Your downloads page (`/downloads`) automatically uses these links!

---

## Manual Trigger (Testing)

You can also trigger builds manually without creating a release:

1. Go to your GitHub repo
2. Click "Actions" tab
3. Click "Build Desktop Apps" workflow
4. Click "Run workflow" dropdown
5. Click green "Run workflow" button

This builds the apps and saves them as artifacts (but doesn't create a release).

---

## Updating the App

To release a new version:

1. **Make your code changes**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add new feature X"
   git push
   ```
3. **Create a new release** (v1.0.1, v1.0.2, etc.)
4. GitHub Actions automatically builds the new version
5. Users download the latest from `/downloads` page

---

## Troubleshooting

### Build Fails?

**Check the Actions tab:**
1. Go to your GitHub repo
2. Click "Actions" tab
3. Click on the failed workflow
4. Expand the failed step to see the error

**Common issues:**
- **Dependencies issue:** Run `npm install` locally first to verify
- **Build fails on specific OS:** Check the matrix build for that OS
- **Permission errors:** Make sure GitHub Actions has write permissions (Settings → Actions → General → Workflow permissions → Read and write)

### Downloads Page Shows 404?

Make sure you:
1. Updated `GITHUB_REPO` in `client/src/pages/downloads.tsx`
2. Created at least one release
3. Build completed successfully (check Actions tab)

### Want to Change Build Settings?

Edit `.github/workflows/build-desktop.yml` to:
- Change platforms (add/remove Windows/Mac/Linux)
- Modify build commands
- Update artifact names
- Change when builds trigger

---

## File Structure

```
.github/
  workflows/
    build-desktop.yml          # GitHub Actions workflow
client/
  src/
    pages/
      downloads.tsx            # Downloads page with OS detection
electron-builder.yml           # Electron builder configuration
desktop/
  main.js                      # Desktop app entry point
  preload.js                   # IPC bridge
```

---

## Tips & Best Practices

### Versioning
Use semantic versioning (v1.0.0, v1.1.0, v2.0.0):
- **Major (v2.0.0):** Breaking changes
- **Minor (v1.1.0):** New features
- **Patch (v1.0.1):** Bug fixes

### Release Notes
Always add release notes explaining:
- What's new
- Bug fixes
- Known issues

### Pre-releases
For beta testing, check "This is a pre-release" when creating the release.

### Auto-updates (Future)
You can add electron-updater later to enable automatic updates for users!

---

## Summary

**Quick workflow:**
1. Push code to GitHub ✅
2. Update download page with your repo URL ✅
3. Create a release (v1.0.0) ✅
4. Wait 5-10 minutes for builds ✅
5. Users download from `/downloads` page ✅

The entire distribution is automated - you just need to create releases!
