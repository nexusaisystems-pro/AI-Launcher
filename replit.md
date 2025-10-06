# GameHub - Multi-Game Server Browser Platform

## Overview

A next-generation multi-game launcher and server browser platform with AI-powered features. Currently supporting DayZ with architecture designed for easy expansion to other games (Rust, Arma 3, Squad, etc.). The platform provides a modern web-based interface for discovering, filtering, and joining game servers with automatic mod management and one-click server joining capabilities. Built as a full-stack TypeScript application with React frontend and Express backend.

**Three-Portal Architecture:**
- **Public Launcher** (/) - Server browser for players (no auth required)
- **Owner Dashboard** (/owner) - Server management portal for server owners (auth required)
- **Admin Panel** (/admin) - Platform administration and monitoring (admin auth required)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server, providing fast HMR and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching with built-in caching

**UI Component System**
- Shadcn/ui component library based on Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Dark mode theme with custom color scheme (primary cyan/accent colors)
- Component aliases configured for clean imports (`@/components`, `@/lib`, `@/hooks`)

**State Management Strategy**
- Server state managed through React Query with 30-second stale time and 60-second auto-refetch intervals
- Local state for UI interactions using React hooks
- **User preferences (favorites/recents) synced to PostgreSQL backend** via session ID
- LocalStorage used as fallback/backup for offline resilience and migration
- Session ID generated with nanoid and persisted in localStorage

**Performance Optimizations** (October 2025)
- **Virtualized Scrolling**: List view uses @tanstack/react-virtual for efficient rendering of large server lists
  - Only visible items (+overscan buffer of 5) are rendered in the DOM
  - Dynamic height measurement for accurate scrolling
  - Estimated item size of 200px with automatic adjustment
- **Memoization Strategy**:
  - ServerCard component wrapped with React.memo to prevent unnecessary re-renders
  - Filtering and sorting operations optimized with useMemo hooks
  - Stable callback references using memoized Map lookups (selectHandlers, joinHandlers)
  - Handler maps keyed by server.address to maintain referential stability
- **View Mode Handling**:
  - List view: Single-column layout with virtualization for hundreds of servers
  - Grid view: Responsive CSS Grid (1/2/3 columns) without virtualization to maintain grid layout
- **Rendering Efficiency**: With virtualization, only ~10-20 server cards render at any time regardless of total server count

**Key Features**
- Server browser with advanced filtering (map, ping, player count, perspective, region, mods)
- Real-time server status updates
- **Favorites and recent servers with backend persistence** (survives page reload)
- Server detail panel with comprehensive server information
- Join modal with multi-step mod validation and download simulation
- Quick filters and saved filter presets
- Neon glassmorphism UI with animated backgrounds and smooth transitions
- **Server Intelligence Integration** (October 2025):
  - Quality grade badges (S/A/B/C/D/F) with color-coded visual hierarchy
  - Animated trust score rings showing server reliability (0-100 scale)
  - Fraud detection warnings for servers with suspicious metrics
  - Intelligence tab in detail panel with comprehensive trust metrics
  - Quality-based filtering and sorting options

### Backend Architecture

**Server Framework**
- Express.js for HTTP API handling
- TypeScript for type safety across the stack
- ESM module system throughout
- A2S Protocol integration via `steam-server-query` library for real-time server querying

**API Design**
- RESTful API endpoints for server operations (`/api/servers`, `/api/stats`)
- User preferences endpoints (`/api/preferences/:sessionId` GET/POST)
- A2S Protocol endpoints (`/api/servers/discover`, `/api/servers/query/:address`, `/api/servers/refresh`)
- JSON request/response format
- Server-side filtering and validation using Zod schemas
- Request logging middleware for API debugging

**A2S Service Layer**
- Real-time server discovery from Steam master servers
- Query individual DayZ servers for live player counts, ping, maps, mods
- Multi-server querying with Promise.allSettled for reliability
- Automatic mod parsing from server keywords
- Region detection based on IP geolocation
- Perspective detection (1PP/3PP) from server metadata

