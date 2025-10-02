# DayZ Server Browser

## Overview

A next-generation game launcher and server browser for DayZ with AI-powered features. The application provides a modern web-based interface for discovering, filtering, and joining DayZ servers with automatic mod management and one-click server joining capabilities. Built as a full-stack TypeScript application with React frontend and Express backend.

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
- LocalStorage for persisting user favorites and recent servers
- Session-based preferences stored on backend

**Key Features**
- Server browser with advanced filtering (map, ping, player count, perspective, region, mods)
- Real-time server status updates
- Favorites and recent servers tracking
- Server detail panel with comprehensive server information
- Join modal with multi-step mod validation and download simulation
- Quick filters and saved filter presets

### Backend Architecture

**Server Framework**
- Express.js for HTTP API handling
- TypeScript for type safety across the stack
- ESM module system throughout

**API Design**
- RESTful API endpoints for server operations (`/api/servers`, `/api/stats`)
- JSON request/response format
- Server-side filtering and validation using Zod schemas
- Request logging middleware for API debugging

**Development vs Production**
- Development: Vite middleware integration for hot module replacement
- Production: Static file serving from compiled build
- Conditional Replit-specific plugins for development environment

**Storage Layer**
- In-memory storage implementation (`MemStorage`) for development/demo
- Interface-based storage design (`IStorage`) allows easy swapping to database implementation
- Sample data initialization for immediate functionality

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
- **Servers**: Core server information (address, name, map, players, mods, region, etc.)
- **Server Analytics**: Time-series data for tracking server health and player counts
- **User Preferences**: Session-based user settings, favorites, and filter preferences
- JSON fields for complex data (mods array, tags, filters)

**Current Implementation**
- In-memory storage fallback for development without database
- Production-ready schema defined in `shared/schema.ts`
- Database provisioning required for persistence (Drizzle push command available)

### Authentication and Authorization

**Current State**
- No authentication system implemented
- Session-based tracking using session IDs for user preferences
- LocalStorage used for client-side persistence of favorites/recents

**Design Considerations**
- Session IDs stored in user preferences table for server-side preference persistence
- Future-ready for authentication layer addition (Steam OAuth would be natural fit for DayZ)

### External Dependencies

**Steam Integration**
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