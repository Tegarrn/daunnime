// src/components/AnimeCard.jsx
import { Link } from 'react-router-dom';

const AnimeCard = ({ anime }) => {
  if (!anime) return null;

  return (
    <Link 
      to={`/anime/${anime.id}`} 
      className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={anime.thumbnail || '/placeholder-anime.jpg'} 
          alt={anime.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {anime.episodeNumber && (
          <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            EP {anime.episodeNumber}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {anime.title}
        </h3>
        {anime.type && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {anime.type}
          </p>
        )}
      </div>
    </Link>
  );
};

export default AnimeCard;