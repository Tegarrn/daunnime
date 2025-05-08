// src/pages/Watch.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEpisodeData } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import BatchDownloadSection from '../components/BatchDownloadSection';
import Loader from '../components/Loader';
import { Download, ArrowDown, Clock, Calendar, Info } from 'lucide-react';

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const [episodeData, setEpisodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerError, setPlayerError] = useState(null);
  const [isFullPlayer, setIsFullPlayer] = useState(false);
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
          prevEpisodeId: null,
          defaultStreamingUrl: null, // Add this field
          releaseDate: data.data.releaseDate || null,
          uploadDate: data.data.uploadDate || data.data.date || null
        };
        
        // Extract basic episode info
        processedData.title = data.data.title || '';
        processedData.animeTitle = data.data.animeTitle || data.data.animeName || 'Unknown Anime';
        processedData.animeId = data.data.animeId || '';
        processedData.episodeNumber = data.data.episodeNumber || data.data.number || '';
        processedData.nextEpisodeId = data.data.nextEpisode?.episodeId || data.data.nextId || null;
        processedData.prevEpisodeId = data.data.prevEpisode?.episodeId || data.data.prevId || null;
        
        // Extract defaultStreamingUrl if available (important!)
        processedData.defaultStreamingUrl = data.data.defaultStreamingUrl || null;
        
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
    
    // Cleanup function - remove episodeData from window when component unmounts
    return () => {
      delete window.episodeData;
    };
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

  const handleFullScreenToggle = (isFullscreen) => {
    setIsFullPlayer(isFullscreen);
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

  // Special case: if we have defaultStreamingUrl but no servers
  if (episodeData.defaultStreamingUrl && episodeData.servers.length === 0) {
    episodeData.servers.push({
      id: 'default-server',
      name: 'Default Server',
      url: episodeData.defaultStreamingUrl
    });
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Navigation Breadcrumb with enhanced styling */}
      <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 px-4 rounded-lg flex items-center">
        {episodeData.animeId ? (
          <Link 
            to={`/anime/${episodeData.animeId}`}
            className="text-blue-500 hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{episodeData.animeTitle}</span>
          </Link>
        ) : (
          <Link 
            to="/" 
            className="text-blue-500 hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>
        )}
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600 dark:text-gray-300">Episode {episodeData.episodeNumber}</span>
      </div>
      
      {/* Episode Title & Info */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 dark:text-white">
          {episodeData.animeTitle} - Episode {episodeData.episodeNumber}
          {episodeData.title && ` - ${episodeData.title}`}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {episodeData.uploadDate && (
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>Released: {new Date(episodeData.uploadDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {episodeData.releaseDate && (
            <div className="flex items-center">
              <Clock size={16} className="mr-1" />
              <span>Aired: {new Date(episodeData.releaseDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Video Player Section */}
      <div className="mb-6">
        {episodeData.servers && episodeData.servers.length > 0 ? (
          <VideoPlayer 
            serverId={episodeData.servers[0].id}
            serverOptions={episodeData.servers}
            onError={handlePlayerError}
            onFullScreenToggle={handleFullScreenToggle}
          />
        ) : episodeData.defaultStreamingUrl ? (
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-xl">
            <iframe 
              src={episodeData.defaultStreamingUrl}
              className="w-full h-full" 
              allowFullScreen
              title={episodeData.title}
            ></iframe>
          </div>
        ) : (
          <div className="aspect-video bg-gray-800 text-white flex items-center justify-center rounded-lg overflow-hidden shadow-xl">
            <p>No streaming servers available</p>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {playerError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <Info size={20} className="mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Video Player Error:</p>
              <p>{playerError}</p>
              <p className="mt-2 text-sm">
                Please try selecting a different server or check your internet connection.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Batch Download Section - only show when not in full player mode */}
      {!isFullPlayer && episodeData.animeId && (
        <div className="mb-6">
          <BatchDownloadSection 
            animeId={episodeData.animeId} 
            animeTitle={episodeData.animeTitle} 
          />
        </div>
      )}
      
      {/* Episode Navigation with enhanced styling */}
      <div className="flex justify-between mb-8 gap-4">
        <div className="flex-1">
          {episodeData.prevEpisodeId ? (
            <Link
              to={`/watch/${episodeData.prevEpisodeId}`}
              className="flex items-center justify-center md:justify-start w-full px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all dark:text-white shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500 dark:text-gray-400">Previous</span>
                <span className="font-medium">Episode {parseInt(episodeData.episodeNumber) - 1}</span>
              </div>
            </Link>
          ) : (
            <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-50 text-center text-gray-400 dark:text-gray-500">
              <span>First Episode</span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          {episodeData.nextEpisodeId ? (
            <Link
              to={`/watch/${episodeData.nextEpisodeId}`}
              className="flex items-center justify-center md:justify-end w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-white shadow-sm"
            >
              <div className="flex flex-col items-end">
                <span className="text-xs text-blue-100">Next</span>
                <span className="font-medium">Episode {parseInt(episodeData.episodeNumber) + 1}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-50 text-center text-gray-400 dark:text-gray-500">
              <span>Latest Episode</span>
            </div>
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
      
      {/* Comments section with enhanced styling */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Comments
        </h2>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Comments feature coming soon!</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Join the discussion about this episode</p>
        </div>
      </div>
    </div>
  );
};

export default Watch;