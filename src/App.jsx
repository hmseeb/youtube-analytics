import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CLIENT
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

const extractChannelId = (input) => {
  if (!input) return null;
  input = input.trim();
  
  // Direct channel ID
  if (input.startsWith('UC') && input.length === 24) return input;
  
  // Various URL patterns
  const patterns = [
    /channel_id=([A-Za-z0-9_-]{24})/,
    /channel\/([A-Za-z0-9_-]{24})/,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  
  return input.length === 24 ? input : null;
};

const parseYouTubeRSS = (xmlText, channelId) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  
  const parserError = xml.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML response');
  }
  
  const channelName = xml.querySelector('title')?.textContent || 'Unknown Channel';
  const entries = xml.querySelectorAll('entry');
  
  const videos = Array.from(entries).map(entry => {
    const videoId = entry.querySelector('videoId')?.textContent || '';
    const title = entry.querySelector('title')?.textContent || '';
    const published = entry.querySelector('published')?.textContent || '';
    const updated = entry.querySelector('updated')?.textContent || '';
    
    const mediaGroup = entry.querySelector('group');
    const description = mediaGroup?.querySelector('description')?.textContent || '';
    const thumbnail = mediaGroup?.querySelector('thumbnail')?.getAttribute('url') || '';
    
    const community = mediaGroup?.querySelector('community');
    const views = parseInt(community?.querySelector('statistics')?.getAttribute('views') || '0');
    const starRating = community?.querySelector('starRating');
    const likes = parseInt(starRating?.getAttribute('count') || '0');
    
    // Detect shorts
    const link = entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || '';
    const isShort = link.includes('/shorts/') || 
                    title.includes('#') || 
                    description.length < 100;
    
    return {
      id: videoId,
      title,
      published,
      updated,
      description,
      thumbnail,
      views,
      likes,
      type: isShort ? 'short' : 'video',
      link: link || `https://www.youtube.com/watch?v=${videoId}`
    };
  });
  
  return { channelName, channelId, videos };
};

// ============================================
// COMPONENTS
// ============================================

