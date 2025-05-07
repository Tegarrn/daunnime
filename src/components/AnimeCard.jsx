// src/components/AnimeCard.jsx
import { Link } from 'react-router-dom';

const AnimeCard = ({ anime }) => {
  if (!anime) return null;

  // More flexible data structure handling
  const id = anime.animeId || anime.id || anime.slug || 
             (anime.href && anime.href.replace(/.*\/([^/]+)\/?$/, '$1')) || 'unknown';
  const title = anime.title || anime.name || 'No Title';
  const thumbnail = anime.image || anime.thumbnail || anime.poster || anime.img || '/placeholder-anime.jpg';
  const episodeNumber = anime.episodeNumber || anime.episode || null;
  const type = anime.type || anime.category || 'TV';

  return (
    <Link 
      to={`/anime/${id}`} 
      className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={thumbnail} 
          alt={title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-anime.jpg';
          }}
        />
        {episodeNumber && (
          <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            EP {episodeNumber}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {title}
        </h3>
        {type && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {type}
          </p>
        )}
      </div>
    </Link>
  );
};

export default AnimeCard;