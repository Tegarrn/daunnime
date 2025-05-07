// src/components/EnhancedVideoPlayer.jsx
import { useState, useEffect } from 'react';
import { getServerData } from '../services/api';
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
      setVideoUrl(selectedServer.url);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await getServerData(id);
      console.log('Server data response:', data);
      
      if (data && data.data) {
        // Try to find the video URL in different possible fields
        const url = data.data.url || 
                    data.data.videoUrl || 
                    data.data.streamingUrl || 
                    data.data.embedUrl;
                    
        if (url) {
          setVideoUrl(url);
        } else {
          const errorMsg = 'No video URL found for this server.';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } else {
        const errorMsg = 'Invalid server data response.';
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
        return (
          <div 
            className="w-full h-full" 
            dangerouslySetInnerHTML={{ __html: videoUrl }}
          />
        );
      } else {
        // Direct URL to iframe
        return (
          <iframe 
            src={videoUrl} 
            className="w-full h-full" 
            frameBorder="0" 
            allowFullScreen
            title="Anime Episode"
          />
        );
      }
    }
    
    // Default state - no video selected
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
      {serverOptions && serverOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-gray-700 dark:text-gray-300 font-medium mr-2">Servers:</span>
          {serverOptions.map(server => (
            <button
              key={server.id}
              onClick={() => handleServerChange(server.id)}
              className={`px-3 py-1 rounded text-sm ${
                selectedServerId === server.id
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