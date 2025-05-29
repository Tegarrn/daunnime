// src/pages/AnimeDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeDetails } from '../services/api';
import Loader from '../components/Loader';
import BatchDownloadSection from '../components/BatchDownloadSection';
import { PlayCircle, List, Tag, Calendar, Tv, Users, Star, Download, AlertTriangle, Film, Clock, Info, FileText, RadioTower, Building } from 'lucide-react';

const AnimeDetail = () => {
  const { animeId } = useParams();
  const [animeData, setAnimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  const fetchAnimeData = useCallback(async () => {
    if (!animeId) {
        setError("Anime ID tidak valid.");
        setLoading(false);
        return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('AnimeDetail: Fetching data for animeId:', animeId);
    
    try {
      // getAnimeDetails now returns the core data object directly
      const dataToSet = await getAnimeDetails(animeId);

      console.log("AnimeDetail: Processed animeData from API service:", dataToSet); 

      if (dataToSet && dataToSet.episode_list && !dataToSet.episodes) {
        dataToSet.episodes = dataToSet.episode_list;
      }
      // Ensure episodes is an array
      if (dataToSet && !Array.isArray(dataToSet.episodes)) {
        console.warn("AnimeDetail: episodes data is not an array or undefined, defaulting to empty array.", dataToSet.episodes);
        dataToSet.episodes = [];
      } else if (dataToSet && !dataToSet.episodes) {
         dataToSet.episodes = [];
      }
      
      setAnimeData(dataToSet);
      
      if (dataToSet && dataToSet.title) {
        document.title = `${dataToSet.title} - DaunNime`;
      } else {
        document.title = "Detail Anime - DaunNime";
      }
    } catch (err) {
      console.error("AnimeDetail: Failed to fetch anime details:", err);
      
      let errorMessage = 'Gagal memuat detail anime.';
      
      if (err.message.includes('403')) {
        errorMessage = `Akses ditolak untuk anime "${animeId}". API mungkin memblokir request atau ID anime tidak valid.`;
      } else if (err.message.includes('404')) {
        errorMessage = `Anime dengan ID "${animeId}" tidak ditemukan.`;
      } else if (err.message.includes('500')) {
        errorMessage = 'Server mengalami masalah. Silakan coba lagi nanti.';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
        errorMessage = 'Masalah koneksi internet. Periksa koneksi Anda.';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      document.title = "Error Detail Anime - DaunNime";
    } finally {
      setLoading(false);
    }
  }, [animeId]);

  useEffect(() => {
    fetchAnimeData();
  }, [fetchAnimeData]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader /></div>;
  }

  if (error) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-red-500 text-xl mb-3">Gagal memuat detail anime</p>
            <p className="text-gray-600 dark:text-gray-400 mb-2"><strong>ID:</strong> {animeId}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={fetchAnimeData}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Coba Lagi
              </button>
              <Link
                to="/"
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors inline-block"
              >
                Kembali ke Home
              </Link>
            </div>
        </div>
    );
  }

  if (!animeData) {
    // This might happen if API returns null/undefined after unwrapping
    return <div className="container mx-auto px-4 py-8 text-center text-gray-500">Tidak ada data anime yang ditemukan atau format respons tidak valid.</div>;
  }

  const {
    poster,
    title,
    alternativeTitle, 
    japaneseTitle, 
    englishTitle, 
    synonyms, 
    synopsis,
    genres = [],
    status,
    type,
    totalEpisodes,
    score,
    studio,
    releaseDate, 
    source, 
    duration, 
    season, 
    producers, 
    episodes = [], // ensure episodes is initialized
  } = animeData;

  let fullSynopsisText = '';
  if (synopsis && typeof synopsis === 'object' && Array.isArray(synopsis.paragraphs) && synopsis.paragraphs.length > 0) {
    fullSynopsisText = synopsis.paragraphs.join('\n\n');
  } else if (typeof synopsis === 'string' && synopsis) { 
    fullSynopsisText = synopsis;
  }

  const synopsisToShow = showFullSynopsis || !fullSynopsisText || fullSynopsisText.length <= 250
    ? fullSynopsisText
    : `${fullSynopsisText.substring(0, 250)}...`;

  const DetailItem = ({ icon: Icon, label, value, isHtml = false, lineClamp = true }) => {
    if (value === null || typeof value === 'undefined' || value === '') return null;
    return (
      <div className="flex text-sm py-1">
        <div className="w-2/5 sm:w-1/3 font-semibold text-gray-600 dark:text-gray-400 flex items-center shrink-0">
          {Icon && <Icon size={14} className="mr-2 opacity-80" />}
          {label}
        </div>
        {isHtml ? (
          <div className={`w-3/5 sm:w-2/3 text-gray-800 dark:text-gray-200 ${lineClamp ? 'line-clamp-2' : ''}`} dangerouslySetInnerHTML={{ __html: `: ${value}` }} />
        ) : (
          <div className={`w-3/5 sm:w-2/3 text-gray-800 dark:text-gray-200 ${lineClamp ? 'line-clamp-2' : ''}`}>: {value}</div>
        )}
      </div>
    );
  };


  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
        <div className="p-6 sm:p-8 md:flex">
            <div className="md:flex-shrink-0 md:w-72 text-center md:text-left mb-4 md:mb-0">
                <img
                className="h-auto w-full max-w-xs mx-auto md:mx-0 md:w-full object-cover rounded-lg shadow-md"
                src={poster || '/placeholder-anime.jpg'}
                alt={`Poster ${title}`}
                onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-anime.jpg'; }}
                />
            </div>
            <div className="md:pl-8 flex-grow">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {title || 'Judul Tidak Tersedia'}
                </h1>
                {(englishTitle || alternativeTitle) && <p className="text-md text-gray-600 dark:text-gray-400 mb-3">{englishTitle || alternativeTitle}</p>}

                <div className="flex items-center space-x-4 mb-4">
                    {score && (
                        <div className="flex items-center text-yellow-500">
                            <Star size={20} className="mr-1" />
                            <span className="font-semibold text-lg">
                                {typeof score === 'object' ? (score.value || score.score || 'N/A') : (typeof score === 'number' ? score.toFixed(1) : score)}
                                {typeof score === 'object' && score.users && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({score.users} users)</span>}
                            </span>
                        </div>
                    )}
                    {type && <span className="px-3 py-1 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 text-xs font-semibold rounded-full">{type}</span>}
                    {status && <span className="px-3 py-1 bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-200 text-xs font-semibold rounded-full">{status}</span>}
                </div>
                
                <div className="flex flex-wrap gap-3 mb-6">
                    {episodes && episodes.length > 0 && (episodes[0]?.id || episodes[0]?.episodeId) && (
                    <Link
                        to={`/watch/${episodes[0].id || episodes[0].episodeId}`}
                        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        <PlayCircle size={18} className="mr-2" /> Nonton Episode Pertama
                    </Link>
                    )}
                    <Link
                        to={`/batch/${animeId}`}
                        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        <Download size={18} className="mr-2" /> Download Batch
                    </Link>
                </div>

                {fullSynopsisText ? (
                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                        <FileText size={20} className="mr-2 opacity-80" /> Sinopsis
                    </h2>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line prose prose-sm dark:prose-invert max-w-none">
                    {synopsisToShow}
                    </div>
                    {fullSynopsisText.length > 250 && (
                    <button
                        onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                        className="text-blue-500 hover:underline text-sm mt-1"
                    >
                        {showFullSynopsis ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya'}
                    </button>
                    )}
                </div>
                ) : (
                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                        <FileText size={20} className="mr-2 opacity-80" /> Sinopsis
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    Sinopsis tidak tersedia untuk anime ini.
                    </p>
                </div>
                )}
            </div>
        </div>
        
        <div className="p-6 sm:p-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <Info size={20} className="mr-2 opacity-80" /> Detail Informasi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5"> {/* Reduced gap-y */}
                <div>
                    <DetailItem icon={FileText} label="Judul Jepang" value={japaneseTitle} />
                    <DetailItem icon={FileText} label="Judul Inggris" value={englishTitle || alternativeTitle} />
                    <DetailItem icon={RadioTower} label="Status" value={status} />
                    <DetailItem icon={Film} label="Tipe" value={type} />
                    <DetailItem icon={List} label="Total Episode" value={totalEpisodes} />
                     <DetailItem icon={Building} label="Produser" value={producers} />
                </div>
                <div>
                    <DetailItem icon={FileText} label="Sinonim" value={synonyms} />
                    <DetailItem icon={Tag} label="Sumber" value={source} />
                    <DetailItem icon={Clock} label="Durasi" value={duration} />
                    <DetailItem icon={Users} label="Studio" value={studio && typeof studio === 'object' ? studio.name : studio} />
                    <DetailItem icon={Calendar} label="Musim" value={season} />
                    <DetailItem icon={Calendar} label="Tayang" value={releaseDate} />
                </div>
            </div>
            {genres && genres.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                     <div className="flex text-sm py-1">
                        <div className="w-2/5 sm:w-1/3 font-semibold text-gray-600 dark:text-gray-400 flex items-center shrink-0">
                            <Tag size={14} className="mr-2 opacity-80" />
                            Genre
                        </div>
                        <div className="w-3/5 sm:w-2/3 text-gray-800 dark:text-gray-200 flex flex-wrap gap-2 items-center">
                            <span className="mr-1">:</span>
                            {genres.map((genre, index) => (
                                <Link 
                                    to={`/genre/${typeof genre === 'object' ? genre.id || genre.slug || genre.name : genre}`}
                                    key={index} 
                                    className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                    {typeof genre === 'object' ? genre.name : genre}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>


        {episodes && episodes.length > 0 && (
          <div className="px-2 sm:px-6 py-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Daftar Episode</h2>
            <div className="max-h-96 overflow-y-auto pr-2 rounded-md custom-scrollbar">
              <ul className="space-y-2">
                {episodes.map((ep, index) => (
                  <li key={ep.id || ep.episodeId || index}>
                    <Link
                      to={`/watch/${ep.id || ep.episodeId}`}
                      className="block p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 rounded-md transition-colors duration-150 shadow-sm"
                    >
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {ep.title || ep.name || `Episode ${ep.episode_number || ep.number || (index + 1)}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {(!episodes || episodes.length === 0) && animeData && ( // Ensure animeData is loaded before saying no episodes
            <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">Belum ada episode yang tersedia untuk anime ini.</p>
            </div>
        )}
        <div className="p-6 sm:p-8 border-t border-gray-200 dark:border-gray-700">
            {animeId && <BatchDownloadSection batchId={animeId} />}
        </div>
      </div>
    </div>
  );
};

export default AnimeDetail;