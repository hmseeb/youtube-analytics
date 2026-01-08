import React, { useState, useEffect, useRef } from 'react';

const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => {
  const [localValue, setLocalValue] = useState(value);
  const onChangeRef = useRef(onChange);

  // Keep ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync with prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange - only call when localValue actually changes
  useEffect(() => {
    // Only trigger if value is different from prop
    if (localValue === value) return;

    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, value]);

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
