// src/pages/Watch.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEpisodeData } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [episodeData, setEpisodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerError, setPlayerError] = useState(null);
  const [debug, setDebug] = useState({
    episodeId: episodeId,
    apiCalls: [],
    dataStructure: null
  });
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [parsedSynopsis, setParsedSynopsis] = useState({ paragraphs: [] });
  const [parsedRating, setParsedRating] = useState({ value: '', users: '' });
  const [animationReady, setAnimationReady] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const mainContentRef = useRef(null);
  const synopsisRef = useRef(null);
  const [relatedEpisodes, setRelatedEpisodes] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [serverIndex, setServerIndex] = useState(0);

  // Format and parse synopsis data - improved to handle malformed content
  const formatSynopsis = (rawData) => {
    if (!rawData) return { paragraphs: ["No synopsis available."] };
    
    try {
      // Clean text of markdown-style formatting
      let cleanText = rawData.toString()
        .replace(/\*\*Synopsis\*\*/gi, '')
        .replace(/\*\*Episodes\*\*/gi, '')
        .replace(/\*\*Episode \?\?\*\*/gi, '')
        .replace(/\*\*/g, '')
        .trim();
        
      // Handle common malformed patterns
      cleanText = cleanText.replace(/\{"paragraphs":\["/g, '')
                              .replace(/"\]}/g, '')
                              .replace(/\\"/g, '"')
                              .replace(/\\n/g, ' ');
      
      // If it's a JSON string, try to parse it
      if (cleanText.includes('{') && cleanText.includes('paragraphs')) {
        try {
          // Extract JSON portion with regex
          const jsonMatch = cleanText.match(/(\{[^}]+\})/);
          if (jsonMatch && jsonMatch[1]) {
            const parsedJson = JSON.parse(jsonMatch[1]);
            if (parsedJson.paragraphs && Array.isArray(parsedJson.paragraphs)) {
              return { paragraphs: parsedJson.paragraphs.filter(p => p && p.trim() !== '') };
            }
          }
        } catch (e) {
          console.error("Error parsing JSON in synopsis:", e);
        }
      }
      
      // Fallback to splitting by paragraphs
      const paragraphs = cleanText
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p !== '');
        
      return { paragraphs: paragraphs.length > 0 ? paragraphs : ["No synopsis available."] };
    } catch (e) {
      console.error("Error parsing synopsis:", e);
      return { paragraphs: ["Error parsing synopsis."] };
    }
  };

  // Format rating data - improved to handle various formats
  const formatRating = (ratingData) => {
    if (!ratingData) return { value: "N/A", users: "0" };
    
    try {
      // Handle common malformed patterns
      if (typeof ratingData === 'string') {
        // Check for the specific pattern in your example
        const ratingMatch = ratingData.match(/Rating: \*\*\{"value":"([^"]+)","users":"([^"]+)/);
        if (ratingMatch && ratingMatch.length >= 3) {
          return {
            value: ratingMatch[1],
            users: ratingMatch[2].replace(/,\*\*$/, '')
          };
        }
        
        // If it's a string that looks like JSON
        if (ratingData.includes('{') || ratingData.includes('}')) {
          // Try to extract JSON with regex
          const jsonMatch = ratingData.match(/(\{[^}]+\})/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              const parsed = JSON.parse(jsonMatch[1]);
              return {
                value: parsed.value || "N/A",
                users: parsed.users || "0"
              };
            } catch (e) {
              // Fallback to regex extraction
              const valueMatch = ratingData.match(/"value":"([^"]+)"/);
              const usersMatch = ratingData.match(/"users":"([^"]+)"/);
              
              return {
                value: valueMatch ? valueMatch[1] : "N/A",
                users: usersMatch ? usersMatch[1] : "0"
              };
            }
          }
        }
      }
      
      // If it's a clean number as string
      if (typeof ratingData === 'string' && !isNaN(parseFloat(ratingData))) {
        return { value: parseFloat(ratingData).toFixed(2), users: "N/A" };
      }
      
      // If it's already an object
      if (typeof ratingData === 'object' && ratingData !== null) {
        return {
          value: ratingData.value || "N/A",
          users: ratingData.users || "0"
        };
      }
      
      return { value: "N/A", users: "0" };
    } catch (e) {
      console.error("Error parsing rating:", e);
      return { value: "N/A", users: "0" };
    }
  };

  useEffect(() => {
    const fetchEpisodeData = async () => {
      if (!episodeId) {
        setError('Invalid episode ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setPlayerError(null);
        
        // Log the request
        setDebug(prev => ({
          ...prev,
          apiCalls: [...prev.apiCalls, {
            time: new Date().toISOString(),
            action: 'REQUEST',
            endpoint: `/samehadaku/episode/${episodeId}`
          }]
        }));
        
        const data = await getEpisodeData(episodeId);
        console.log('Raw episode data:', data);
        
        // Log the response
        setDebug(prev => ({
          ...prev,
          apiCalls: [...prev.apiCalls, {
            time: new Date().toISOString(),
            action: 'RESPONSE',
            endpoint: `/samehadaku/episode/${episodeId}`,
            status: 'success',
            dataSnapshot: data
          }]
        }));
        
        // Detailed validation of the response data
        if (!data) {
          throw new Error('Empty response from API');
        }
        
        if (!data.data) {
          throw new Error('Missing data field in response');
        }
        
        // Initialize an empty processed data object with default values
        let processedData = {
          title: '',
          animeTitle: 'Unknown Anime',
          animeId: '',
          episodeNumber: '',
          synopsis: null,
          thumbnail: '',
          rating: null,
          releaseDate: '',
          servers: [],
          nextEpisodeId: null,
          prevEpisodeId: null,
          defaultStreamingUrl: null
        };
        
        // Extract basic episode info
        processedData.title = data.data.title || '';
        processedData.animeTitle = data.data.animeTitle || data.data.animeName || 'Unknown Anime';
        processedData.animeId = data.data.animeId || '';
        processedData.episodeNumber = data.data.episodeNumber || data.data.number || '';
        processedData.nextEpisodeId = data.data.nextEpisode?.episodeId || data.data.nextId || null;
        processedData.prevEpisodeId = data.data.prevEpisode?.episodeId || data.data.prevId || null;
        processedData.synopsis = data.data.synopsis || data.data.description || '';
        processedData.thumbnail = data.data.thumbnail || data.data.image || '';
        processedData.rating = data.data.rating || data.data.score || null;
        processedData.releaseDate = data.data.releaseDate || data.data.date || '';
        
        // Extract defaultStreamingUrl if available
        processedData.defaultStreamingUrl = data.data.defaultStreamingUrl || null;
        
        // Parse synopsis and rating
        setParsedSynopsis(formatSynopsis(processedData.synopsis));
        setParsedRating(formatRating(processedData.rating));
        
        // Make the episode data available to the window object for the VideoPlayer component
        window.episodeData = processedData;
        
        // Extract servers with special handling for different data structures
        if (Array.isArray(data.data.servers)) {
          processedData.servers = data.data.servers.map(server => ({
            id: server.id || server.serverId || `server-${Math.random().toString(36).substring(2, 9)}`,
            name: server.name || server.label || 'Unknown Server',
            url: server.url || server.embedUrl || null
          }));
        } else if (data.data.videoSources && Array.isArray(data.data.videoSources)) {
          processedData.servers = data.data.videoSources.map(source => ({
            id: source.id || source.serverId || `source-${Math.random().toString(36).substring(2, 9)}`,
            name: source.name || source.label || 'Video Source',
            url: source.url || source.src || null
          }));
        } else if (typeof data.data.servers === 'object' && data.data.servers !== null) {
          // If servers is an object, convert to array
          processedData.servers = Object.keys(data.data.servers).map(key => ({
            id: key,
            name: data.data.servers[key].name || key,
            url: data.data.servers[key].url || null
          }));
        }
        
        // Create a default server for the defaultStreamingUrl if it exists 
        // and no other servers were found
        if (processedData.servers.length === 0 && processedData.defaultStreamingUrl) {
          processedData.servers.push({
            id: 'default-server',
            name: 'Default Server',
            url: processedData.defaultStreamingUrl
          });
        }
        
        // Special case handling for direct embed URLs
        if (processedData.servers.length === 0) {
          // Check for various URL fields that might contain video sources
          const possibleUrlFields = [
            'embedUrl', 'videoUrl', 'streamingUrl', 'url', 
            'videoSource', 'streamSource', 'embedCode'
          ];
          
          for (const field of possibleUrlFields) {
            if (data.data[field]) {
              processedData.servers.push({
                id: `direct-${field}`,
                name: `Server ${processedData.servers.length + 1}`,
                url: data.data[field]
              });
              break; // Found one URL, no need to continue
            }
          }
          
          // If still no servers and we have a streaming URL at the root level
          if (processedData.servers.length === 0 && data.data.stream) {
            processedData.servers.push({
              id: 'direct-stream',
              name: 'Default Stream',
              url: data.data.stream
            });
          }
        }
        
        // If we have a defaultStreamingUrl but no servers, create one server
        if (processedData.servers.length === 0 && processedData.defaultStreamingUrl) {
          processedData.servers.push({
            id: 'default',
            name: 'Default Server',
            url: processedData.defaultStreamingUrl
          });
        }
        
        // If the episode has nextEpisode/prevEpisode objects, process them properly
        if (data.data.nextEpisode && typeof data.data.nextEpisode === 'object') {
          processedData.nextEpisodeId = data.data.nextEpisode.episodeId;
        }
        
        if (data.data.prevEpisode && typeof data.data.prevEpisode === 'object') {
          processedData.prevEpisodeId = data.data.prevEpisode.episodeId;
        }
        
        console.log('Processed episode data:', processedData);
        
        // Store the processed data structure for debugging
        setDebug(prev => ({
          ...prev,
          dataStructure: processedData
        }));
        
        setEpisodeData(processedData);
        
        // Generate mock related episodes
        if (processedData.animeId) {
          const mockRelatedEpisodes = Array.from({ length: 12 }, (_, i) => ({
            id: `ep-${Math.random().toString(36).substring(2, 9)}`,
            animeId: processedData.animeId,
            episodeNumber: String(Math.max(1, parseInt(processedData.episodeNumber || '1') - 6 + i)),
            thumbnail: processedData.thumbnail || '/placeholder-episode.jpg',
            title: `${processedData.animeTitle} Episode ${Math.max(1, parseInt(processedData.episodeNumber || '1') - 6 + i)}`,
            isCurrent: i === 6
          }));
          
          setRelatedEpisodes(mockRelatedEpisodes);
        }
        
        // Generate mock comments
        const mockComments = [
          {
            id: 'c1',
            username: 'AnimeWatcher42',
            avatar: '/avatar1.jpg',
            content: 'This episode was incredible! The animation quality keeps getting better.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            likes: 24,
            replies: []
          },
          {
            id: 'c2',
            username: 'OtakuMaster',
            avatar: '/avatar2.jpg',
            content: 'That plot twist at 18:32 actually made me pause the video. Did not see that coming!',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            likes: 46,
            replies: [
              {
                id: 'r1',
                username: 'SakuraSan',
                avatar: '/avatar3.jpg',
                content: 'I know right? The foreshadowing was subtle but it was there all along!',
                timestamp: new Date(Date.now() - 43200000).toISOString(),
                likes: 12
              }
            ]
          },
          {
            id: 'c3',
            username: 'MangaReader99',
            avatar: '/avatar4.jpg',
            content: 'As a manga reader, I can say they did justice to this chapter. The voice acting was on point!',
            timestamp: new Date(Date.now() - 259200000).toISOString(),
            likes: 31,
            replies: []
          }
        ];
        
        setComments(mockComments);
        
        // Check if episode is bookmarked (mock)
        setIsBookmarked(localStorage.getItem(`bookmark-${episodeId}`) === 'true');
        
      } catch (err) {
        console.error('Error fetching episode data:', err);
        
        // Log the error for debugging
        setDebug(prev => ({
          ...prev,
          apiCalls: [...prev.apiCalls, {
            time: new Date().toISOString(),
            action: 'ERROR',
            endpoint: `/samehadaku/episode/${episodeId}`,
            error: err.message,
            stack: err.stack
          }]
        }));
        
        setError(`Failed to load episode data: ${err.message}`);
      } finally {
        setLoading(false);
        // Add delay to ensure content is rendered before animation starts
        setTimeout(() => setAnimationReady(true), 100);
      }
    };

    fetchEpisodeData();
    // Scroll to top when episode changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Cleanup function - remove episodeData from window when component unmounts
    return () => {
      delete window.episodeData;
      setAnimationReady(false);
    };
  }, [episodeId]);

  // Animation effect for main content
  useEffect(() => {
    if (animationReady && mainContentRef.current) {
      mainContentRef.current.classList.add('animate-fade-in');
    }
  }, [animationReady]);

  // Effect for synopsis expansion animation
  useEffect(() => {
    if (synopsisRef.current) {
      if (showSynopsis) {
        synopsisRef.current.style.maxHeight = `${synopsisRef.current.scrollHeight}px`;
      } else {
        synopsisRef.current.style.maxHeight = '6rem';
      }
    }
  }, [showSynopsis, parsedSynopsis]);

  const handlePlayerError = (errorMsg) => {
    setPlayerError(errorMsg);
    
    // Log player errors for debugging
    setDebug(prev => ({
      ...prev,
      apiCalls: [...prev.apiCalls, {
        time: new Date().toISOString(),
        action: 'PLAYER_ERROR',
        error: errorMsg
      }]
    }));
  };

  const handleRetry = () => {
    // Force reload the current page
    window.location.reload();
  };

  const toggleSynopsis = () => {
    setShowSynopsis(!showSynopsis);
  };
  
  const toggleBookmark = () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    localStorage.setItem(`bookmark-${episodeId}`, newState.toString());
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = `fixed bottom-8 right-8 py-3 px-6 rounded-lg bg-blue-600 text-white shadow-lg z-50 animate-fade-in-up`;
    toast.textContent = newState ? 'Added to bookmarks' : 'Removed from bookmarks';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 2000);
  };
  
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const newComment = {
      id: `c-${Date.now()}`,
      username: 'You',
      avatar: '/avatar-you.jpg',
      content: commentText,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: []
    };
    
    setComments([newComment, ...comments]);
    setCommentText('');
  };
  
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffSeconds = Math.floor((now - commentDate) / 1000);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;
    return commentDate.toLocaleDateString();
  };
  
  const changeServer = (index) => {
    setServerIndex(index);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-float">
          <Loader />
          <p className="mt-4 text-blue-600 dark:text-blue-400 animate-pulse font-medium">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (error || !episodeData) {
    return (
      <div className="container mx-auto px-4 py-10 text-center animate-fade-in">
        <div className="max-w-lg mx-auto glass p-8 rounded-2xl shadow-lg border border-red-200 dark:border-red-800">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-red-500 text-lg mb-6 font-medium">{error || 'Episode not found'}</p>
          
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleRetry}
              className="btn btn-primary hover-lift flex items-center px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Retry Loading
            </button>
            
            <Link 
              to="/" 
              className="btn btn-outline hover-lift flex items-center px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Back to Home
            </Link>
          </div>
          
          {/* Debug information */}
          <div className="mt-8 text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Debug Information</h3>
            <p className="text-sm mb-2">Episode ID: <code>{debug.episodeId}</code></p>
            
            <div className="overflow-auto max-h-64 text-xs">
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Special case: if we have defaultStreamingUrl but no servers
  if (episodeData.defaultStreamingUrl && episodeData.servers.length === 0) {
    episodeData.servers.push({
      id: 'default-server',
      name: 'Default Server',
      url: episodeData.defaultStreamingUrl
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div 
        ref={mainContentRef}
        className="container mx-auto px-4 opacity-0 transition-opacity duration-700"
        style={animationReady ? { opacity: 1 } : {}}
      >
        {/* Breadcrumb/Navigation with hover animation */}
        <div className="mb-6 animate-fade-in">
          {episodeData.animeId ? (
            <Link 
              to={`/anime/${episodeData.animeId}`}
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to {episodeData.animeTitle}
            </Link>
          ) : (
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Home
            </Link>
          )}
        </div>
        
        {/* Title Section with Animation */}
        <div className="perspective mb-8">
          <h1 
            className="text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 transform transition-all duration-500 animate-fade-in"
          >
            {episodeData.animeTitle}
            <span className="block text-2xl lg:text-3xl mt-2 text-gray-800 dark:text-gray-200">
              Episode {episodeData.episodeNumber}
              {episodeData.title && <span className="opacity-80"> - {episodeData.title}</span>}
            </span>
          </h1>
          
          {/* Rating Badge with Animation */}
          {parsedRating.value && parsedRating.value !== "N/A" && (
            <div className="inline-flex items-center mt-4 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 animate-fade-in">
              <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span>{parsedRating.value}</span>
              {parsedRating.users && parsedRating.users !== "0" && (
                <span className="text-xs ml-1 opacity-70">({parsedRating.users} votes)</span>
              )}
            </div>
          )}
          
          {/* Release date if available */}
          {episodeData.releaseDate && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 animate-fade-in">
              Released on: {new Date(episodeData.releaseDate).toLocaleDateString()}
            </div>
          )}
          
         {/* Bookmark button */}
         <button 
            onClick={toggleBookmark}
            className={`mt-4 inline-flex items-center px-4 py-2 rounded-full ${isBookmarked ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'} transition-all duration-300 transform hover:scale-105 hover:shadow-md animate-fade-in`}
          >
            <svg 
              className={`w-5 h-5 mr-2 ${isBookmarked ? 'text-pink-500 fill-current' : 'text-gray-500 dark:text-gray-400'}`} 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={isBookmarked 
                ? "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                : "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"}
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill={isBookmarked ? "currentColor" : "none"}
              />
            </svg>
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>
        
        {/* Episode Navigation - Previous/Next buttons with fluid animation */}
        <div className="flex justify-between mb-8 animate-fade-in">
          {episodeData.prevEpisodeId ? (
            <Link 
              to={`/watch/${episodeData.prevEpisodeId}`}
              className="btn-nav group flex items-center px-5 py-3 rounded-lg bg-gradient-to-r from-purple-600/10 to-transparent border border-purple-300/30 dark:border-purple-800/30 text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 dark:hover:bg-purple-800/40 transition-all duration-500 transform hover:-translate-x-1"
            >
              <svg className="w-5 h-5 mr-2 transform transition-transform duration-500 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Previous Episode
            </Link>
          ) : (
            <div className="invisible">
              <span className="btn-nav px-5 py-3">Previous Episode</span>
            </div>
          )}
          
          {episodeData.nextEpisodeId ? (
            <Link 
              to={`/watch/${episodeData.nextEpisodeId}`}
              className="btn-nav group flex items-center px-5 py-3 rounded-lg bg-gradient-to-l from-blue-600/10 to-transparent border border-blue-300/30 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 hover:bg-blue-600/20 dark:hover:bg-blue-800/40 transition-all duration-500 transform hover:translate-x-1"
            >
              Next Episode
              <svg className="w-5 h-5 ml-2 transform transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          ) : (
            <div className="invisible">
              <span className="btn-nav px-5 py-3">Next Episode</span>
            </div>
          )}
        </div>
        
        {/* Player with shimmer animation while loading */}
        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 mb-8 transform hover:shadow-blue-200/20 dark:hover:shadow-blue-900/30 transition-all duration-500 relative">
          {/* Server selection tabs */}
          {episodeData.servers && episodeData.servers.length > 0 && (
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 border-b border-gray-200 dark:border-gray-700 flex overflow-x-auto scrollbar-hide">
              {episodeData.servers.map((server, index) => (
                <button
                  key={server.id}
                  onClick={() => changeServer(index)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap mr-2 last:mr-0 transition-all duration-300 ${
                    index === serverIndex 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {server.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Video player with error handling */}
          <div className="relative aspect-video bg-black">
            {episodeData.servers && episodeData.servers.length > 0 ? (
              playerError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-5 text-center">
                  <svg className="w-16 h-16 text-red-500 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-xl font-semibold mb-2">Player Error</p>
                  <p className="text-gray-400 mb-4">{playerError}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button 
                      onClick={handleRetry}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-300"
                    >
                      Retry
                    </button>
                    {episodeData.servers.length > 1 && (
                      <div className="px-4 py-2 bg-gray-700 rounded-lg">
                        Try another server
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <VideoPlayer 
                  url={episodeData.servers[serverIndex].url}
                  onError={handlePlayerError}
                />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                <p>No video sources available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Synopsis Section with gradient background and expanding animation */}
        <div className="glass mb-8 rounded-2xl overflow-hidden shadow-lg animate-fade-in border border-gray-200/50 dark:border-gray-700/50">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Synopsis</h2>
          </div>
          
          <div 
            ref={synopsisRef}
            className="px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm max-h-24 overflow-hidden transition-all duration-500"
          >
            {parsedSynopsis.paragraphs.map((paragraph, index) => (
              <p 
                key={index} 
                className={`mb-4 last:mb-0 text-gray-700 dark:text-gray-300 ${
                  index > 0 && !showSynopsis ? 'opacity-50' : ''
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>
          
          <div 
            className="px-6 py-3 text-center border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
          >
            <button 
              onClick={toggleSynopsis}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300"
            >
              <span>{showSynopsis ? 'Show Less' : 'Read More'}</span>
              <svg 
                className={`w-4 h-4 ml-1 transition-transform duration-300 ${showSynopsis ? 'transform rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content tabs - Comments & Related Episodes */}
        <div className="glass rounded-2xl overflow-hidden shadow-lg animate-fade-in border border-gray-200/50 dark:border-gray-700/50 mb-12">
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-4 px-6 text-center transition-colors duration-300 relative ${
                activeTab === 'comments' 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span className="relative z-10">Comments</span>
              {activeTab === 'comments' && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-y-px"></span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('related')}
              className={`flex-1 py-4 px-6 text-center transition-colors duration-300 relative ${
                activeTab === 'related' 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span className="relative z-10">Related Episodes</span>
              {activeTab === 'related' && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-y-px"></span>
              )}
            </button>
          </div>
          
          {/* Tab content */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            {/* Comments tab */}
            {activeTab === 'comments' && (
              <div className="p-6">
                {/* Comment form */}
                <form onSubmit={handleCommentSubmit} className="mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                      YOU
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all duration-300 placeholder-gray-400 resize-none"
                        placeholder="Share your thoughts about this episode..."
                        rows="3"
                      ></textarea>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={!commentText.trim()}
                          className={`px-4 py-2 rounded-lg ${
                            commentText.trim() 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all duration-300' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                
                {/* Comments list */}
                <div className="space-y-6">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="animate-fade-in">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                            <img 
                              src={comment.avatar} 
                              alt={comment.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `/user-placeholder.jpg`;
                              }}
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{comment.username}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>
                            <div className="flex items-center gap-4">
                              <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                                </svg>
                                <span>{comment.likes}</span>
                              </button>
                              <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Reply</button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Replies to this comment */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="pl-13 mt-4 space-y-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                  <img 
                                    src={reply.avatar} 
                                    alt={reply.username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `/user-placeholder.jpg`;
                                    }}
                                  />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{reply.username}</h4>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(reply.timestamp)}</span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 mb-2">{reply.content}</p>
                                  <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                                      </svg>
                                      <span>{reply.likes}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-3 text-gray-400 dark:text-gray-500">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">Be the first to comment on this episode!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Related Episodes tab */}
            {activeTab === 'related' && (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedEpisodes.map((episode) => (
                    <Link
                      key={episode.id}
                      to={`/watch/${episode.id}`}
                      className={`group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 ${
                        episode.isCurrent ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                      }`}
                    >
                      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <img
                          src={episode.thumbnail}
                          alt={episode.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `/placeholder-episode.jpg`;
                          }}
                        />
                        {episode.isCurrent && (
                          <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center backdrop-blur-sm">
                            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                              Current Episode
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          EP {episode.episodeNumber}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{episode.title}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating action button for quick navigation */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center transform hover:scale-110 ${
            window.scrollY > 300 ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Watch;