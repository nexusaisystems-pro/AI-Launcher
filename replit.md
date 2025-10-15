# GameHub Launcher - Multi-Game Server Browser Platform

## Overview

GameHub Launcher is a next-generation multi-game server browser platform by Nexus AI Systems, currently in beta for DayZ and planned for expansion to other games like Rust and Arma 3. It offers AI-powered server recommendations, real-time statistics, automatic mod management, and one-click server joining. The platform is a full-stack TypeScript application with a React frontend and Express backend, designed for 100,000+ players.

The platform includes:
- A premium, authentication-gated landing page.
- A main launcher with a server browser for authenticated users.
- An owner dashboard for verified server owners.
- An admin panel for platform administration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React 18 with TypeScript, Vite for building, Wouter for routing, and TanStack Query for data fetching. UI is built with Shadcn/ui (Radix UI) and Tailwind CSS, featuring a dark mode theme. State management uses React Query for server state, React hooks for local UI state, and localStorage for session IDs and offline resilience, with user preferences synced to a PostgreSQL backend.

Performance optimizations include server-side pagination with `useInfiniteQuery`, virtualized scrolling with `@tanstack/react-virtual`, and extensive memoization (React.memo, useMemo) to optimize rendering. Optimistic updates are implemented for UI feedback on actions like favoriting, with debounced backend saves and rollback mechanisms.

Key features include an auth-gated landing page with SEO, advanced server filtering, real-time server status, persistent favorites/recents, a server detail panel, and a join modal with mod validation. Server intelligence features include quality grade badges, trust scores, fraud detection, and intelligence tabs for metrics.

### Backend Architecture

The backend uses Express.js with TypeScript and ESM modules. It integrates the A2S Protocol via `steam-server-query` for real-time server querying, supporting server discovery, live player counts, and mod parsing. API design is RESTful with JSON format, using Zod for validation.

The A2S service layer handles server discovery, querying, automatic mod parsing, region detection, and perspective detection (1PP/3PP) from server names.

A Mod List Enrichment Pipeline extends the schema with a `modList` JSON column, leveraging BattleMetrics for mod names and integrating with Steam Workshop (via API) for metadata (title, tags, file size, subscribers, map detection). A Bulk Enrichment System is a background service for fetching and processing BattleMetrics data for all servers with rate limiting and progress tracking, improving quality data accuracy.

### Data Storage Solutions

The primary database is PostgreSQL, accessed via the Neon Database serverless driver and managed with Drizzle ORM and Drizzle Kit for migrations. Data models include: `Games`, `Users`, `Servers` (with gameId), `Server Owners`, `Pending Claims`, `Server Analytics`, `User Preferences`, `Workshop Mods` (cached), `Admin Activity Log`, and `System Metrics`. JSON fields are used for complex data.

### Authentication and Authorization

The platform uses **Replit Auth** (OpenID Connect) for unified authentication across web and desktop applications. Session management uses PostgreSQL-backed sessions with HTTP-only cookies (1-week TTL).

**Web Authentication:**
- Replit Auth blueprint with Google, GitHub, and Email login options
- Session stored in PostgreSQL via `connect-pg-simple`
- HTTP-only cookies with secure signing using `cookie-signature`
- Role-based middleware: `isAuthenticated`, `isOwner`, `isAdmin`
- Protected routes for owner/admin features
- User profile synced to database on first login

**Desktop Authentication:**
- Custom protocol handler (`gamehub://`) for auth callbacks
- Desktop login flow:
  1. User clicks "Sign In with Replit" in desktop app
  2. Opens system browser to web login page
  3. Web app redirects to `gamehub://auth?token=SESSION_ID`
  4. Desktop intercepts protocol, stores signed session cookie
  5. Desktop fetches user profile via API
- Session cookie signed with same secret as web (shared cookie-signature)
- Electron session API (`session.defaultSession.cookies.set()`) manages cookies
- Cross-platform support: macOS (`open-url`), Windows/Linux (`second-instance`)
- Desktop API uses production backend URL with `credentials: 'include'`
- Logout clears server session, Electron cookies, and local storage

**User Roles:**
- `player`: Default role, access to server browser and favorites
- `owner`: Can claim and manage servers
- `admin`: Full platform administration access

