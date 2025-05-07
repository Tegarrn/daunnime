// src/pages/AnimeDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeDetails } from '../services/api';
import Loader from '../components/Loader';

const AnimeDetail = () => {
  const { animeId } = useParams();
  const [animeData, setAnimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getAnimeDetails(animeId);
        console.log('Raw anime details:', data);
        
        // Process the API response based on actual structure
        if (data && data.data) {
          // Normalize the data structure
          const processedData = {
            title: data.data.title || 'Unknown Anime',
            synopsis: data.data.synopsis || data.data.description || 'No synopsis available.',
            thumbnail: data.data.thumbnail || data.data.image || data.data.poster || '/placeholder-anime.jpg',
            rating: data.data.rating || data.data.score || 'N/A',
            type: data.data.type || 'TV',
            status: data.data.status || 'Unknown',
            genres: data.data.genres || [],
            episodes: []
          };
          
          // Extract episodes from different possible structures
          if (data.data.episodes && Array.isArray(data.data.episodes)) {
            processedData.episodes = data.data.episodes.map(ep => ({
              id: ep.id || ep.episodeId || `ep-${Math.random()}`,
              number: ep.number || ep.episodeNumber || '??',
              title: ep.title || `Episode ${ep.number || '??'}`,
              thumbnail: ep.thumbnail || ep.image || processedData.thumbnail
            }));
          } else if (data.data.episodeList && Array.isArray(data.data.episodeList)) {
            processedData.episodes = data.data.episodeList.map(ep => ({
              id: ep.id || ep.episodeId || `ep-${Math.random()}`,
              number: ep.number || ep.episodeNumber || '??',
              title: ep.title || `Episode ${ep.number || '??'}`,
              thumbnail: ep.thumbnail || ep.image || processedData.thumbnail
            }));
          }
          
          setAnimeData(processedData);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        console.error('Error fetching anime details:', err);
        setError('Failed to load anime details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (animeId) {
      fetchAnimeDetails();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [animeId]);

  if (loading) {
    return <Loader />;
  }

  if (error || !animeData) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-red-500 text-lg">{error || 'Anime not found'}</p>
        <Link 
          to="/" 
          className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <Link to="/" className="text-blue-500 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
      
      {/* Anime Details */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <img 
            src={animeData.thumbnail} 
            alt={animeData.title}
            className="w-full h-auto rounded-lg shadow-md"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-anime.jpg';
            }}
          />
          
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600 dark:text-gray-400">Type:</div>
              <div className="text-right font-medium dark:text-white">{animeData.type}</div>
              
              <div className="text-gray-600 dark:text-gray-400">Status:</div>
              <div className="text-right font-medium dark:text-white">{animeData.status}</div>
              
              <div className="text-gray-600 dark:text-gray-400">Rating:</div>
              <div className="text-right font-medium dark:text-white">
                {/* Make sure rating is a string or number, not an object */}
                {typeof animeData.rating === 'object' 
                  ? JSON.stringify(animeData.rating) 
                  : animeData.rating}
              </div>
            </div>
            
            {animeData.genres && animeData.genres.length > 0 && (
              <div className="mt-4">
                <div className="text-gray-600 dark:text-gray-400 mb-2">Genres:</div>
                <div className="flex flex-wrap gap-2">
                  {animeData.genres.map((genre, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                    >
                      {/* Handle genre object or string appropriately */}
                      {typeof genre === 'string' 
                        ? genre 
                        : (genre.name || (typeof genre === 'object' ? JSON.stringify(genre) : 'Unknown'))}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-2/3 lg:w-3/4">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 dark:text-white">
            {/* Ensure title is a string */}
            {typeof animeData.title === 'object' ? JSON.stringify(animeData.title) : animeData.title}
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2 dark:text-white">Synopsis</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {/* Ensure synopsis is a string */}
              {typeof animeData.synopsis === 'object' ? JSON.stringify(animeData.synopsis) : animeData.synopsis}
            </p>
          </div>
          
          {/* Episodes List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Episodes</h2>
            
            {animeData.episodes && animeData.episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {animeData.episodes.map((episode) => (
                  <Link 
                    key={episode.id}
                    to={`/watch/${episode.id}`}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden mr-3">
                      <img 
                        src={episode.thumbnail} 
                        alt={`Episode ${episode.number}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-episode.jpg';
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-blue-500 font-medium">
                        Episode {typeof episode.number === 'object' ? JSON.stringify(episode.number) : episode.number}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {typeof episode.title === 'object' ? JSON.stringify(episode.title) : episode.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No episodes available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeDetail;