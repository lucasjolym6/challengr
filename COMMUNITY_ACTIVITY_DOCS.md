# Community Activity Section - Documentation

## Overview
The Community Activity section on the Home page has been completely refactored to provide a premium, motivating experience with realistic KPIs and social proof elements.

## Components Architecture

### 1. **HeroStat** (`src/components/home/HeroStat.tsx`)
- **Purpose**: Full-width hero stat with animated number and pulsing icon
- **Features**:
  - Gradient background with brand colors
  - Framer Motion animations (scale, opacity, count-up)
  - Pulsing icon animation with CSS keyframes
  - Responsive design with mobile-first approach

### 2. **KPIGrid** (`src/components/home/KPIGrid.tsx`)
- **Purpose**: 2x2 mosaic grid of KPI tiles
- **Features**:
  - 4 animated stat tiles with icons and captions
  - Framer Motion staggered animations
  - Hover effects and micro-interactions
  - Responsive grid (2 cols mobile, 4 cols desktop)

### 3. **SocialCarousel** (`src/components/home/SocialCarousel.tsx`)
- **Purpose**: Horizontal scrollable micro-feed of recent activities
- **Features**:
  - Smooth horizontal scrolling with snap points
  - Avatar + action + challenge info
  - Gradient fade edges for visual polish
  - Graceful empty state handling

### 4. **CommunityActivity** (`src/components/home/CommunityActivity.tsx`)
- **Purpose**: Main container orchestrating all sub-components
- **Features**:
  - Fetches real data from Supabase
  - Integrates KPI store for persistent data
  - Handles loading states and error boundaries

## Data Logic & Persistence

### KPI Store (`src/lib/kpiStore.ts`)
Implements sophisticated persistence logic:

#### Daily Persistent Randoms
- **Challenges launched today**: 20-50 (persistent per day)
- **Streaks continued today**: 50-150 (persistent per day)  
- **Validation rate today**: 60-90% (persistent per day)

#### Weekly Progressive Logic
- **Challenges completed this week**: Progressive cumulative total
- Uses ISO week-based seeding for consistent weekly patterns
- Generates 7-day sequences that:
  - Start low and increase throughout the week
  - Sum to 180-199 (never exactly 200)
  - Vary week-to-week with different patterns
  - Are strictly monotonic (cumulative always increasing)

#### Technical Implementation
- Linear Congruential Generator (LCG) for stable pseudo-randoms
- Week-based seeds: `YYYY-WW` format
- localStorage persistence with automatic cleanup
- Base distribution scaling with noise injection

## UI/UX Features

### Design System
- **Style**: Duolingo + Strava inspired
- **Colors**: Brand gradients with orange-red-pink hero stat
- **Typography**: Bold numbers, clean captions
- **Spacing**: Generous whitespace, rounded-2xl corners

### Animations
- **Mount animations**: Staggered reveals with delays
- **Number counting**: Framer Motion count-up effects
- **Hover states**: Scale transforms and shadow changes
- **Pulsing icons**: CSS keyframe animations

### Responsive Design
- **Mobile-first**: Optimized for small screens
- **Grid system**: 2x2 on mobile, 4x1 on desktop
- **Carousel**: Horizontal scroll with snap points
- **Typography**: Scales appropriately across breakpoints

## Data Sources

### Supabase Integration
- **Recent Activities**: `user_challenges` joined with `profiles` and `challenges`
- **Real-time**: Shows actual user actions (completed, started challenges)
- **Fallback**: Gracefully handles empty states
- **Performance**: Limited to 10 most recent activities

### Local Storage
- **Daily KPIs**: Cached with YYYY-MM-DD keys
- **Weekly sequences**: Cached with YYYY-WW keys
- **Automatic cleanup**: Old data expires naturally

## Performance Optimizations

### Code Splitting
- Components are modular and tree-shakeable
- Lazy loading for non-critical animations
- Minimal bundle impact

### Caching Strategy
- localStorage for KPI persistence
- Supabase query optimization with limits
- Graceful degradation for network issues

### Animation Performance
- Hardware-accelerated transforms
- Reduced motion respect for accessibility
- Efficient Framer Motion configurations

## Accessibility Features

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for interactive elements
- Alt text for icons and images

### Motion Preferences
- Respects `prefers-reduced-motion`
- Fallback static states
- No essential information lost without animations

## Integration Points

### Home Page Integration
- Replaces old simple KPI cards
- Maintains section ordering:
  1. User Status (avatar, level, progress)
  2. Active Challenges (conditional)
  3. **Community Activity** (new section)
  4. Featured Challenges (conditional)

### Navigation Flow
- Social carousel items don't navigate (display only)
- KPI tiles are informational (no click actions)
- Hero stat is purely motivational

## Future Enhancements

### Potential Additions
- Real-time WebSocket updates for live KPIs
- More sophisticated social proof algorithms
- A/B testing for different KPI presentations
- User preference customization

### Performance Improvements
- Virtual scrolling for large activity feeds
- Service worker caching for offline KPIs
- Progressive loading strategies

## Testing Considerations

### Unit Tests
- KPI store logic and persistence
- Component rendering with mock data
- Animation timing and state management

### Integration Tests
- Supabase data fetching and error handling
- localStorage persistence across sessions
- Responsive behavior across devices

### User Testing
- Motivation impact measurement
- Engagement metrics tracking
- Accessibility compliance validation
