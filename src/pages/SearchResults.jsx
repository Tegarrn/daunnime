// src/pages/SearchResults.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, useSearchParams } from 'react-router-dom'; // useSearchParams ditambahkan
import { searchAnime } from '../services/api';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import { Search, AlertTriangle } from 'lucide-react';
import Pagination from '../components/Pagination'; // Import Pagination
// import {Helmet} from "react-helmet-async"; // Dihapus

function useQueryHook() { // Ganti nama hook agar tidak konflik dengan useQuery dari react-router jika ada
  return new URLSearchParams(useLocation().search);
}

const SearchResults = () => {
  const queryParamsHook = useQueryHook();
  const searchQuery = queryParamsHook.get('q');
  
  const [searchParams, setSearchParams] = useSearchParams(); // Untuk pagination
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam) : 1;


  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1); // Untuk pagination

  const performSearch = useCallback(async (query, page) => { // Tambahkan page untuk pagination
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Diasumsikan searchAnime dari Otakudesu hanya menerima query untuk request awal
      // TODO: Verifikasi apakah API search Otakudesu MENDUKUNG parameter `page`
      // Jika ya, Anda bisa memodifikasi searchAnime di api.js untuk menerimanya
      // atau menambahkannya di sini: `${API_URL}/otakudesu/search?q=${query}&page=${page}`
      // Untuk sekarang, kita asumsikan searchAnime hanya mengambil query dan kita lakukan client-side paging jika perlu,
      // atau jika API nya mendukung pagination, response nya akan menyertakan info totalPages.
      const response = await searchAnime(query); // Kirim page jika API mendukung
      
      let searchData = [];
      let fetchedTotalPages = 1;

      if (response && response.data && Array.isArray(response.data)) {
        searchData = response.data;
        // Jika API tidak memberikan totalPages, hitung manual untuk client-side paging (jika diinginkan)
        // fetchedTotalPages = Math.ceil(searchData.length / JUMLAH_ITEM_PER_HALAMAN);
      } else if (response && Array.isArray(response)) {
        searchData = response;
        // fetchedTotalPages = Math.ceil(searchData.length / JUMLAH_ITEM_PER_HALAMAN);
      } else if (response && response.data && Array.isArray(response.data.results)) {
        searchData = response.data.results;
        fetchedTotalPages = response.data.totalPages || 1;
      } else if (response && response.results && Array.isArray(response.results)) { // Struktur lain yang mungkin
        searchData = response.results;
        fetchedTotalPages = response.pagination?.totalPages || response.totalPages || 1;
      }


      setResults(searchData);
      setTotalPages(fetchedTotalPages);
      if (searchQuery) {
        document.title = `Pencarian: "${searchQuery}" - DaunNime`;
      } else {
        document.title = "Pencarian Anime - DaunNime";
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError(err.message || 'Gagal melakukan pencarian.');
      setResults([]);
      document.title = "Error Pencarian - DaunNime";
    } finally {
      setLoading(false);
    }
  }, []); // searchQuery dihapus dari dependency jika pagination dikontrol oleh currentPage

  useEffect(() => {
    performSearch(searchQuery, currentPage);
  }, [searchQuery, currentPage, performSearch]);

  const handlePageChange = (newPage) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', String(newPage));
    setSearchParams(newSearchParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <Helmet> Dihapus </Helmet> */}
      <div className="flex items-center mb-6">
        <Search size={28} className="mr-3 text-blue-500" />
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
          Hasil Pencarian untuk: <span className="text-blue-600 dark:text-blue-400">{searchQuery || "..."}</span>
        </h1>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader />
        </div>
      )}
      {error && (
        <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
            <AlertTriangle className="mx-auto text-red-500 mb-3" size={32} />
            <p className="text-red-600 dark:text-red-300 text-lg mb-2">Oops, terjadi kesalahan!</p>
            <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>
            <button
                onClick={() => performSearch(searchQuery, currentPage)}
                className="px-5 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
                Coba Lagi
            </button>
        </div>
      )}
      {!loading && !error && results.length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Tidak ada hasil yang ditemukan untuk "<span className="font-medium">{searchQuery}</span>".
          </p>
          <p className="text-md text-gray-500 dark:text-gray-500 mt-2">
            Coba gunakan kata kunci lain atau periksa kembali ejaan Anda.
          </p>
          <Link to="/" className="mt-6 inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Kembali ke Home
          </Link>
        </div>
      )}
      {!loading && !error && results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {results.map((anime) => (
              <AnimeCard
                // Menggunakan struktur AnimeCard dari Home.jsx yang diunggah
                key={anime.id || anime.animeId || Math.random()} // Fallback key
                anime={{ // Membungkus prop anime agar sesuai dengan AnimeCard.jsx Anda
                    id: anime.id || anime.animeId,
                    title: anime.title || anime.name,
                    thumbnail: anime.poster || anime.thumbnail || anime.image, // Menggunakan thumbnail
                    type: anime.type,
                    episodeNumber: anime.episodeNumber || anime.episodes || anime.status, // episodeNumber, atau status sebagai fallback jika ada
                }}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;