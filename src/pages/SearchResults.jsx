// src/pages/SearchResults.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAnime } from '../services/api';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await searchAnime(query, currentPage);
        
        // Debug output to console to see API response structure
        console.log('Search API response:', data);
        
        // Check the exact structure of the response and adapt accordingly
        // The API likely returns a different structure than what was expected
        if (data && data.data) {
          // If data is in a nested 'data' property
          setResults(data.data.animeList || data.data || []);
          setTotalPages(data.data.pagination?.totalPages || data.pagination?.totalPages || 1);
        } else {
          // Direct structure
          setResults(data.animeList || data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search anime. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentPage]);

  const handlePageChange = (page) => {
    // Create a new URLSearchParams object
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('q', query);
    newSearchParams.set('page', page);
    
    // Use the browser's history API to update the URL
    window.location.search = newSearchParams.toString();
  };

  // Debug output for what we're rendering
  console.log('Rendering search results:', { query, currentPage, resultsCount: results.length, results });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        Search Results for: "{query}"
      </h1>

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
      ) : results.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
          <Link 
            to="/" 
            className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.isArray(results) ? (
              results.map((anime, index) => (
                <AnimeCard key={anime.id || `anime-${index}`} anime={anime} />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-red-500">Invalid response format. Please try again.</p>
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;