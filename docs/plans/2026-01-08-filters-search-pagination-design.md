# Video Filtering, Search, and Pagination Design

**Date:** 2026-01-08
**Status:** Approved
**Author:** Claude (with user input)

## Overview

Add comprehensive filtering, search, and fix pagination for the YouTube Analytics Dashboard. Users need to filter videos by date range, search across titles/descriptions/types, and view filtered KPI metrics. Current pagination issue causes videos to reload from beginning instead of continuing from last loaded position.

## Requirements

### Date Range Filtering
- **Preset ranges:** Last 7 days, 30 days, 90 days, All time
- **Custom range:** User-selectable start and end dates
- Both options available in single dropdown

### Search Functionality
- Search across: video titles, descriptions, and type (shorts/videos)
- Real-time database queries (not client-side filtering)
- Debounced to avoid excessive queries (500ms delay)

### KPI Behavior
- KPIs (Total Views, Likes, Engagement, etc.) update based on filtered results
- Show metrics only for videos matching current filters

### Pagination Fix
- "Load More" should append to existing videos, not reload from start
- Pagination should work correctly with filters applied

## Architecture

### State Management

Add new state variables to `App.jsx`:

```javascript
// Per-channel filter state
const [filters, setFilters] = useState({
  // channelId: { dateRange, searchQuery, typeFilter }
});

// Date range structure
dateRange: {
  preset: 'all' | '7d' | '30d' | '90d' | 'custom',
  startDate: Date | null,
  endDate: Date | null
}

// Search query
searchQuery: string

// Type filter
typeFilter: 'all' | 'video' | 'short'
```

### Data Flow

1. User changes filter → Update filter state
2. Filter state changes → Call `loadChannel(channelId, 0, newFilters)`
3. `loadChannel` builds dynamic Supabase query with WHERE clauses
4. Database returns filtered results → Update videos state
5. KPIs recalculate from filtered videos array
6. Pagination tracks position within filtered results

### Key Principles

