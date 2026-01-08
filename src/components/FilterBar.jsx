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