**Development vs Production**
- Development: Vite middleware integration for hot module replacement
- Production: Static file serving from compiled build
- Conditional Replit-specific plugins for development environment

**Storage Layer**
- PostgreSQL database with Drizzle ORM for persistent storage
- Neon Database serverless driver for PostgreSQL connectivity
- Interface-based storage design (`IStorage`) implemented by `DatabaseStorage`
- Optimized SQL queries with WHERE clauses, NULL handling, and aggregations

### Data Storage Solutions

**Database Technology**
- PostgreSQL as primary database (configured via Drizzle)
- Neon Database serverless driver for PostgreSQL connectivity
- Connection via `DATABASE_URL` environment variable

**ORM & Schema Management**
- Drizzle ORM for type-safe database queries
- Drizzle Kit for schema migrations (output to `./migrations`)
- Schema-first design with TypeScript types generated from database schema

**Data Models**
- **Games** (Added October 2025): Multi-game support table with game metadata, query protocols, Steam app IDs
- **Users** (Added October 2025): Authentication for server owners and admins (email, Steam OAuth, roles)
- **Servers**: Core server information with gameId foreign key (address, name, map, players, mods, region, etc.)
- **Server Owners**: Ownership records linking users to their claimed servers
- **Pending Claims** (Added October 2025): Server claim verification workflow with token validation and admin review
- **Server Analytics**: Time-series data for tracking server health and player counts
- **User Preferences**: Session-based user settings, favorites, and filter preferences
- **Workshop Mods**: Cached Steam Workshop mod metadata (title, description, fileSize, previewUrl, tags, creator, subscriberCount) with 7-day cache freshness
- **Admin Activity Log** (Added October 2025): Audit trail for admin actions
- **System Metrics** (Added October 2025): Platform monitoring metrics (API calls, cache hits, query stats)
- JSON fields for complex data (mods array, tags, filters, game features)

**Current Implementation**
- PostgreSQL database provisioned and active
- Production-ready schema defined in `shared/schema.ts`
- Database migrations managed via `npm run db:push` (Drizzle Kit)
- Seed data script available in `server/seed.ts`

### Authentication and Authorization

**Current State**
- No authentication system implemented
- **Session-based tracking with unique nanoid-generated IDs stored in localStorage**
- User preferences (favorites/recents) fully synced to PostgreSQL backend
- Seamless migration from legacy localStorage-only storage

**Design Considerations**
- Session IDs map to userPreferences table records for backend persistence
- Future-ready for authentication layer addition (Steam OAuth would be natural fit for DayZ)
- Current session approach works offline-first with backend sync when available

### External Dependencies

**Steam Integration**
- **Steam Workshop API Integration** (October 2025):
  - Real mod metadata fetching (titles, descriptions, file sizes, thumbnails, subscriber counts)
  - PostgreSQL caching layer with 7-day freshness checks
  - Intelligent error handling with 502 responses when Steam API unavailable
  - Backend service (`SteamWorkshopService`) for API communication
  - Frontend hook (`useWorkshopMods`) for React Query integration
  - Enhanced mod display in Server Detail Panel with Workshop links
- Steam Workshop for mod downloads and management
- Steam launch protocol (`steam://rungameid/221100`) for game launching
- Workshop URLs constructed from mod workshop IDs
- Mod metadata includes Steam Workshop IDs for each required mod

**Third-Party Services (Planned/Referenced)**
- DayZ server query protocol for real-time server status
- Master server list integration for server discovery
- AI-powered server recommendations (referenced in feature blueprint)

**UI Libraries**
- Radix UI primitives for accessible component foundation
- Lucide React for icon system
- date-fns for date/time formatting
- embla-carousel for carousel functionality
- cmdk for command palette patterns

**Development Tools**
- Replit-specific plugins for development environment
- TypeScript compiler for type checking
- ESBuild for server bundling in production

**Validation & Forms**
- Zod for runtime schema validation
- React Hook Form with Zod resolvers for form handling
- Drizzle-Zod for automatic schema validation from database models