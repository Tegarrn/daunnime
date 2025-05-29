// src/components/AnimeCard.jsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Star, Clock } from 'lucide-react';

const AnimeCard = ({ anime, isEpisode = false }) => {
  if (!anime) return null;

  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // PERBAIKAN: Lebih hati-hati dalam mengekstrak ID
  let id;
  if (anime.animeId) {
    id = anime.animeId;
  } else if (anime.id) {
    id = anime.id;
  } else if (anime.slug) {
    id = anime.slug;
  } else if (anime.href) {
    // Perbaiki regex untuk ekstraksi ID dari href
    // Contoh href: "/anime/kanpekiseijo-sub-indo/" atau "https://domain.com/anime/kanpekiseijo-sub-indo/"
    const match = anime.href.match(/\/anime\/([^\/]+)\/?$/);
    id = match ? match[1] : anime.href.replace(/.*\/([^/]+)\/?$/, '$1');
  } else {
    id = 'unknown';
  }
  
  // Debug log untuk melihat ID yang diekstrak
  console.log('AnimeCard ID extraction:', {
    original: anime,
    extractedId: id,
    href: anime.href
  });

  const episodeId = anime.episodeId || null;
  const title = anime.title || anime.name || 'No Title';
  const thumbnail = anime.image || anime.thumbnail || anime.poster || anime.img || '/placeholder-anime.jpg';
  const episodeNumber = anime.episodeNumber || anime.episode || null;
  const type = anime.type || anime.category || 'TV';
  const rating = anime.rating || Math.floor(Math.random() * 2) + 8;

  // Determine correct link based on the card type
  const linkTo = isEpisode && episodeId 
    ? `/watch/${episodeId}` 
    : `/anime/${id}`;

  // Handle spotlight effect
  useEffect(() => {
    if (!cardRef.current || !isHovered) return;
    
    const handleMouseMove = (e) => {
      const rect = cardRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      cardRef.current.style.setProperty('--x', `${x}%`);
      cardRef.current.style.setProperty('--y', `${y}%`);
      
      setMousePosition({ x, y });
    };
    
    cardRef.current.addEventListener('mousemove', handleMouseMove);
    return () => {
      if (cardRef.current) {
        cardRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isHovered]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="spotlight relative rounded-xl overflow-hidden shadow-lg group bg-white dark:bg-gray-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
    >
      <Link to={linkTo}>
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* Image with loading skeleton */}
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 shimmer"></div>
          <motion.img 
            src={thumbnail} 
            alt={title} 
            className="w-full h-full object-cover z-10 relative"
            initial={{ scale: 1.05, filter: "blur(5px)" }}
            animate={{ 
              scale: isHovered ? 1.1 : 1,
              filter: "blur(0px)" 
            }}
            transition={{ duration: 0.4 }}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-anime.jpg';
            }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Play button overlay on hover */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center z-30 opacity-0 group-hover:opacity-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={24} fill="white" />
            </motion.div>
          </motion.div>

          {/* Episode indicator */}
          {episodeNumber && (
            <div className="absolute top-2 right-2 glass z-20 px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Clock size={12} className="mr-1 text-blue-500" />
              <span>EP {episodeNumber}</span>
            </div>
          )}

          {/* Rating badge */}
          <div className="absolute bottom-2 left-2 glass z-20 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Star size={12} className="mr-1 text-yellow-500" fill="rgb(234, 179, 8)" />
            <span>{rating.toFixed(1)}</span>
          </div>
          
          {/* Type badge */}
          <div className="absolute bottom-2 right-2 glass z-20 px-2 py-1 rounded-full text-xs font-medium">
            {type}
          </div>
        </div>

        <div className="p-3 relative z-10">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {title}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
};

export default AnimeCard;