**Session-based tracking** still uses nanoid-generated IDs stored in localStorage for anonymous user preferences (favorites/recents), seamlessly upgraded when user authenticates.

## External Dependencies

### Steam Integration
- **Steam Workshop API**: For real mod metadata fetching (titles, descriptions, file sizes, thumbnails, subscriber counts) with a 7-day caching layer.
- **Steam Workshop**: For mod downloads and management.
- **Steam Launch Protocol**: `steam://rungameid/221100` for launching games.

### Third-Party Services
- **DayZ server query protocol**: For real-time server status.
- **BattleMetrics API**: Used for mod name extraction and server quality data (rank, uptime, player activity).
- Master server list integration for server discovery.
- AI-powered server recommendations (feature blueprint).

### UI Libraries
- **Radix UI**: Primitives for accessible components.
- **Lucide React**: Icon system.
- **date-fns**: Date/time formatting.
- **embla-carousel**: Carousel functionality.
- **cmdk**: Command palette patterns.
- **@tanstack/react-virtual**: For virtualized scrolling.

### Development Tools
- **TypeScript**: For type checking.
- **ESBuild**: For server bundling.
- **Zod**: For runtime schema validation.
- **React Hook Form**: With Zod resolvers for form handling.
- **Drizzle-Zod**: For automatic schema validation from database models.
### Netflix-Style Carousel Layout (October 2025)
- Redesigned sponsored servers display as horizontal Netflix-style carousel at top of browser
- Horizontal scrolling with fixed 400px card width and smooth overflow behavior
- Full-bleed layout using negative margins with compensating padding
- Scrollbar styling with primary color theme for visual consistency
- Works seamlessly with placeholder cards and actual sponsored servers

### Desktop Application (Electron) - October 2025
GameHub Launcher now includes a desktop application built with Electron, providing native mod management and game launching capabilities:

**Architecture:**
- Electron wrapper around existing React web application
- Shared codebase between web and desktop versions
- IPC bridge with secure context isolation (`nodeIntegration: false`, `contextIsolation: true`)
- Desktop-specific features enabled via React Context (`DesktopContext`)

**Core Features:**
- **Steam Integration**: Automatic detection of Steam installation and DayZ game directory
- **Mod Scanner**: Reads Workshop folder to detect installed mods (parses `mod.cpp` files)
- **Mod Management**: Uses Steamworks.js API to subscribe/unsubscribe from Workshop mods
- **Game Launcher**: Builds proper `-mod` parameters using actual Workshop directory paths
- **Settings Persistence**: Uses electron-store for local configuration storage

**Key Files:**
- `desktop/main.js`: Electron main process with Steam integration, mod scanning, IPC handlers
- `desktop/preload.js`: Secure IPC bridge between main and renderer processes
- `client/src/contexts/desktop-context.tsx`: React context for desktop API access
- `client/src/components/desktop-join-modal.tsx`: Desktop-specific join flow with mod detection UI

**API Endpoints:**
- `/api/v2/launcher/servers/dayz`: DZSA-compatible server list with Workshop IDs for desktop launcher

**Distribution via GitHub Actions:**
- Automated builds on GitHub Actions for all platforms (Windows, macOS, Linux)
- Workflow file: `.github/workflows/build-desktop.yml`
- Triggers: On release creation or manual workflow dispatch
- Build outputs:
  - Windows: Portable .exe (~160MB)
  - macOS: .dmg installer (~165MB)
  - Linux: AppImage (~155MB)
- Auto-uploads to GitHub Releases with download links
- Downloads page: `/downloads` with OS detection and direct download buttons
- Full setup guide: `GITHUB_RELEASE_GUIDE.md`

**Download Distribution:**
- Users access `/downloads` page in web app
- Automatic OS detection shows recommended download
- Direct download links from GitHub Releases
- Format: `https://github.com/USER/REPO/releases/latest/download/GameHub-Launcher.{exe|dmg|AppImage}`

**Technical Notes:**
- Cannot build Windows .exe from Linux Replit environment (GitHub Actions handles this)
- Package.json modified during build process (automated in GitHub Actions)
- Desktop and web versions share same React UI and backend API
- Mod launch paths use actual Workshop directories, not server metadata names
- Build configuration: `electron-builder.yml`
- Update process: Create new GitHub release → Automatic builds → Users download latest
