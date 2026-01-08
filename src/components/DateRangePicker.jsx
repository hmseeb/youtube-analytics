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
