# DayZ Server Launcher - Design Guidelines

## Design Approach

**Reference-Based Gaming Aesthetic**: Inspired by Discord's modern gaming UI, Battle.net launcher's information density, and Valorant's neon aesthetic. Combines dark glassmorphism with cyberpunk-inspired neon accents to create a high-tech, trustworthy gaming environment.

## Core Design Elements

### A. Color Palette

**Dark Mode Foundation** (all colors in H S% L% format):
- Background Base: 220 20% 8%
- Surface Dark: 220 18% 12%
- Surface Light: 220 16% 16%
- Glass Overlay: 220 15% 18% with 40% opacity

**Neon Accent System**:
- Primary Cyan: 190 95% 55%
- Secondary Blue: 210 90% 60%
- Trust Green: 145 75% 50%
- Warning Amber: 40 95% 55%
- Danger Red: 0 85% 60%

**Grade Badge Colors**:
- S-Tier: 280 75% 65% (vibrant purple)
- A-Tier: 145 75% 50% (green)
- B-Tier: 190 85% 55% (cyan)
- C-Tier: 40 90% 55% (amber)
- D-Tier: 25 85% 55% (orange)
- F-Tier: 0 85% 60% (red)

**Text Hierarchy**:
- Primary Text: 0 0% 95%
- Secondary Text: 220 10% 70%
- Tertiary Text: 220 8% 55%

### B. Typography

**Font Stack**: 'Inter' for UI, 'JetBrains Mono' for technical data/scores
- Hero/Display: 700 weight, 2.5rem-4rem
- Section Headers: 600 weight, 1.5rem-2rem
- Body: 400 weight, 0.875rem-1rem
- Technical Data: 500 weight, 0.75rem-0.875rem (mono)

### C. Layout System

**Spacing Units**: Tailwind's 4, 6, 8, 12, 16, 20 for consistent rhythm
- Component padding: p-6, p-8
- Section spacing: gap-6, gap-8
- Card margins: m-4, m-6

### D. Glassmorphism Components

**Glass Card Pattern**:
- Background: backdrop-blur-xl with 40% opacity surface color
- Border: 1px solid with 15% white opacity
- Inner glow: inset shadow with cyan tint
- Hover state: brightness increase + cyan border glow

**Server List Cards**:
- Large glass cards with rounded-2xl corners
- Left accent border (4px) color-coded by grade
- Three-column layout: Server Info | Stats Grid | Trust Indicators
- Badge cluster in top-right corner

**Grade Badge Design**:
- Hexagonal or shield-shaped badges
- Bold letter (S/A/B/C/D/F) with matching color background
- Subtle glow effect matching grade color
- 48x48px size with 2px border

**Trust Score Display**:
- Circular progress ring (80px diameter)
- Percentage in center (mono font, 1.25rem)
- Color transitions: 0-50% red, 51-75% amber, 76-100% green
- Animated fill on load

**Verification Badges**:
- Small icon badges (24x24px) with neon outline
- Verified: checkmark in cyan circle
- Premium: star in purple circle
- Official: shield in blue circle

**Warning Indicators**:
- Prominent red-bordered alert boxes with glass background
- Fraud warning: triangle icon + bold text
- Positioned above fold for critical servers

### E. Layout Structure

**Main Interface** (single-page app layout):

1. **Top Navigation Bar** (h-16):
   - Glass bar with logo left, search center, user profile right
   - Quick filters: Favorites, Official, Verified
   - Cyan neon underline on active tab

2. **Hero Section** (h-64):
   - Full-width dark gradient background (220 25% 6% to 220 20% 10%)
   - Large heading: "Discover Trusted DayZ Servers"
   - Live player count badge + total servers metric
   - Featured server carousel with 3 cards

3. **Filter Sidebar** (w-72, sticky):
   - Glass panel with filter categories
   - Grade filter with colored checkboxes
   - Trust score slider (0-100)
   - Map selector, player count range
   - Apply filters button with cyan glow

4. **Server Grid** (flex-1):
   - Masonry-style grid (2 columns on desktop)
   - Each card shows: Server name, map preview, player count (current/max), ping, grade badge, trust score ring, quick stats (uptime, mods count), verified badges row
   - Hover: card lifts with cyan shadow glow

5. **Server Detail Modal**:
   - Full-screen overlay with intense blur
   - Large glass panel (max-w-6xl)
   - Two-column: Left (server image, description, rules), Right (detailed stats, trust metrics, player graph, fraud warnings if applicable)
   - Join server button: large, cyan gradient with pulse animation

### F. Trust Visualization Hierarchy

**Critical Information First**:
- Grade badge: top-left, 56x56px
- Trust score: top-right as ring
- Fraud warnings: red banner below header
- Verification badges: below trust score

**Secondary Metrics Grid** (4 columns):
- Uptime percentage with progress bar
- Average player count with sparkline graph
- Mod count with icon
- Server age with calendar icon

**Color-Coding Rules**:
- Use grade color for left card accent
- Trust score ring color matches percentage tier
- Warning text always red (0 85% 60%)
- Verified indicators always cyan (190 95% 55%)

## Images Section

**Hero Background**: Dark atmospheric DayZ landscape with slight blue tint overlay, 1920x400px, subtle vignette effect

**Server Card Thumbnails**: Map preview images (320x180px) for each server showing distinctive landmarks, placed at card top with slight rounded corners

**Modal Server Images**: Large feature image (800x450px) showing server highlights or map overview, placed at top of detail modal

**Logo/Branding**: Neon-style DayZ launcher logo in header (180x40px) with cyan glow effect

## Component Specifications

**Search Bar**: Glass input with cyan focus ring, magnifying glass icon left, filter dropdown right, width 480px

**Join Button**: h-14, rounded-lg, cyan-to-blue gradient (190 95% 55% to 210 90% 60%), white text (700 weight), subtle box-shadow with cyan glow

**Player Count Badge**: Inline flex with green dot indicator, mono font showing "243/300", gray background with 30% opacity

**Ping Indicator**: Color-coded circles: <50ms green, 50-100ms amber, >100ms red, with ms value in mono font