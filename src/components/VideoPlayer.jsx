// src/components/VideoPlayer.jsx (atau EnhancedVideoPlayer.jsx)
import { useState, useEffect } from 'react';
import { getStreamingServerLink } from '../services/api'; // Perubahan di sini
import Loader from './Loader';

const EnhancedVideoPlayer = ({ serverId, serverOptions = [], onError }) => {
  const [selectedServerId, setSelectedServerId] = useState(serverId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    if (selectedServerId) {
      loadVideoFromServer(selectedServerId);
    }
  }, [selectedServerId]);

  useEffect(() => {
    // If serverId prop changes, update selectedServerId
    if (serverId && serverId !== selectedServerId) {
      setSelectedServerId(serverId);
    }
  }, [serverId]);

  const loadVideoFromServer = async (id) => {
    // Check if the server already has a URL in serverOptions
    const selectedServer = serverOptions.find(server => server.id === id);
    if (selectedServer && selectedServer.url) {
      // If the server object itself contains a direct URL, use it.
      // This is common if the episode details already provide resolved stream URLs per server.
      setVideoUrl(selectedServer.url);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // Make sure 'id' here is the actual serverId that getStreamingServerLink expects
      const data = await getStreamingServerLink(id); // Perubahan di sini
      console.log('Streaming server link response:', data); // Updated log
      
      // Adjust data handling based on the actual structure of 'getStreamingServerLink' response
      // Assuming 'data' itself or 'data.data' might contain the URL
      let url;
      if (data && data.data && (data.data.url || data.data.videoUrl || data.data.streamingUrl || data.data.embedUrl)) {
        url = data.data.url || 
              data.data.videoUrl || 
              data.data.streamingUrl || 
              data.data.embedUrl;
      } else if (data && (data.url || data.videoUrl || data.streamingUrl || data.embedUrl)) {
        // If the URL is at the root of the response object
        url = data.url || 
              data.videoUrl || 
              data.streamingUrl || 
              data.embedUrl;
      }
                    
      if (url) {
        setVideoUrl(url);
      } else {
        const errorMsg = 'No video URL found for this server from API.';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      }
    } catch (err) {
      console.error('Error loading video from server:', err);
      const errorMsg = 'Failed to load video. Please try another server.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleServerChange = (id) => {
    // 'id' here should be the identifier used to fetch the server link, 
    // or if serverOptions contains full URLs, it might be the URL itself or an index.
    // For now, assuming 'id' is what's passed to loadVideoFromServer.
    setSelectedServerId(id);
  };

  const renderVideoContent = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <Loader />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-center p-4">
          <div>
            <p className="mb-2">{error}</p>
            <p className="text-sm">Please try selecting a different server.</p>
          </div>
        </div>
      );
    }
    
    if (videoUrl) {
      // Handle different types of video URLs
      if (videoUrl.includes('<iframe') || videoUrl.includes('<script')) {
        // If the URL is actually an HTML embed code
        return (
          <div 
            className="w-full h-full" 
            dangerouslySetInnerHTML={{ __html: videoUrl }}
          />
        );
      } else {
        // If it's a direct URL to an iframe-able source or a video file
        return (
          <iframe 
            src={videoUrl} 
            className="w-full h-full" 
            frameBorder="0" 
            allowFullScreen
            allow="autoplay; encrypted-media" // Added common allow attributes
            title="Anime Episode"
            sandbox="allow-forms allow-presentation allow-same-origin allow-scripts allow-popups" // Added sandbox for security with embeds
          />
        );
      }
    }
    
    // Default state - no video selected or videoUrl is null
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
        <p>Select a server to watch this episode</p>
      </div>
    );
  };

  return (
    <div className="video-player-container">
      {/* Video player */}
      <div className="aspect-video bg-black mb-4 relative">
        {renderVideoContent()}
      </div>

      {/* Server selection buttons */}
      {/* Ensure serverOptions are passed correctly to this component from Watch.jsx */}
      {/* And that each server object in serverOptions has a unique 'id' and a 'name' */}
      {serverOptions && serverOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-gray-700 dark:text-gray-300 font-medium mr-2">Servers:</span>
          {serverOptions.map(server => (
            <button
              key={server.id || server.name} // Ensure key is unique
              onClick={() => handleServerChange(server.id)} // Pass server.id (or the correct identifier)
              className={`px-3 py-1 rounded text-sm ${
                selectedServerId === server.id // Compare with the identifier used for fetching
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-blue-500 hover:text-white dark:hover:bg-blue-800'
              }`}
            >
              {server.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoPlayer;