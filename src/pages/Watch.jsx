// src/pages/Watch.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEpisodeData } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import Loader from '../components/Loader';

const Watch = () => {
  const { episodeId } = useParams();
  const [episodeData, setEpisodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEpisodeData(episodeId);
        setEpisodeData(data);
      } catch (err) {
        setError('Failed to load episode data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (episodeId) {
      fetchEpisodeData();
      // Scroll to top when episode changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [episodeId]);

  if (loading) {
    return <Loader />;
  }

  if (error || !episodeData) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-red-500 text-lg">{error || 'Episode not found'}</p>
        <Link 
          to="/" 
          className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const { 
    title, 
    animeTitle, 
    animeId, 
    episodeNumber, 
    servers, 
    nextEpisodeId, 
    prevEpisodeId 
  } = episodeData;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <Link 
          to={`/anime/${animeId}`}
          className="text-blue-500 hover:underline"
        >
          &larr; Back to {animeTitle}
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-4 dark:text-white">
        {animeTitle} - Episode {episodeNumber}
        {title && ` - ${title}`}
      </h1>
      
      <div className="mb-6">
        <VideoPlayer 
          serverId={servers?.[0]?.id}
          serverOptions={servers}
        />
      </div>
      
      <div className="flex justify-between mb-8">
        <div>
          {prevEpisodeId && (
            <Link
              to={`/watch/${prevEpisodeId}`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors dark:text-white"
            >
              &larr; Previous Episode
            </Link>
          )}
        </div>
        <div>
          {nextEpisodeId && (
            <Link
              to={`/watch/${nextEpisodeId}`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors dark:text-white"
            >
              Next Episode &rarr;
            </Link>
          )}
        </div>
      </div>
      
      {/* Comments section placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Comments</h2>
        <p className="text-gray-500 dark:text-gray-400">Comments feature coming soon!</p>
      </div>
    </div>
  );
};

export default Watch;