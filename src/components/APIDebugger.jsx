// src/components/APIDebugger.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const APIDebugger = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState('home');
  const [customParams, setCustomParams] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  
  const apiEndpoints = [
    { name: 'home', fn: api.getHomeData, params: [] },
    { name: 'recent', fn: api.getRecentAnime, params: ['page'] },
    { name: 'popular', fn: api.getPopularAnime, params: ['page'] },
    { name: 'anime details', fn: api.getAnimeDetails, params: ['animeId'] },
    { name: 'episode data', fn: api.getEpisodeData, params: ['episodeId'] },
    { name: 'server data', fn: api.getServerData, params: ['serverId'] },
    { name: 'search', fn: api.searchAnime, params: ['query', 'page'] }
  ];

  const testEndpoint = async (name, fn, params = []) => {
    try {
      setIsLoading(true);
      const args = params.map(param => customParams[param] || '1');
      console.log(`Testing ${name} with args:`, args);
      
      const result = await fn(...args);
      console.log(`${name} result:`, result);
      
      setTestResults(prev => ({
        ...prev,
        [name]: {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        }
      }));
      return true;
    } catch (error) {
      console.error(`Error testing ${name}:`, error);
      setTestResults(prev => ({
        ...prev,
        [name]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testAll = async () => {
    setIsLoading(true);
    const results = {};
    
    for (const endpoint of apiEndpoints) {
      const args = endpoint.params.map(param => customParams[param] || '1');
      try {
        const result = await endpoint.fn(...args);
        results[endpoint.name] = {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        results[endpoint.name] = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  const handleInputChange = (param, value) => {
    setCustomParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const renderEndpointForm = () => {
    const endpoint = apiEndpoints.find(ep => ep.name === selectedEndpoint);
    if (!endpoint) return null;

    return (
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h3 className="text-lg font-medium mb-2">Test {endpoint.name}</h3>
        
        {endpoint.params.map(param => (
          <div key={param} className="mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {param}:
            </label>
            <input
              type="text"
              value={customParams[param] || ''}
              onChange={(e) => handleInputChange(param, e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder={`Enter ${param}`}
            />
          </div>
        ))}
        
        <button
          onClick={() => testEndpoint(endpoint.name, endpoint.fn, endpoint.params)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : `Test ${endpoint.name}`}
        </button>
      </div>
    );
  };

  const tryNavigateToAnime = (animeId) => {
    navigate(`/anime/${animeId}`);
  };

  const tryNavigateToEpisode = (episodeId) => {
    navigate(`/watch/${episodeId}`);
  };

  const renderTestResults = () => {
    if (Object.keys(testResults).length === 0) {
      return <p className="text-gray-500">No tests run yet.</p>;
    }

    return (
      <div className="space-y-6">
        {Object.entries(testResults).map(([name, result]) => (
          <div 
            key={name} 
            className={`p-4 rounded ${
              result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <h3 className={`text-lg font-medium ${
              result.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
            }`}>
              {name}: {result.success ? 'Success' : 'Failed'}
            </h3>
            <p className="text-xs text-gray-500 mb-2">Tested at {result.timestamp}</p>
            
            {result.success ? (
              <>
                <div className="mb-2">
                  <p className="text-sm font-medium">Data Snapshot:</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
                
                {name === 'home' && result.data?.data?.recentEpisodes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Quick Navigation:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.data.data.recentEpisodes.slice(0, 5).map((episode, idx) => (
                        <button
                          key={idx}
                          onClick={() => episode.episodeId && tryNavigateToEpisode(episode.episodeId)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          Watch {episode.title || `Episode ${episode.episodeNumber || idx}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {(name === 'recent' || name === 'popular') && result.data?.data && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Quick Navigation:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.data.data.slice(0, 5).map((anime, idx) => (
                        <button
                          key={idx}
                          onClick={() => anime.animeId && tryNavigateToAnime(anime.animeId)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          View {anime.title || `Anime ${idx}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-red-600 dark:text-red-400">{result.error}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">API Debugger</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Test Controls</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Endpoint:
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {apiEndpoints.map(endpoint => (
                <option key={endpoint.name} value={endpoint.name}>
                  {endpoint.name}
                </option>
              ))}
            </select>
          </div>
          
          {renderEndpointForm()}
          
          <div className="mt-4">
            <button
              onClick={testAll}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? 'Testing All...' : 'Test All Endpoints'}
            </button>
          </div>
          
          <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Debug Tips</h3>
            <ul className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
              <li>Check network requests in browser DevTools</li>
              <li>Verify API_URL in api.js matches backend</li>
              <li>Look for CORS issues in console</li>
              <li>Ensure you're handling response structure correctly</li>
            </ul>
          </div>
        </div>
        
        <div className="md:col-span-2 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Test Results</h2>
          {isLoading && <p className="text-blue-500">Running tests...</p>}
          {renderTestResults()}
        </div>
      </div>
    </div>
  );
};

export default APIDebugger;