- All filtering happens on database side (efficient, scalable)
- Filters are per-channel (switching channels preserves each channel's filters)
- Changing any filter resets pagination to page 0
- KPIs derive from currently displayed videos (reactive)

## UI/UX Design

### Filter Bar Component

Located between channel selector and KPI cards:

```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Search videos...]     [All|Videos|Shorts]  [Date Range▼] │
│  Showing 25 videos                              Clear filters │
└─────────────────────────────────────────────────────────────┘
```

**Layout:**
- **Left:** Search input (icon + text field, flex-grow)
- **Center:** Content type pills (toggle buttons)
- **Right:** Date range dropdown
- **Bottom:** Result count + "Clear all filters" link

### Search Input

- Placeholder: "Search videos by title, description, or type..."
- Debounced 500ms to avoid query spam
- Search icon (🔍) on left
- Clear button (×) appears when text entered

### Content Type Pills

Three toggle buttons:
- **All** (default, accent-cyan when active)
- **Videos** (youtube-red when active)
- **Shorts** (accent-cyan when active)

### Date Range Dropdown

**Closed state:** Shows current selection
- "All time" (default)
- "Last 7 days"
- "Dec 1 - Dec 31, 2025" (custom range)

**Open state:** Dropdown menu
```
┌─────────────────────┐
│ ○ All time         │
│ ○ Last 7 days      │
│ ○ Last 30 days     │
│ ○ Last 90 days     │
├─────────────────────┤
│ ○ Custom range     │
│   Start: [date]    │
│   End:   [date]    │
│   [Apply]          │
└─────────────────────┘
```

### Visual Feedback

- Active filters highlighted with cyan accent
- "Showing X videos" updates in real-time
- "Clear all filters" link only visible when filters active
- Smooth transitions when videos update

## Database Query Implementation

### Dynamic Query Building

```javascript
async function loadChannel(channelId, page = 0, filters = null) {
  // Get active filters for this channel
  const activeFilters = filters || filters[channelId] || getDefaultFilters();

  // Start building query
  let query = supabase
    .from('videos')
    .select('*')
    .eq('channel_id', channelId);

  // Apply date range filter
  if (activeFilters.dateRange.preset !== 'all') {
    const { startDate, endDate } = calculateDateRange(activeFilters.dateRange);
    query = query
      .gte('published_at', startDate.toISOString())
      .lte('published_at', endDate.toISOString());
  }

  // Apply search filter
  if (activeFilters.searchQuery) {
    const search = activeFilters.searchQuery;
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply type filter
  if (activeFilters.typeFilter !== 'all') {
    query = query.eq('type', activeFilters.typeFilter);
  }

  // Pagination
  const from = page * videosPerPage;
  const to = from + videosPerPage - 1;

  query = query
    .order('published_at', { ascending: false })
    .range(from, to);

  // Execute query
  const { data: videos, error } = await query;

  // Get count with same filters for "hasMore"
  const { count } = await buildCountQuery(channelId, activeFilters);

  // Update state
  setChannels(prev => prev.map(ch => {
    if (ch.id === channelId) {
      const existingVideos = page === 0 ? [] : ch.videos;
      return {
        ...ch,
        videos: [...existingVideos, ...videos]
      };
    }
    return ch;
  }));

  setHasMore(prev => ({
    ...prev,
    [channelId]: (from + videos.length) < count
  }));
}
```

### Helper Functions

```javascript
function calculateDateRange(dateRange) {
  const end = new Date();
  let start = new Date();

  switch(dateRange.preset) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case 'custom':
      return { startDate: dateRange.startDate, endDate: dateRange.endDate };
    default:
      return null; // 'all' - no filter
  }

  return { startDate: start, endDate: end };
}

function buildCountQuery(channelId, filters) {
  // Apply same filters as main query
  let countQuery = supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId);

  // Apply same date/search/type filters...
  // (same logic as loadChannel)

  return countQuery;
}

function getDefaultFilters() {
  return {
    dateRange: { preset: 'all', startDate: null, endDate: null },
    searchQuery: '',
    typeFilter: 'all'
  };
}
```

## Component Structure

### New Components

#### 1. FilterBar.jsx
Main container for all filter controls.

**Props:**
```javascript
{
  filters: { dateRange, searchQuery, typeFilter },
  onFilterChange: (newFilters) => void,
  videoCount: number,
  onClearFilters: () => void
}
```

**Responsibilities:**
- Layout filter controls
- Show video count
- Show/hide "Clear filters" link
- Emit filter changes to parent

#### 2. DateRangePicker.jsx
Date selection dropdown.

**Props:**
```javascript
{
  value: { preset, startDate, endDate },
  onChange: (dateRange) => void
}
```

**State:**
- `isOpen: boolean` - dropdown visibility
- `tempCustom: { start, end }` - staging for custom dates before "Apply"

**Responsibilities:**
- Render preset options
- Render custom date inputs
- Handle selection and emit changes
- Close dropdown on selection

#### 3. SearchInput.jsx
Debounced search field.

**Props:**
```javascript
{
  value: string,
  onChange: (query: string) => void,
  placeholder: string
}
```

**Implementation:**
```javascript
const [localValue, setLocalValue] = useState(value);

useEffect(() => {
  const timer = setTimeout(() => {
    onChange(localValue);
  }, 500);

  return () => clearTimeout(timer);
}, [localValue]);
```

**Responsibilities:**
- Debounce user input
- Show clear button
- Emit changes to parent after delay

### Modified Components

#### App.jsx Changes

**New State:**
```javascript
const [filters, setFilters] = useState({});
```

**New Handler:**
```javascript
const handleFilterChange = (channelId, newFilters) => {
  // Update filter state
  setFilters(prev => ({
    ...prev,
    [channelId]: newFilters
  }));

  // Reset pagination and reload
  setLoadedPages(prev => ({ ...prev, [channelId]: 0 }));
  loadChannel(channelId, 0, newFilters);
};
```

**Modified loadChannel:**
- Accept `filters` parameter
- Build dynamic query based on filters
- Apply same filters to count query

**KPI Calculation:**
- No changes needed - KPIs already calculate from `videos` array
- Since `videos` updates with filtered results, KPIs automatically reflect filters

## Pagination Fix

### Current Bug

**Location:** `App.jsx:435`

**Problem:**
```javascript
const existingVideos = page === 0 ? [] : ch.videos;
```

When "Load More" is clicked, it passes `loadedPages[channelId]` but this may not match the actual page number being loaded, causing videos to clear and reload from start.

### Solution

**Track pages correctly:**
```javascript
const loadMoreVideos = () => {
  const currentPage = loadedPages[activeChannelId] || 0;
  loadChannel(activeChannelId, currentPage, filters[activeChannelId]);
};
```

**In loadChannel:**
```javascript
// Only clear videos if explicitly starting over (page 0)
const existingVideos = page === 0 ? [] : (ch.videos || []);

// Update loaded page count after successful load
setLoadedPages(prev => ({
  ...prev,
  [channelId]: page + 1
}));
```

**On filter change:**
```javascript
// Reset pagination when filters change
setLoadedPages(prev => ({ ...prev, [channelId]: 0 }));
loadChannel(channelId, 0, newFilters);
```

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Add filter state to App.jsx
- [ ] Modify loadChannel to accept filters parameter
- [ ] Implement dynamic query building
- [ ] Implement count query with filters
- [ ] Fix pagination logic (track pages correctly)

### Phase 2: Filter Components
- [ ] Create SearchInput component with debounce
- [ ] Create DateRangePicker component
- [ ] Create FilterBar component
- [ ] Add content type pill buttons

### Phase 3: Integration
- [ ] Add FilterBar to App.jsx layout
- [ ] Wire up filter change handlers
- [ ] Implement "Clear filters" functionality
- [ ] Add "Showing X videos" counter

### Phase 4: Polish
- [ ] Add loading states during filter changes
- [ ] Test pagination with filters
- [ ] Test date range presets
- [ ] Test custom date ranges
- [ ] Test search debouncing
- [ ] Test type filter combinations

## Edge Cases & Error Handling

### Empty Results
- Show "No videos match your filters" message
- Offer "Clear filters" button
- Keep KPI cards but show zeros

### Invalid Date Ranges
- Validate start date < end date
- Disable "Apply" if invalid
- Show error message in dropdown

### Search Query Escaping
- Escape special characters in search query
- Handle SQL injection via parameterized queries (Supabase handles this)

### Network Errors
- Show error message if query fails
- Offer retry button
- Don't clear existing videos on error

### Channel Switching
- Preserve per-channel filters
- Load correct filters when switching
- Reset to defaults for new channels

## Testing Strategy

### Manual Testing
1. Apply each preset date range, verify correct videos shown
2. Apply custom date range, verify filtering works
3. Search for video title, verify results
4. Search for description keyword, verify results
5. Filter by type (shorts/videos), verify correct content shown
6. Combine filters, verify all apply together
7. Click "Load More", verify appends (doesn't reload)
8. Change filter, verify pagination resets
9. Switch channels, verify filters persist per channel
10. Clear filters, verify returns to default state

### Edge Cases to Test
- Search with no results
- Date range with no videos
- Start date > end date (should prevent)
- Empty search query
- Special characters in search
- Very long search query
- Rapid filter changes (debouncing)
- Network failure during filter

## Future Enhancements

### Phase 2 Considerations
- Save filter preferences to localStorage
- URL query parameters for shareable filtered views
- Advanced filters: view count ranges, like count ranges
- Sort options (by views, likes, date)
- Export filtered results to CSV
- Filter preset saving ("My Filters")

## Success Metrics

- Users can find specific videos via search
- Users can analyze performance over specific time periods
- KPIs accurately reflect filtered results
- Pagination works smoothly with filters applied
- UI remains responsive during filtering (debouncing works)
