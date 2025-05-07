// src/components/VideoPlayer.jsx
import { useState, useEffect, useRef } from 'react';
import { getServerData } from '../services/api';

const VideoPlayer = ({ serverId, serverOptions, onError }) => {
  const [selectedServerId, setSelectedServerId] = useState(serverId || (serverOptions && serverOptions.length > 0 ? serverOptions[0].id : null));
  const [isLoading, setIsLoading] = useState(false);
  const [streamingUrl, setStreamingUrl] = useState('');
  const [activeServer, setActiveServer] = useState(null);
  const iframeRef = useRef(null);

  // Function to extract real streaming URL from default URL if needed
  const getEmbedUrl = (url) => {
    // Handle different URL patterns
    if (!url) return null;
    
    // Handle Blogger video URLs
    if (url.includes('blogger.com/video.g?token=')) {
      return url; // Return as is - these are already embed URLs
    }
    
    // Handle iframes in URLs (extract src attribute)
    if (url.includes('<iframe')) {
      const srcMatch = url.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        return srcMatch[1];
      }
    }
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([^/]+)/);
      if (fileId && fileId[1]) {
        return `https://drive.google.com/file/d/${fileId[1]}/preview`;
      }
    }
    
    // Return original URL if no patterns match
    return url;
  };

  // Load the selected server
  useEffect(() => {
    const loadServer = async () => {
      if (!selectedServerId || !serverOptions) return;
      
      try {
        setIsLoading(true);
        
        // Find the selected server in the options
        const server = serverOptions.find(s => s.id === selectedServerId);
        if (!server) {
          throw new Error(`Server with ID ${selectedServerId} not found`);
        }
        
        setActiveServer(server);
        
        // Check if we already have a URL
        if (server.url) {
          const embedUrl = getEmbedUrl(server.url);
          setStreamingUrl(embedUrl);
        } else {
          // Get URL from API if not available
          const serverData = await getServerData(selectedServerId);
          
          if (!serverData || !serverData.data || !serverData.data.streamingUrl) {
            throw new Error('No streaming URL found for this server');
          }
          
          const embedUrl = getEmbedUrl(serverData.data.streamingUrl);
          setStreamingUrl(embedUrl);
          
          // Update the server object with the URL
          server.url = embedUrl;
        }
      } catch (err) {
        console.error('Error loading server:', err);
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
    if (onError) {
      onError(`Failed to load video from ${activeServer?.name || 'selected server'}`);
    }
  };

  return (
    <div className="video-player w-full">
      {/* Video Player */}
      <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden mb-4">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : streamingUrl ? (
          <iframe
            ref={iframeRef}
            src={streamingUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            title="Anime Video Player"
            onError={handleIframeError}
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center p-4">
              <p className="mb-2">Video source not available</p>
              <p className="text-sm">Please select another server below</p>
            </div>
          </div>
        )}
      </div>

      {/* Server Selection */}
      {serverOptions && serverOptions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 dark:text-white">Servers:</h3>
          <div className="flex flex-wrap gap-2">
            {serverOptions.map((server) => (
              <button
                key={server.id}
                onClick={() => handleServerChange(server.id)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  selectedServerId === server.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {server.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;