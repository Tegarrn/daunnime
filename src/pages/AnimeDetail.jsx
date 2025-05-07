// src/pages/AnimeDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeDetails } from '../services/api';
import Loader from '../components/Loader';

const AnimeDetail = () => {
  const { animeId } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAnimeDetails(animeId);
        setAnime(data);
      } catch (err) {
        setError('Failed to load anime details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (animeId) {
      fetchAnimeDetails();
    }
  }, [animeId]);

  if (loading) {
    return <Loader />;
  }

  if (error || !anime) {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Hero section with poster and details */}
        <div className="relative bg-gray-900 text-white">
          {anime.coverImage && (
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url(${anime.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(10px)'
            }}></div>
          )}
          
          <div className="relative z-10 container mx-auto p-6 md:flex gap-8">
            <div className="flex-shrink-0 mb-6 md:mb-0">
              <img 
                src={anime.poster || anime.thumbnail} 
                alt={anime.title} 
                className="w-48 h-auto rounded-lg shadow-lg mx-auto md:mx-0"
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{anime.title}</h1>
              
              {anime.alternativeTitle && (
                <h2 className="text-lg text-gray-300 mb-4">{anime.alternativeTitle}</h2>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {anime.genres?.map((genre) => (
                  <span key={genre} className="px-2 py-1 bg-blue-600 bg-opacity-50 rounded text-sm">
                    {genre}
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-6">
                {anime.status && (
                  <div>
                    <span className="text-gray-400">Status:</span> {anime.status}
                  </div>
                )}
                {anime.type && (
                  <div>
                    <span className="text-gray-400">Type:</span> {anime.type}
                  </div>
                )}
                {anime.studio && (
                  <div>
                    <span className="text-gray-400">Studio:</span> {anime.studio}
                  </div>
                )}
                {anime.releaseDate && (
                  <div>
                    <span className="text-gray-400">Released:</span> {anime.releaseDate}
                  </div>
                )}
                {anime.episodes && (
                  <div>
                    <span className="text-gray-400">Episodes:</span> {anime.episodes}</div>
                )}
                {anime.duration && (
                  <div>
                    <span className="text-gray-400">Duration:</span> {anime.duration}
                  </div>
                )}
                {anime.rating && (
                  <div>
                    <span className="text-gray-400">Rating:</span> {anime.rating}
                  </div>
                )}
              </div>
              
              {anime.synopsis && (
                <div className="mb-4">
                  <p className="text-gray-200 line-clamp-3 md:line-clamp-none">{anime.synopsis}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Episodes section */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Episodes</h2>
          
          {anime.episodes && anime.episodes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {anime.episodeList?.map((episode) => (
                <Link 
                  key={episode.id} 
                  to={`/watch/${episode.id}`}
                  className="block p-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-center"
                >
                  <span className="font-medium text-gray-900 dark:text-white">EP {episode.number}</span>
                  {episode.title && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">{episode.title}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No episodes available yet.</p>
          )}
          
          {/* Batch download section */}
          {anime.batchId && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Batch Download</h2>
              <Link 
                to={`/batch/${anime.batchId}`}
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Download All Episodes
              </Link>
            </div>
          )}
          
          {/* Related anime */}
          {anime.relatedAnime && anime.relatedAnime.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Related Anime</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {anime.relatedAnime.map((relatedAnime) => (
                  <AnimeCard key={relatedAnime.id} anime={relatedAnime} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimeDetail;