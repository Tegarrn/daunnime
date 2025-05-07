// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getHomeData,
  getRecentAnime,
  getPopularAnime,
  searchAnime
} from '../services/api';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';

const Home = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animeList, setAnimeList] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        let rawData = {};
        let flatList = [];

        if (searchQuery) {
          rawData = await searchAnime(searchQuery, currentPage);
          setActiveTab('search');
        } else if (activeTab === 'recent') {
          rawData = await getRecentAnime(currentPage);
        } else if (activeTab === 'popular') {
          rawData = await getPopularAnime(currentPage);
        } else {
          rawData = await getHomeData();
        }

        console.log('Raw Data:', rawData);
        
        // Extract data based on API response structure
        if (rawData && rawData.data) {
          if (Array.isArray(rawData.data)) {
            // If data is directly an array
            flatList = rawData.data;
          } else if (rawData.data.list && Array.isArray(rawData.data.list)) {
            // If data has a list property that's an array (for home page)
            flatList = rawData.data.list.flatMap(group => 
              Array.isArray(group.animeList) ? group.animeList : []
            );
          } else if (rawData.data.animeList && Array.isArray(rawData.data.animeList)) {
            // If data has an animeList property that's an array
            flatList = rawData.data.animeList;
          } else if (Object.keys(rawData.data).length > 0) {
            // If data is an object with potential anime items
            // Look for any array in the data object
            for (const key in rawData.data) {
              if (Array.isArray(rawData.data[key])) {
                flatList = rawData.data[key];
                if (flatList.length > 0) break;
              }
            }
            
            // If still no arrays found, try to treat the data object itself as a single item
            if (flatList.length === 0 && rawData.data.title) {
              flatList = [rawData.data];
            }
          }
        }

        console.log('Extracted flatList:', flatList);

        // Normalize the anime data
        const normalizedList = flatList.map(item => {
          // For debugging
          if (!item) {
            console.warn('Null or undefined item found in flatList');
            return null;
          }
          
          return {
            id: item.animeId || item.id || item.slug || item.href || 
                 (item.link ? item.link.replace(/.*\/([^/]+)\/?$/, '$1') : Math.random().toString()),
            title: item.title || item.name || 'No Title',
            thumbnail: item.image || item.thumbnail || item.poster || item.img || '/placeholder-anime.jpg',
            episodeNumber: item.episodeNumber || item.episode || null,
            type: item.type || item.category || 'TV'
          };
        }).filter(Boolean); // Remove any null items

        setAnimeList(normalizedList);
        setTotalPages(rawData?.pagination?.totalPages || 
                     rawData?.data?.pagination?.totalPages || 
                     Math.ceil(normalizedList.length / 20) || 1);
        console.log('Normalized animeList:', normalizedList);
      } catch (err) {
        console.error('Error details:', err);
        setError('Failed to fetch anime data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, currentPage, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handlePageChange = (page) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page);
    window.history.pushState({}, '', `?${newSearchParams.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {searchQuery ? (
        <h1 className="text-2xl font-bold mb-6 dark:text-white">
          Search Results for: "{searchQuery}"
        </h1>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6 dark:text-white">Explore Anime</h1>
          <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleTabChange('recent')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'recent'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Recent Episodes
            </button>
            <button
              onClick={() => handleTabChange('popular')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'popular'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Popular Anime
            </button>
          </div>
        </>
      )}

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      ) : animeList.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No results found. Try a different search term.'
              : 'No anime found.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {animeList.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default Home;