// src/components/VideoPlayer.jsx
import { useState, useEffect } from 'react';
import { getServerData } from '../services/api';
import Loader from '../components/Loader';

const VideoPlayer = ({ serverId, serverOptions }) => {
  const [videoSource, setVideoSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServer, setSelectedServer] = useState(serverId);

  useEffect(() => {
    const fetchVideoSource = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getServerData(selectedServer);
        setVideoSource(data.videoSource);
      } catch (err) {
        setError('Failed to load video. Please try another server.');
      } finally {
        setLoading(false);
      }
    };

    if (selectedServer) {
      fetchVideoSource();
    }
  }, [selectedServer]);

  const handleServerChange = (serverId) => {
    setSelectedServer(serverId);
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {serverOptions?.map((server) => (
            <button
              key={server.id}
              onClick={() => handleServerChange(server.id)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-blue-500 hover:text-white transition-colors"
            >
              {server.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg">
        {videoSource && (
          <iframe
            src={videoSource}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allowFullScreen
            title="Anime Video Player"
          ></iframe>
        )}
      </div>
      
      {serverOptions?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2 dark:text-white">Server Options:</h3>
          <div className="flex flex-wrap gap-2">
            {serverOptions.map((server) => (
              <button
                key={server.id}
                onClick={() => handleServerChange(server.id)}
                className={`px-4 py-2 rounded transition-colors ${
                  selectedServer === server.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 hover:text-white dark:text-white'
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