const StatCard = ({ label, value, color, icon, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 cursor-default animate-slide-in"
      style={{
        animationDelay: `${delay}s`,
        animationFillMode: 'both',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? `0 8px 30px ${color}20` : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div 
        className="text-3xl font-bold font-mono"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
};

const ChannelSelector = ({ channels, activeChannel, onSelect, onAdd, onRemove }) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    // Only accept valid channel IDs (24 chars starting with UC)
    if (!trimmed.startsWith('UC') || trimmed.length !== 24) {
      setError('Invalid channel ID. Must start with "UC" and be 24 characters.');
      return;
    }
    onAdd(trimmed);
    setInputValue('');
    setShowInput(false);
    setError('');
    setShowHelp(false);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3 items-center">
        {channels.map(channel => (
          <div
            key={channel.id}
            onClick={() => onSelect(channel.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
              activeChannel === channel.id
                ? 'bg-gradient-to-r from-youtube-red/30 to-youtube-lightred/20 border border-youtube-red/50'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <span className="text-sm font-medium">{channel.name}</span>
            {channels.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(channel.id); }}
                className="text-gray-500 hover:text-white ml-1 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {showInput ? (
          <div className="flex gap-2 items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="UC..."
                  autoFocus
                  className="bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-accent-cyan w-56 font-mono"
                />
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    showHelp
                      ? 'bg-accent-cyan text-black'
                      : 'bg-white/10 text-gray-400 hover:text-accent-cyan hover:bg-white/20'
                  }`}
                  title="How to find Channel ID"
                >
                  ?
                </button>
              </div>
              {error && <span className="text-red-400 text-xs mt-1">{error}</span>}
            </div>
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-accent-cyan to-accent-green px-4 py-2.5 rounded-lg text-black font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Add
            </button>
            <button
              onClick={() => { setShowInput(false); setInputValue(''); setError(''); setShowHelp(false); }}
              className="bg-white/10 px-4 py-2.5 rounded-lg text-gray-400 text-sm hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-dashed border-white/20 rounded-xl text-gray-500 text-sm hover:bg-white/10 hover:text-white transition-all"
          >
            <span className="text-lg">+</span> Add Channel
          </button>
        )}
      </div>

      {showHelp && (
        <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-4 max-w-md animate-slide-in">
          <h4 className="text-sm font-semibold text-accent-cyan mb-2">How to find a Channel ID:</h4>
          <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
            <li>Go to the YouTube channel page</li>
            <li>Click on <span className="text-white">More</span> {">"} <span className="text-white">Share channel</span></li>
            <li>Click <span className="text-white">Copy channel ID</span></li>
          </ol>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-1">Alternative method:</p>
            <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
              <li>View page source (Ctrl+U / Cmd+U)</li>
              <li>Search for <span className="text-white font-mono">"channelId"</span></li>
              <li>Copy the 24-character ID starting with <span className="text-white font-mono">UC</span></li>
            </ol>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Example: <span className="text-accent-cyan font-mono">UCjnYCUIym8aNRjLtZCc6gNg</span>
          </p>
        </div>
      )}
    </div>
  );
};

const VideoBar = ({ video, maxViews, isHovered, onHover }) => {
  const barWidth = Math.max((video.views / maxViews) * 100, 5);

  // Format relative time for last updated
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) return null; // Don't show if older than a week
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'just now';
  };

  const lastUpdatedText = getRelativeTime(video.lastUpdated);

  return (
    <a
      href={video.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors no-underline ${
        isHovered ? 'bg-white/5' : ''
      }`}
      onMouseEnter={() => onHover(video.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="w-14 text-[10px] text-gray-500 font-mono flex-shrink-0">
        {new Date(video.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>

      <div className="flex-1 h-7 bg-white/5 rounded overflow-hidden relative">
        {/* Title overlay - always visible */}
        <div className="absolute inset-0 flex items-center pl-3 z-10">
          <span className={`text-[11px] font-medium truncate transition-colors ${
            isHovered ? 'text-white' : 'text-gray-300'
          }`}>
            {video.title.length > 50 ? video.title.slice(0, 50) + '...' : video.title}
          </span>
        </div>
        {/* Progress bar */}
        <div
          className={`h-full rounded transition-all duration-500 opacity-40 ${
            video.type === 'short'
              ? 'bg-gradient-to-r from-accent-cyan to-accent-green'
              : 'bg-gradient-to-r from-youtube-red to-youtube-lightred'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className={`w-20 text-right text-sm font-semibold font-mono transition-colors ${
        isHovered ? 'text-white' : 'text-gray-500'
      }`}>
        {video.views.toLocaleString()}
      </div>

      <div className={`w-16 text-right text-sm font-mono transition-colors ${
        isHovered ? 'text-youtube-red' : 'text-gray-600'
      }`}>
        ❤️ {video.likes.toLocaleString()}
      </div>

      <div className={`w-14 text-[10px] px-2 py-1 rounded-full text-center uppercase font-semibold ${
        video.type === 'short'
          ? 'bg-accent-cyan/20 text-accent-cyan'
          : 'bg-youtube-red/20 text-youtube-red'
      }`}>
        {video.type}
      </div>

      {/* Last updated indicator - only show if recent */}
      {lastUpdatedText && (
        <div className="w-12 text-[9px] text-gray-600 font-mono text-right" title={`Stats updated: ${new Date(video.lastUpdated).toLocaleString()}`}>
          {lastUpdatedText}
        </div>
      )}
    </a>
  );
};

// ============================================
// MAIN APP
// ============================================

const STORAGE_KEY = 'youtube-analytics-channels';
const DEFAULT_CHANNELS = [
  'UC6HBmXVAtwRBkZuaV9Jsubw',
  'UCcxQOPeGruITLHd2knOa3eA',
  'UCuysQYjoOTAcZZPb0-_rCpA'
];

const loadStoredChannels = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(id => ({ id, name: 'Loading...', videos: [] }));
      }
    }
  } catch (e) {
    console.error('Failed to load stored channels:', e);
  }
  return DEFAULT_CHANNELS.map(id => ({ id, name: 'Loading...', videos: [] }));
};

const saveChannelsToStorage = (channelIds) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channelIds));
  } catch (e) {
    console.error('Failed to save channels:', e);
  }
};

function App() {
  const [channels, setChannels] = useState(loadStoredChannels);
  const [activeChannelId, setActiveChannelId] = useState(() => {
    const stored = loadStoredChannels();
    return stored[0]?.id || DEFAULT_CHANNELS[0];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);

  // Pagination state for Supabase
  const [videosPerPage] = useState(30);
  const [loadedPages, setLoadedPages] = useState({});  // { channelId: pageCount }
  const [hasMore, setHasMore] = useState({});          // { channelId: boolean }
  const [lastUpdated, setLastUpdated] = useState(null); // Last refresh timestamp

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

  // Save channel IDs to localStorage whenever channels change
  useEffect(() => {
    const channelIds = channels.map(ch => ch.id);
    saveChannelsToStorage(channelIds);
  }, [channels]);

  const fetchChannelData = async (channelId) => {
    const response = await fetch(`/api/feed?channelId=${channelId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const xmlText = await response.text();
    return parseYouTubeRSS(xmlText, channelId);
  };

  const loadChannel = async (channelId, page = 0) => {
    setLoading(true);
    setError(null);

    try {
      // If Supabase is configured, try loading from there first
      if (supabase) {
        // Fetch channel info
        const { data: channelData } = await supabase
          .from('channels')
          .select('*')
          .eq('id', channelId)
          .single();

        // Fetch videos with pagination
        const from = page * videosPerPage;
        const to = from + videosPerPage - 1;

        const { data: videos, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .eq('channel_id', channelId)
          .order('published_at', { ascending: false })
          .range(from, to);

        if (videosError) throw videosError;

        // Check if there are more videos
        const { count } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channelId);

        setHasMore(prev => ({
          ...prev,
          [channelId]: (from + (videos?.length || 0)) < (count || 0)
        }));

        if (channelData && videos && videos.length > 0) {
          // Update channel state with Supabase data
          setChannels(prev => prev.map(ch => {
            if (ch.id === channelId) {
              const existingVideos = page === 0 ? [] : ch.videos;
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

  // Refresh channel from live RSS and save to Supabase
  const refreshChannel = async (channelId) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch fresh RSS data via existing proxy
      const response = await fetch(`/api/feed?channelId=${channelId}`);
      if (!response.ok) throw new Error('Failed to fetch RSS');

      const xml = await response.text();
      const parsed = parseYouTubeRSS(xml, channelId);

      if (supabase) {
        // Upsert channel to Supabase
        await supabase.from('channels').upsert({
          id: channelId,
          name: parsed.channelName,
          last_fetched: new Date().toISOString()
        });

        // Upsert videos to Supabase
        const videosToUpsert = parsed.videos.map(v => ({
          id: v.id,
          channel_id: channelId,
          title: v.title,
          description: v.description,
          published_at: v.published,
          thumbnail: v.thumbnail,
          link: v.link,
          type: v.type,
          views: v.views,
          likes: v.likes,
          last_updated: new Date().toISOString()
        }));

        await supabase.from('videos').upsert(videosToUpsert);

        // Reload from Supabase to get merged data
        setLoadedPages(prev => ({ ...prev, [channelId]: 0 }));
        await loadChannel(channelId, 0);
      } else {
        // No Supabase, just update state with RSS data
        setChannels(prev => prev.map(ch =>
          ch.id === channelId
            ? { ...ch, name: parsed.channelName, videos: parsed.videos }
            : ch
        ));
      }

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Refresh failed:', err);
      setError(`Refresh failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load more videos (pagination)
  const loadMoreVideos = () => {
    const currentPage = loadedPages[activeChannelId] || 0;
    loadChannel(activeChannelId, currentPage);
  };

  const addChannel = async (channelId) => {
    if (channels.find(ch => ch.id === channelId)) {
      setActiveChannelId(channelId);
      return;
    }
    
    const newChannel = { id: channelId, name: 'Loading...', videos: [] };
    setChannels(prev => [...prev, newChannel]);
    setActiveChannelId(channelId);
  };

  const removeChannel = (channelId) => {
    if (channels.length <= 1) return;
    
    setChannels(prev => prev.filter(ch => ch.id !== channelId));
    if (activeChannelId === channelId) {
      const remaining = channels.find(ch => ch.id !== channelId);
      if (remaining) setActiveChannelId(remaining.id);
    }
  };

  // Load active channel data when it changes
  useEffect(() => {
    loadChannel(activeChannelId);
  }, [activeChannelId]);

  // Load all stored channels on mount
  useEffect(() => {
    channels.forEach(ch => {
      if (ch.name === 'Loading...' && ch.id !== activeChannelId) {
        fetchChannelData(ch.id).then(data => {
          setChannels(prev => prev.map(c =>
            c.id === ch.id ? { ...c, name: data.channelName, videos: data.videos } : c
          ));
        }).catch(() => {});
      }
    });
  }, []);

  // Calculate metrics
  const activeChannel = channels.find(ch => ch.id === activeChannelId);
  const videos = activeChannel?.videos || [];
  
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
  const avgEngagement = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0';
  const shorts = videos.filter(v => v.type === 'short');
  const longForm = videos.filter(v => v.type === 'video');
  const shortsViews = shorts.reduce((sum, v) => sum + v.views, 0);
  const longFormViews = longForm.reduce((sum, v) => sum + v.views, 0);
  const maxViews = Math.max(...videos.map(v => v.views), 1);
  const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
  const topVideos = [...videos].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-gray-200 p-10 relative overflow-hidden">
      {/* Background grid */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Floating orbs */}
      <div className="absolute top-[10%] right-[10%] w-72 h-72 bg-youtube-red/15 rounded-full blur-[40px] animate-pulse-glow" />
      <div className="absolute bottom-[20%] left-[5%] w-60 h-60 bg-accent-cyan/12 rounded-full blur-[50px] animate-pulse-glow" style={{ animationDirection: 'reverse' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-youtube-red to-youtube-lightred rounded-xl flex items-center justify-center shadow-lg shadow-youtube-red/40">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                YouTube Analytics
              </h1>
              <p className="text-sm text-gray-500 font-mono">
                Real-time RSS feed data • Multi-channel dashboard
              </p>
            </div>
          </div>

          <ChannelSelector
            channels={channels}
            activeChannel={activeChannelId}
            onSelect={setActiveChannelId}
            onAdd={addChannel}
            onRemove={removeChannel}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-3 border-white/10 border-t-youtube-red rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Fetching channel data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-youtube-red/10 border border-youtube-red/30 rounded-xl p-5 mb-8 text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Main Content */}
        {!loading && videos.length > 0 && (
          <>
            {/* Channel Name */}
            <div className="mb-8 p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl animate-slide-in flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">{activeChannel?.name}</h2>
                <p className="text-sm text-gray-500 font-mono mt-2">
                  Last {videos.length} videos • ID: {activeChannelId}
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`https://studio.youtube.com/channel/${activeChannelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v6zm2-6h4c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-4V9zm1.5 4.5h2v-3h-2v3z"/>
                  </svg>
                  View Insights
                </a>
                <a
                  href={`https://www.youtube.com/channel/${activeChannelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-youtube-red/20 border border-youtube-red/30 rounded-lg text-sm text-youtube-red hover:bg-youtube-red/30 transition-all flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/>
                  </svg>
                  View Channel
                </a>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 gap-4 mb-10">
              <StatCard label="Total Views" value={totalViews.toLocaleString()} color="#00d4ff" icon="👁" delay={0} />
              <StatCard label="Total Likes" value={totalLikes.toLocaleString()} color="#ff0050" icon="❤️" delay={0.1} />
              <StatCard label="Engagement" value={`${avgEngagement}%`} color="#00ff88" icon="📈" delay={0.2} />
              <StatCard label="Avg Views" value={avgViews.toLocaleString()} color="#ffd700" icon="📊" delay={0.3} />
              <StatCard label="Videos" value={videos.length} color="#a855f7" icon="🎬" delay={0.4} />
            </div>

            {/* Content Type + Top Performers */}
            <div className="grid grid-cols-2 gap-5 mb-10">
              {/* Content Breakdown */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 animate-slide-in delay-500">
                <h3 className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-5">
                  📹 Content Breakdown
                </h3>
                <div className="flex gap-6">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">Long-form ({longForm.length})</div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-youtube-red to-youtube-lightred rounded-full transition-all duration-1000"
                        style={{ width: totalViews > 0 ? `${(longFormViews / totalViews) * 100}%` : '0%' }}
                      />
                    </div>
                    <div className="text-lg font-semibold text-youtube-red mt-2">
                      {longFormViews.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">Shorts ({shorts.length})</div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent-cyan to-accent-green rounded-full transition-all duration-1000"
                        style={{ width: totalViews > 0 ? `${(shortsViews / totalViews) * 100}%` : '0%' }}
                      />
                    </div>
                    <div className="text-lg font-semibold text-accent-cyan mt-2">
                      {shortsViews.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 animate-slide-in delay-600">
                <h3 className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-4">
                  🏆 Top Performers
                </h3>
                {topVideos.slice(0, 4).map((video, i) => (
                  <a
                    key={video.id}
                    href={video.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 py-2 hover:bg-white/5 rounded-lg transition-colors no-underline ${i < 3 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-black flex-shrink-0 ${
                      i === 0 ? 'bg-accent-gold' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{video.title}</div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      ❤️ {video.likes.toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-accent-cyan font-mono">
                      {video.views.toLocaleString()}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Video Performance Chart */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-10 animate-slide-in delay-700">
              <h3 className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-5">
                📊 Videos Performance ({videos.length} videos)
              </h3>
              <div className="flex flex-col gap-2">
                {videos.map((video) => (
                  <VideoBar
                    key={video.id}
                    video={video}
                    maxViews={maxViews}
                    isHovered={hoveredVideo === video.id}
                    onHover={setHoveredVideo}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore[activeChannelId] && (
                <button
                  onClick={loadMoreVideos}
                  disabled={loading}
                  className="w-full py-3 mt-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                      </svg>
                      Load More Videos
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Insight Footer */}
            {shorts.length > 0 && longForm.length > 0 && (
              <div className="text-center p-5 bg-white/[0.02] rounded-2xl border border-white/5 animate-slide-in delay-800">
                <p className="text-sm text-gray-500">
                  💡 <span className="text-accent-cyan">Insight:</span> Shorts drive{' '}
                  <span className="text-accent-green font-semibold">
                    {totalViews > 0 ? ((shortsViews / totalViews) * 100).toFixed(0) : 0}%
                  </span>{' '}
                  of total views while being{' '}
                  <span className="text-accent-gold font-semibold">
                    {((shorts.length / videos.length) * 100).toFixed(0)}%
                  </span>{' '}
                  of content
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && !error && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">📺</p>
            <p>No videos found for this channel</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
