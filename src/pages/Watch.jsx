// src/pages/Watch.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEpisodeData } from '../services/api';
import EnhancedVideoPlayer from '../components/EnhancedVideoPlayer';
import Loader from '../components/Loader';

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const [episodeData, setEpisodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerError, setPlayerError] = useState(null);
  const [debug, setDebug] = useState({
    episodeId: episodeId,
    apiCalls: [],
    dataStructure: null
  });

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
          servers: [],
          nextEpisodeId: null,
          prevEpisodeId: null
        };
        
        // Extract basic episode info
        processedData.title = data.data.title || '';
        processedData.animeTitle = data.data.animeTitle || data.data.animeName || 'Unknown Anime';
        processedData.animeId = data.data.animeId || '';
        processedData.episodeNumber = data.data.episodeNumber || data.data.number || '';
        processedData.nextEpisodeId = data.data.nextEpisodeId || data.data.nextId || null;
        processedData.prevEpisodeId = data.data.prevEpisodeId || data.data.prevId || null;
        
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
        
        // If we still have no servers, provide fallback for debugging
        if (processedData.servers.length === 0) {
          console.warn('No servers found in episode data');
          
          // Create a debug server to show the issue
          processedData.servers.push({
            id: 'debug-empty',
            name: 'Debug (No Servers Found)',
            url: null
          });
        }
        
        console.log('Processed episode data:', processedData);
        
        // Store the processed data structure for debugging
        setDebug(prev => ({
          ...prev,
          dataStructure: processedData
        }));
        
        setEpisodeData(processedData);
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
      }
    };

    fetchEpisodeData();
    // Scroll to top when episode changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [episodeId]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error || !episodeData) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-red-500 text-lg mb-4">{error || 'Episode not found'}</p>
        
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Loading
          </button>
          
          <Link 
            to="/" 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Home
          </Link>
        </div>
        
        {/* Debug information */}
        <div className="mt-8 text-left bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h3 className="font-medium text-lg mb-2">Debug Information</h3>
          <p className="text-sm mb-2">Episode ID: <code>{debug.episodeId}</code></p>
          
          <div className="overflow-auto max-h-64 text-xs">
            <pre>{JSON.stringify(debug, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        {episodeData.animeId ? (
          <Link 
            to={`/anime/${episodeData.animeId}`}
            className="text-blue-500 hover:underline"
          >
            &larr; Back to {episodeData.animeTitle}
          </Link>
        ) : (
          <Link 
            to="/" 
            className="text-blue-500 hover:underline"
          >
            &larr; Back to Home
          </Link>
        )}
      </div>
      
      <h1 className="text-2xl font-bold mb-4 dark:text-white">
        {episodeData.animeTitle} - Episode {episodeData.episodeNumber}
        {episodeData.title && ` - ${episodeData.title}`}
      </h1>
      
      {/* Video Player Section */}
      <div className="mb-6">
        {episodeData.servers && episodeData.servers.length > 0 ? (
          <EnhancedVideoPlayer 
            serverId={episodeData.servers[0].id}
            serverOptions={episodeData.servers}
            onError={handlePlayerError}
          />
        ) : (
          <div className="aspect-video bg-gray-800 text-white flex items-center justify-center">
            <p>No streaming servers available</p>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {playerError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p className="font-medium">Video Player Error:</p>
          <p>{playerError}</p>
          <p className="mt-2 text-sm">
            Please try selecting a different server or check your internet connection.
          </p>
        </div>
      )}
      
      {/* Episode Navigation */}
      <div className="flex justify-between mb-8">
        <div>
          {episodeData.prevEpisodeId && (
            <Link
              to={`/watch/${episodeData.prevEpisodeId}`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors dark:text-white"
            >
              &larr; Previous Episode
            </Link>
          )}
        </div>
        <div>
          {episodeData.nextEpisodeId && (
            <Link
              to={`/watch/${episodeData.nextEpisodeId}`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors dark:text-white"
            >
              Next Episode &rarr;
            </Link>
          )}
        </div>
      </div>
      
      {/* Debug information (hidden in production) */}
      {import.meta.env.DEV && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-2 overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(debug, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
      
      {/* Comments section placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Comments</h2>
        <p className="text-gray-500 dark:text-gray-400">Comments feature coming soon!</p>
      </div>
    </div>
  );
};

export default Watch;