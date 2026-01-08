# Filters, Search, and Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add date range filters, video search, and fix pagination to enable users to analyze specific time periods and find videos quickly.

**Architecture:** Database-side filtering using dynamic Supabase queries. Per-channel filter state with debounced search. New components (SearchInput, DateRangePicker, FilterBar) integrated into App.jsx.

**Tech Stack:** React 18, Supabase JS Client, Tailwind CSS

---

## Task 1: Fix Pagination Bug

**Files:**
- Modify: `src/App.jsx:549-552`
- Modify: `src/App.jsx:393-487`

**Step 1: Fix loadMoreVideos function**

Replace the current loadMoreVideos function:

```javascript
// Load more videos (pagination)
const loadMoreVideos = () => {
  const currentPage = loadedPages[activeChannelId] || 0;
  loadChannel(activeChannelId, currentPage);
};
```

**Step 2: Fix loadChannel to properly track pages**

In the `loadChannel` function at line 456, change:

```javascript
setLoadedPages(prev => ({ ...prev, [channelId]: page + 1 }));
```

**Step 3: Test pagination manually**

1. Start dev server: `npm run dev`
2. Load a channel with videos
3. Click "Load More"
4. Verify: New videos append (don't reload from start)
5. Click "Load More" again
6. Verify: More videos append correctly

**Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "fix: pagination now appends videos instead of reloading

- Track loaded pages correctly per channel
- Load More button passes current page count
- Videos append instead of clearing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create SearchInput Component

**Files:**
- Create: `src/components/SearchInput.jsx`

**Step 1: Create SearchInput component with debounce**

```jsx
import React, { useState, useEffect } from 'react';

const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  const handleClear = () => {
    setLocalValue('');
  };

  return (
    <div className="relative flex-1 min-w-[200px] max-w-md">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-10 py-2 text-white text-sm outline-none focus:border-accent-cyan transition-colors"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchInput;
```

**Step 2: Test component manually**

1. Create temporary test page or add to App temporarily
2. Type in search box
3. Verify: onChange fires 500ms after typing stops
4. Verify: Clear button appears when text entered
5. Verify: Clear button clears text

**Step 3: Commit**

```bash
git add src/components/SearchInput.jsx
git commit -m "feat: add SearchInput component with 500ms debounce

- Debounced onChange to reduce query spam
- Clear button appears when text present
- Styled to match app theme

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create DateRangePicker Component

**Files:**
- Create: `src/components/DateRangePicker.jsx`

**Step 1: Create DateRangePicker component**

```jsx
import React, { useState, useRef, useEffect } from 'react';

const DateRangePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const presets = [
    { label: 'All time', value: 'all' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
  ];

  const handlePresetSelect = (preset) => {
    onChange({ preset, startDate: null, endDate: null });
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);

      if (start <= end) {
        onChange({ preset: 'custom', startDate: start, endDate: end });
        setIsOpen(false);
      }
    }
  };

  const getDisplayText = () => {
    if (value.preset === 'custom' && value.startDate && value.endDate) {
      const start = value.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = value.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }

    const preset = presets.find(p => p.value === value.preset);
    return preset ? preset.label : 'All time';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {getDisplayText()}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1a1a2e] border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Presets */}
          <div className="p-2">
            {presets.map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePresetSelect(preset.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  value.preset === preset.value
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-2" />

          {/* Custom Range */}
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2">Custom range</div>
            <div className="space-y-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent-cyan"
                placeholder="Start date"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent-cyan"
                placeholder="End date"
              />
              <button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className="w-full bg-gradient-to-r from-accent-cyan to-accent-green px-4 py-2 rounded-lg text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
```

**Step 2: Test component manually**

1. Add to App temporarily
2. Click date picker button
3. Verify: Dropdown opens with presets
4. Click preset
5. Verify: Dropdown closes, button text updates
6. Open again, enter custom dates
7. Click Apply
8. Verify: Button shows date range

**Step 3: Commit**

```bash
git add src/components/DateRangePicker.jsx
git commit -m "feat: add DateRangePicker component

- Preset ranges (7d, 30d, 90d, all)
- Custom date range with validation
- Dropdown closes on outside click
- Styled to match app theme

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create FilterBar Component

**Files:**
- Create: `src/components/FilterBar.jsx`

**Step 1: Create FilterBar component**

```jsx
import React from 'react';
import SearchInput from './SearchInput';
import DateRangePicker from './DateRangePicker';

const FilterBar = ({ filters, onFilterChange, videoCount, onClearFilters }) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.typeFilter !== 'all' ||
    filters.dateRange.preset !== 'all';

  const handleSearchChange = (query) => {
    onFilterChange({ ...filters, searchQuery: query });
  };

  const handleTypeChange = (type) => {
    onFilterChange({ ...filters, typeFilter: type });
  };

  const handleDateChange = (dateRange) => {
    onFilterChange({ ...filters, dateRange });
  };

  return (
    <div className="mb-8 animate-slide-in">
      {/* Main filter row */}
      <div className="flex items-center gap-4 mb-3">
        {/* Search */}
        <SearchInput
          value={filters.searchQuery}
          onChange={handleSearchChange}
          placeholder="Search videos by title, description, or type..."
        />

        {/* Type filter pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTypeChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filters.typeFilter === 'all'
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTypeChange('video')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filters.typeFilter === 'video'
                ? 'bg-youtube-red/20 text-youtube-red border border-youtube-red/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => handleTypeChange('short')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filters.typeFilter === 'short'
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Shorts
          </button>
        </div>

        {/* Date range picker */}
        <DateRangePicker
          value={filters.dateRange}
          onChange={handleDateChange}
        />
      </div>

      {/* Result count and clear filters */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-500">
          Showing <span className="text-white font-semibold">{videoCount}</span> videos
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-accent-cyan hover:text-accent-green transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
```

**Step 2: Test component manually**

1. Add to App with mock props
2. Change each filter type
3. Verify: Callbacks fire with correct data
4. Verify: Active filter styling works
5. Verify: "Clear filters" button appears when filters active
6. Click "Clear filters"
7. Verify: Callback fires

**Step 3: Commit**

```bash
git add src/components/FilterBar.jsx
git commit -m "feat: add FilterBar component

- Integrates SearchInput and DateRangePicker
- Type filter pills (All/Videos/Shorts)
- Shows video count
- Clear filters button when active

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Filter State to App.jsx

**Files:**
- Modify: `src/App.jsx:359-374`

**Step 1: Add filter state and helper functions**

After the existing state declarations (around line 374), add:

```javascript
// Filter state (per channel)
const [filters, setFilters] = useState({});

// Get default filters
const getDefaultFilters = () => ({
  dateRange: { preset: 'all', startDate: null, endDate: null },
  searchQuery: '',
  typeFilter: 'all'
});

// Get filters for active channel
const getActiveFilters = (channelId) => {
  return filters[channelId] || getDefaultFilters();
};
```

**Step 2: Verify code compiles**

Run: `npm run dev`
Expected: No errors, app loads normally

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add filter state management to App

- Per-channel filter state
- Default filter helpers
- Getter for active channel filters

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Add Date Range Calculation Helper

**Files:**
- Modify: `src/App.jsx` (add before loadChannel function)

**Step 1: Add calculateDateRange helper**

Add this function before the `loadChannel` function:

```javascript
// Calculate date range based on preset or custom dates
const calculateDateRange = (dateRange) => {
  if (dateRange.preset === 'all') {
    return null;
  }

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
      return {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
    default:
      return null;
  }

  return { startDate: start, endDate: end };
};
```

**Step 2: Verify code compiles**

Run: `npm run dev`
Expected: No errors

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add date range calculation helper

- Converts presets to date ranges
- Handles custom date ranges
- Returns null for 'all' (no filter)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Modify loadChannel to Accept Filters

**Files:**
- Modify: `src/App.jsx:393-487` (loadChannel function)

**Step 1: Update loadChannel signature and add filter logic**

Replace the loadChannel function with:

```javascript
const loadChannel = async (channelId, page = 0, channelFilters = null) => {
  setLoading(true);
  setError(null);

  // Get filters for this channel
  const activeFilters = channelFilters || getActiveFilters(channelId);

  try {
    // If Supabase is configured, try loading from there first
    if (supabase) {
      // Fetch channel info
      const { data: channelData } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      // Build filtered query for videos
      let query = supabase
        .from('videos')
        .select('*')
        .eq('channel_id', channelId);

      // Apply date range filter
      const dateRange = calculateDateRange(activeFilters.dateRange);
      if (dateRange) {
        query = query
          .gte('published_at', dateRange.startDate.toISOString())
          .lte('published_at', dateRange.endDate.toISOString());
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

      // Fetch videos with pagination
      const from = page * videosPerPage;
      const to = from + videosPerPage - 1;

      const { data: videos, error: videosError } = await query
        .order('published_at', { ascending: false })
        .range(from, to);

      if (videosError) throw videosError;

      // Build count query with same filters
      let countQuery = supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId);

      // Apply same filters to count
      if (dateRange) {
        countQuery = countQuery
          .gte('published_at', dateRange.startDate.toISOString())
          .lte('published_at', dateRange.endDate.toISOString());
      }
      if (activeFilters.searchQuery) {
        const search = activeFilters.searchQuery;
        countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (activeFilters.typeFilter !== 'all') {
        countQuery = countQuery.eq('type', activeFilters.typeFilter);
      }

      const { count } = await countQuery;

      setHasMore(prev => ({
        ...prev,
        [channelId]: (from + (videos?.length || 0)) < (count || 0)
      }));

      if (channelData && videos) {
        // Update channel state with Supabase data
        setChannels(prev => prev.map(ch => {
          if (ch.id === channelId) {
            // Clear videos if page 0, otherwise append
            const existingVideos = page === 0 ? [] : (ch.videos || []);
            return {
              ...ch,
              name: channelData?.name || ch.name,
              videos: [...existingVideos, ...videos.map(v => ({
                id: v.id,
                title: v.title,
                description: v.description,
                published: v.published_at,
                thumbnail: v.thumbnail,
                views: v.views,
                likes: v.likes,
                type: v.type,
                link: v.link,
                lastUpdated: v.last_updated
              }))]
            };
          }
          return ch;
        }));

        setLoadedPages(prev => ({ ...prev, [channelId]: page + 1 }));
        setLastUpdated(channelData?.last_fetched);
        setLoading(false);
        return;
      }
    }

    // Fallback to RSS if Supabase is not configured or has no data
    const data = await fetchChannelData(channelId);
    setChannels(prev => prev.map(ch =>
      ch.id === channelId
        ? { ...ch, name: data.channelName, videos: data.videos }
        : ch
    ));
    setHasMore(prev => ({ ...prev, [channelId]: false }));
  } catch (err) {
    // If Supabase fails, try RSS as fallback
    try {
      const data = await fetchChannelData(channelId);
      setChannels(prev => prev.map(ch =>
        ch.id === channelId
          ? { ...ch, name: data.channelName, videos: data.videos }
          : ch
      ));
      setHasMore(prev => ({ ...prev, [channelId]: false }));
    } catch (rssErr) {
      setError(`Failed to load channel: ${rssErr.message}`);
    }
  } finally {
    setLoading(false);
  }
};
```

**Step 2: Verify code compiles**

Run: `npm run dev`
Expected: No errors, app loads normally

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add filter support to loadChannel

- Accepts filter parameter
- Builds dynamic Supabase queries
- Applies date range, search, type filters
- Count query uses same filters

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Filter Change Handlers

**Files:**
- Modify: `src/App.jsx` (add after loadChannel function)

**Step 1: Add handleFilterChange function**

Add this function after the `loadChannel` function:

```javascript
// Handle filter changes
const handleFilterChange = (newFilters) => {
  // Update filter state for active channel
  setFilters(prev => ({
    ...prev,
    [activeChannelId]: newFilters
  }));

  // Reset pagination and reload with new filters
  setLoadedPages(prev => ({ ...prev, [activeChannelId]: 0 }));
  loadChannel(activeChannelId, 0, newFilters);
};

// Clear all filters
const handleClearFilters = () => {
  const defaultFilters = getDefaultFilters();
  handleFilterChange(defaultFilters);
};
```

**Step 2: Verify code compiles**

Run: `npm run dev`
Expected: No errors

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add filter change handlers

- handleFilterChange updates state and reloads
- Resets pagination when filters change
- handleClearFilters resets to defaults

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Integrate FilterBar into App

**Files:**
- Modify: `src/App.jsx` (import and render FilterBar)

**Step 1: Add FilterBar import**

At the top of `App.jsx`, add to existing imports:

```javascript
import FilterBar from './components/FilterBar';
```

**Step 2: Add FilterBar to JSX**

Find the section after `<ChannelSelector>` (around line 652) and add the FilterBar:

```jsx
        <ChannelSelector
          channels={channels}
          activeChannel={activeChannelId}
          onSelect={setActiveChannelId}
          onAdd={addChannel}
          onRemove={removeChannel}
        />

        {/* Add FilterBar here */}
        <FilterBar
          filters={getActiveFilters(activeChannelId)}
          onFilterChange={handleFilterChange}
          videoCount={videos.length}
          onClearFilters={handleClearFilters}
        />
      </div>
```

**Step 3: Test filter bar displays**

Run: `npm run dev`
Expected: Filter bar appears with search, type pills, and date picker

**Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: integrate FilterBar into main app

- Import FilterBar component
- Add to layout below channel selector
- Wire up filter change handlers

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Test Search Filter

**Files:**
- Manual testing

**Step 1: Test search functionality**

1. Start app: `npm run dev`
2. Type in search box: "test"
3. Wait 500ms
4. Verify: Videos filter to matching titles/descriptions
5. Verify: KPIs update to show filtered stats
6. Clear search
7. Verify: All videos return

**Step 2: Test with no results**

1. Search for gibberish: "xyzabc123"
2. Verify: Shows "No videos found" or empty list
3. Verify: KPIs show zeros
4. Verify: "Clear filters" button visible

**Step 3: Document any issues**

If issues found, fix before proceeding.

---

## Task 11: Test Date Range Filter

**Files:**
- Manual testing

**Step 1: Test preset ranges**

1. Click date picker
2. Select "Last 7 days"
3. Verify: Only videos from last 7 days shown
4. Verify: KPIs update
5. Test "Last 30 days"
6. Test "Last 90 days"
7. Test "All time"

**Step 2: Test custom range**

1. Click date picker
2. Enter start date (e.g., 30 days ago)
3. Enter end date (today)
4. Click Apply
5. Verify: Only videos in range shown
6. Verify: Button text shows custom range

**Step 3: Test invalid range**

1. Enter start date > end date
2. Verify: Apply button disabled or shows error

---

## Task 12: Test Type Filter

**Files:**
- Manual testing

**Step 1: Test type filtering**

1. Click "Videos" pill
2. Verify: Only long-form videos shown
3. Verify: KPIs update (no shorts counted)
4. Click "Shorts"
5. Verify: Only shorts shown
6. Click "All"
7. Verify: All videos return

**Step 2: Combine filters**

1. Select "Shorts"
2. Select "Last 7 days"
3. Search for keyword
4. Verify: All filters apply together
5. Verify: KPIs reflect combined filters

---

## Task 13: Test Pagination with Filters

**Files:**
- Manual testing

**Step 1: Test pagination without filters**

1. Load channel with many videos
2. Click "Load More"
3. Verify: Videos append
4. Click again
5. Verify: More videos append

**Step 2: Test pagination with filters**

1. Apply date filter: "Last 30 days"
2. Verify: Filtered videos shown
3. Click "Load More" (if available)
4. Verify: More filtered videos append
5. Verify: No duplicate videos

**Step 3: Test filter change resets pagination**

1. Load 2 pages of videos
2. Change date filter
3. Verify: Video list resets to page 0
4. Verify: Shows filtered videos from start

---

## Task 14: Test Channel Switching with Filters

**Files:**
- Manual testing

**Step 1: Test per-channel filters**

1. On Channel A, set search: "test"
2. Set date: "Last 7 days"
3. Switch to Channel B
4. Verify: Channel B shows default filters (no filters)
5. Set different filters on Channel B
6. Switch back to Channel A
7. Verify: Channel A still has "test" search and "Last 7 days"

**Step 2: Test filter persistence**

1. Apply filters to multiple channels
2. Switch between them
3. Verify: Each channel remembers its filters

---

## Task 15: Test Edge Cases

**Files:**
- Manual testing

**Step 1: Test empty results**

1. Apply filters that return no videos
2. Verify: Shows appropriate message
3. Verify: "Clear filters" works
4. Verify: No JavaScript errors

**Step 2: Test rapid filter changes**

1. Rapidly change filters (don't wait for loading)
2. Verify: No race conditions
3. Verify: Final results match final filter state
4. Verify: No duplicate videos

**Step 3: Test special characters in search**

1. Search with special chars: `"test & value"`
2. Verify: No errors
3. Search with apostrophe: `"it's"`
4. Verify: Works correctly

---

## Task 16: Final Integration Test

**Files:**
- Manual testing

**Step 1: Complete workflow test**

1. Start with fresh app
2. Add new channel
3. Apply date filter
4. Apply search
5. Apply type filter
6. Load more videos
7. Clear filters
8. Verify: Everything returns to default
9. Switch channels
10. Verify: Filters don't leak between channels

**Step 2: Test all KPIs**

1. Apply various filters
2. Verify each KPI updates:
   - Total Views
   - Total Likes
   - Engagement %
   - Avg Views
   - Video Count
3. Verify top performers list updates
4. Verify content breakdown updates

**Step 3: Visual polish check**

1. Check all filters align properly
2. Check hover states work
3. Check transitions are smooth
4. Check no layout shifts when filtering

---

## Task 17: Performance Check

**Files:**
- Manual testing

**Step 1: Test with large dataset**

1. Load channel with 100+ videos (load all pages)
2. Apply filters
3. Measure response time (should be < 1s)
4. Verify no UI lag

**Step 2: Test debouncing**

1. Type rapidly in search box
2. Verify: Only one query fires after 500ms pause
3. Check Network tab for query count

**Step 3: Test memory leaks**

1. Rapidly switch channels 10 times
2. Apply/clear filters repeatedly
3. Open DevTools Performance tab
4. Verify: Memory doesn't continuously grow

---

## Task 18: Final Commit and Cleanup

**Files:**
- All modified files

**Step 1: Review all changes**

Run: `git status`
Expected: All changes committed

**Step 2: Test full app one more time**

1. Test all features end-to-end
2. Test on different screen sizes
3. Test with different channels

**Step 3: Create final summary commit if needed**

```bash
git add .
git commit -m "feat: complete filters, search, and pagination feature

All features implemented and tested:
- Date range filters (preset + custom)
- Video search (debounced, database queries)
- Type filtering (shorts/videos)
- Fixed pagination bug
- KPIs update with filters
- Per-channel filter state

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Testing Checklist

### Functional Tests
- [ ] Search filters videos by title
- [ ] Search filters videos by description
- [ ] Date presets work (7d, 30d, 90d, all)
- [ ] Custom date range works
- [ ] Type filter works (all/videos/shorts)
- [ ] Multiple filters combine correctly
- [ ] Clear filters resets everything
- [ ] Pagination appends videos
- [ ] Pagination works with filters
- [ ] Filter change resets pagination
- [ ] Channel switching preserves filters
- [ ] KPIs update with filters
- [ ] Video count updates with filters
- [ ] Top performers updates with filters
- [ ] Content breakdown updates with filters

### Edge Cases
- [ ] Search with no results
- [ ] Date range with no videos
- [ ] Invalid date range prevented
- [ ] Special characters in search
- [ ] Rapid filter changes handled
- [ ] Channel switch during loading

### Performance
- [ ] Search debounces (500ms)
- [ ] Queries return < 1s
- [ ] No duplicate queries
- [ ] No memory leaks

### UI/UX
- [ ] Filter bar layout correct
- [ ] Active filters highlighted
- [ ] Hover states work
- [ ] Transitions smooth
- [ ] No layout shifts
- [ ] Responsive on mobile

---

## Troubleshooting

### Issue: Videos not filtering
- Check: Supabase query building in loadChannel
- Check: Filter state being passed correctly
- Check: Console for SQL errors

### Issue: Pagination not working
- Check: loadedPages state per channel
- Check: page parameter being passed
- Check: count query matches main query filters

### Issue: Search not debouncing
- Check: useEffect in SearchInput
- Check: Timer cleanup function
- Check: onChange prop wired correctly

### Issue: Date picker not closing
- Check: outside click handler
- Check: ref attached to dropdown
- Check: event listener cleanup

### Issue: KPIs not updating
- Check: videos state updating
- Check: KPIs calculating from videos array
- Check: Component re-rendering on filter change

---

## Success Criteria

✅ Users can search videos by title/description
✅ Users can filter by date range (preset or custom)
✅ Users can filter by content type (shorts/videos)
✅ KPIs reflect filtered results accurately
✅ Pagination works correctly with filters
✅ Filters persist per channel
✅ UI is responsive and smooth
✅ No performance issues or bugs
