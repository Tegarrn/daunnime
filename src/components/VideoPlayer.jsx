// src/components/EnhancedVideoPlayer.jsx
import { useState, useEffect, useRef } from 'react';
import { getServerData } from '../services/api';
import { Maximize, Minimize, Settings } from 'lucide-react';

const VideoPlayer = ({ serverId, serverOptions, onError }) => {
  const [selectedServerId, setSelectedServerId] = useState(serverId || (serverOptions && serverOptions.length > 0 ? serverOptions[0].id : null));
  const [isLoading, setIsLoading] = useState(false);
  const [streamingUrl, setStreamingUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeServer, setActiveServer] = useState(null);
  const [isFullPlayer, setIsFullPlayer] = useState(false);
  const [isPlayerSettingsOpen, setIsPlayerSettingsOpen] = useState(false);
  const iframeRef = useRef(null);
  const playerContainerRef = useRef(null);

  // Function to extract real streaming URL from default URL if needed
  const getEmbedUrl = (url) => {
    // Debug log to see what URL we're processing
    console.log('Processing URL for embed:', url);
    
    // Handle different URL patterns
    if (!url) return null;
    
    // Handle Blogger video URLs
    if (url.includes('blogger.com/video.g?token=')) {
      // Fix: Ensure the protocol is set to https
      if (!url.startsWith('http')) {
        url = `https:${url}`;
      } else if (url.startsWith('http:')) {
        url = url.replace('http:', 'https:');
      }
      return url;
    }
    
    // Handle iframes in URLs (extract src attribute)
    if (url.includes('<iframe')) {
      const srcMatch = url.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let extractedUrl = srcMatch[1];
        // Fix: Ensure the protocol is set to https
        if (!extractedUrl.startsWith('http')) {
          extractedUrl = `https:${extractedUrl}`;
        } else if (extractedUrl.startsWith('http:')) {
          extractedUrl = extractedUrl.replace('http:', 'https:');
        }
        return extractedUrl;
      }
    }
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([^/]+)/);
      if (fileId && fileId[1]) {
        return `https://drive.google.com/file/d/${fileId[1]}/preview`;
      }
    }
    
    // Fix: Ensure any URL has proper https protocol
    if (!url.startsWith('http')) {
      url = `https:${url}`;
    } else if (url.startsWith('http:')) {
      url = url.replace('http:', 'https:');
    }
    
    // Return processed URL
    return url;
  };

  // Load the selected server
  useEffect(() => {
    const loadServer = async () => {
      if (!selectedServerId || !serverOptions) return;
      
      try {
        setIsLoading(true);
        setErrorMessage('');
        
        // Find the selected server in the options
        const server = serverOptions.find(s => s.id === selectedServerId);
        if (!server) {
          throw new Error(`Server with ID ${selectedServerId} not found`);
        }
        
        setActiveServer(server);
        
        // Check if we already have a URL
        if (server.url) {
          const embedUrl = getEmbedUrl(server.url);
          console.log('Using cached server URL:', embedUrl);
          setStreamingUrl(embedUrl);
        } else {
          // Get URL from API if not available
          console.log('Fetching server data for ID:', selectedServerId);
          const serverData = await getServerData(selectedServerId);
          
          if (!serverData || !serverData.data) {
            throw new Error('Invalid server data response');
          }
          
          // Try to find streaming URL in multiple possible locations
          let rawUrl = null;
          
          if (serverData.data.streamingUrl) {
            rawUrl = serverData.data.streamingUrl;
          } else if (serverData.data.url) {
            rawUrl = serverData.data.url;
          } else if (serverData.data.defaultStreamingUrl) {
            rawUrl = serverData.data.defaultStreamingUrl;
          } else if (typeof serverData.data === 'string' && serverData.data.includes('http')) {
            // Handle case where data itself might be the URL
            rawUrl = serverData.data;
          }
          
          if (!rawUrl) {
            throw new Error('No streaming URL found for this server');
          }
          
          console.log('Raw URL from server:', rawUrl);
          const embedUrl = getEmbedUrl(rawUrl);
          console.log('Processed embed URL:', embedUrl);
          
          setStreamingUrl(embedUrl);
          
          // Update the server object with the URL
          server.url = embedUrl;
        }
      } catch (err) {
        console.error('Error loading server:', err);
        setErrorMessage(`Failed to load server: ${err.message}`);
        if (onError) {
          onError(`Failed to load server: ${err.message}`);
        }
        setStreamingUrl('');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadServer();
  }, [selectedServerId, serverOptions, onError]);

  // Handle server selection
  const handleServerChange = (serverId) => {
    setSelectedServerId(serverId);
  };

  // Handle player errors
  const handleIframeError = () => {
    console.error('Iframe failed to load:', streamingUrl);
    setErrorMessage(`Failed to load video from ${activeServer?.name || 'selected server'}`);
    if (onError) {
      onError(`Failed to load video from ${activeServer?.name || 'selected server'}`);
    }
  };

  // Toggle full player mode
  const toggleFullPlayer = () => {
    setIsFullPlayer(!isFullPlayer);
    // Scroll to player when expanding
    if (!isFullPlayer) {
      playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle player settings
  const togglePlayerSettings = () => {
    setIsPlayerSettingsOpen(!isPlayerSettingsOpen);
  };

  return (
    <div className="video-player-container w-full" ref={playerContainerRef}>
      {/* Video Player with premium styling */}
      <div className={`relative shadow-xl rounded-lg overflow-hidden transition-all duration-300 bg-black ${isFullPlayer ? 'aspect-video w-full' : 'md:w-4/5 lg:w-3/4 mx-auto aspect-video'}`}>
        {/* Player Control Bar */}
        <div className="absolute top-0 right-0 z-10 flex items-center gap-2 p-2 bg-gradient-to-b from-black/70 to-transparent">
          <button 
            onClick={togglePlayerSettings}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all"
            title="Player Settings"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={toggleFullPlayer}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all"
            title={isFullPlayer ? "Compact Mode" : "Full Width"}
          >
            {isFullPlayer ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>

        {/* Player Content */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-white mt-4">Loading video...</p>
            </div>
          </div>
        ) : streamingUrl ? (
          <iframe
            ref={iframeRef}
            src={streamingUrl}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allowFullScreen
            title="Anime Video Player"
            onError={handleIframeError}
            onLoad={() => console.log('Iframe loaded successfully')}
            sandbox="allow-scripts allow-same-origin allow-forms"
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center p-4">
              <p className="mb-2">Video source not available</p>
              <p className="text-sm">{errorMessage || 'Please select another server below'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Server Selection with improved UI */}
      {serverOptions && serverOptions.length > 0 && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-medium mb-3 dark:text-white">Streaming Servers</h3>
          <div className="flex flex-wrap gap-2">
            {serverOptions.map((server) => (
              <button
                key={server.id}
                onClick={() => handleServerChange(server.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedServerId === server.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {server.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Player Settings Panel (only shown when settings are open) */}
      {isPlayerSettingsOpen && (
        <div className="bg-white dark:bg-gray-800 mt-2 p-4 rounded-lg shadow-md">
          <h4 className="font-medium mb-2 dark:text-white">Player Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="autoplay" className="rounded" />
              <label htmlFor="autoplay" className="text-sm dark:text-white">Autoplay</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="autoNextEp" className="rounded" />
              <label htmlFor="autoNextEp" className="text-sm dark:text-white">Auto Next Episode</label>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Information (can be removed in production) */}
      {import.meta.env.DEV && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
          <details>
            <summary className="cursor-pointer text-gray-700 dark:text-gray-300">Debug Info</summary>
            <div className="mt-2 space-y-1 text-xs">
              <div>Selected Server ID: {selectedServerId || 'None'}</div>
              <div>Active Server: {activeServer?.name || 'None'}</div>
              <div>Streaming URL: {streamingUrl || 'None'}</div>
              {errorMessage && <div className="text-red-500">Error: {errorMessage}</div>}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;