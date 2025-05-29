// src/pages/BatchDownload.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBatchDownload, getAnimeDetails } from '../services/api';
import Loader from '../components/Loader';
import { Download, AlertTriangle, Copy, Check, List, Tag, Tv, Film, Calendar, Users, ExternalLink, RefreshCw } from 'lucide-react';
// import {Helmet} from "react-helmet-async"; // Dihapus

// Fungsi helper (asumsi masih relevan atau akan disesuaikan nanti berdasarkan API)
const normalizeIndividualDownloadLinks = (linksArray, defaultQuality = 'Default Quality') => {
  if (!Array.isArray(linksArray)) return [];
  return linksArray.map(link => {
    if (typeof link === 'string') {
      let hostName = 'Download';
      try {
        const urlObj = new URL(link);
        hostName = urlObj.hostname.replace(/^www\./, '');
      } catch (e) { /* ignore */ }
      return { url: link, host: hostName, quality: defaultQuality, size: null };
    }
    return {
      url: link.url || link.link || '#',
      host: link.host || link.name || link.provider || 'Download',
      quality: link.quality || link.resolution || defaultQuality,
      size: link.size || null
    };
  }).filter(link => link.url && link.url !== '#');
};

const normalizeFullBatchData = (batchResponse, animeDetailsData, animeTitleFromParams) => {
  if (!batchResponse) return null;

  let rawBatchData = batchResponse.data || batchResponse;
   if (rawBatchData && rawBatchData.data && typeof rawBatchData.data === 'object') {
    rawBatchData = rawBatchData.data;
  }

  if (!rawBatchData || typeof rawBatchData !== 'object') {
    console.warn('normalizeFullBatchData: rawBatchData is not a valid object or is missing', rawBatchData);
    const title = animeDetailsData?.title || animeTitleFromParams || "Anime Batch";
    const poster = animeDetailsData?.poster || animeDetailsData?.thumbnail || animeDetailsData?.image || '/placeholder-anime.jpg';
    return {
      title: title,
      poster: poster,
      downloadLinks: [],
      batchAvailable: false,
      message: rawBatchData?.message || "Data batch tidak valid atau tidak ditemukan.",
      alternativeTitle: animeDetailsData?.alternativeTitle,
      genres: animeDetailsData?.genres,
      type: animeDetailsData?.type,
      episodes: animeDetailsData?.episodes || animeDetailsData?.total_episodes,
      status: animeDetailsData?.status,
      studio: animeDetailsData?.studio,
      synopsis: animeDetailsData?.synopsis,
    };
  }

  const normalizedData = {
    title: rawBatchData.title || animeDetailsData?.title || animeTitleFromParams || "Anime Batch",
    poster: rawBatchData.poster || rawBatchData.thumbnail || rawBatchData.image || animeDetailsData?.poster || animeDetailsData?.thumbnail || animeDetailsData?.image || '/placeholder-anime.jpg',
    downloadLinks: [],
    batchAvailable: false,
    message: rawBatchData.message || null,
    alternativeTitle: rawBatchData.alternativeTitle || animeDetailsData?.alternativeTitle,
    genres: rawBatchData.genres || animeDetailsData?.genres,
    type: rawBatchData.type || animeDetailsData?.type,
    episodes: rawBatchData.episodes || rawBatchData.total_episodes || animeDetailsData?.episodes || animeDetailsData?.total_episodes,
    status: rawBatchData.status || animeDetailsData?.status,
    studio: rawBatchData.studio || animeDetailsData?.studio,
    synopsis: rawBatchData.synopsis || animeDetailsData?.synopsis,
  };

  let extractedLinks = [];
  if (Array.isArray(rawBatchData.downloadLinks) && rawBatchData.downloadLinks.length > 0) {
    extractedLinks = rawBatchData.downloadLinks;
  } else if (Array.isArray(rawBatchData.download_links) && rawBatchData.download_links.length > 0) {
    extractedLinks = rawBatchData.download_links;
  } else if (rawBatchData.downloads) {
    if (Array.isArray(rawBatchData.downloads)) {
      extractedLinks = rawBatchData.downloads;
    } else if (rawBatchData.downloads.links && Array.isArray(rawBatchData.downloads.links)) {
      extractedLinks = rawBatchData.downloads.links;
    } else if (typeof rawBatchData.downloads === 'object') {
      const linksByQuality = [];
      for (const qualityKey in rawBatchData.downloads) {
        const qualityGroup = rawBatchData.downloads[qualityKey];
        if (qualityGroup && (Array.isArray(qualityGroup) || typeof qualityGroup === 'object')) {
           const individualLinks = Array.isArray(qualityGroup) ? qualityGroup : Object.values(qualityGroup).flat();
          linksByQuality.push({
            quality: qualityKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            links: normalizeIndividualDownloadLinks(individualLinks, qualityKey)
          });
        }
      }
      if (linksByQuality.length > 0) {
        normalizedData.downloadLinks = linksByQuality;
        normalizedData.batchAvailable = true;
        return normalizedData;
      }
    }
  } else if (Array.isArray(rawBatchData.links) && rawBatchData.links.length > 0) {
    extractedLinks = rawBatchData.links;
  } else if (rawBatchData.url) {
     extractedLinks = [{ url: rawBatchData.url, host: rawBatchData.host || rawBatchData.name || 'Download' }];
  }

  if (extractedLinks.length > 0 && (!normalizedData.downloadLinks || normalizedData.downloadLinks.length === 0)) {
    const linksByQualityMap = new Map();
    extractedLinks.forEach(linkObj => {
      const quality = linkObj.quality || linkObj.resolution || 'Default Quality';
      if (!linksByQualityMap.has(quality)) {
        linksByQualityMap.set(quality, []);
      }
      linksByQualityMap.get(quality).push(linkObj);
    });

    if (linksByQualityMap.size > 0) {
        normalizedData.downloadLinks = Array.from(linksByQualityMap.entries()).map(([quality, links]) => ({
            quality: quality,
            links: normalizeIndividualDownloadLinks(links, quality)
        }));
    } else {
        normalizedData.downloadLinks = [{
            quality: 'Available Downloads',
            links: normalizeIndividualDownloadLinks(extractedLinks)
        }];
    }
  }

  normalizedData.batchAvailable = normalizedData.downloadLinks.some(group => group.links && group.links.length > 0);
  return normalizedData;
};


const BatchDownloadPage = () => {
  const { animeId } = useParams();
  const [batchInfo, setBatchInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState('');

  const fetchAllData = useCallback(async () => {
    if (!animeId) {
      setError("ID Anime tidak valid.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    let animeDetailsData = null;
    try {
      try {
        const detailsResponse = await getAnimeDetails(animeId);
        if (detailsResponse && detailsResponse.data) {
          animeDetailsData = detailsResponse.data;
        }
      } catch (detailsError) {
        console.warn("Could not fetch supplementary anime details:", detailsError.message);
      }

      const batchResponse = await getBatchDownload(animeId);
      const processedData = normalizeFullBatchData(batchResponse, animeDetailsData, animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      setBatchInfo(processedData);

      // Mengatur judul dokumen secara manual
      if (processedData && processedData.title) {
        document.title = `Batch Download ${processedData.title} - DaunNime`;
      } else {
        document.title = "Batch Download - DaunNime";
      }

      if (!processedData || !processedData.batchAvailable) {
         console.warn(processedData?.message || `Batch download links not found for ${animeId}`);
      }

    } catch (err) {
      console.error(`Error fetching batch download page data for ${animeId}:`, err);
      setError(err.message || "Gagal memuat halaman batch download.");
      setBatchInfo(null);
      document.title = "Error Batch Download - DaunNime";
    } finally {
      setIsLoading(false);
    }
  }, [animeId]);


  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);


  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(''), 2000);
    }).catch(err => {
      console.error('Gagal menyalin link:', err);
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
        <Loader />
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">Memuat Informasi Batch Download...</p>
      </div>
    );
  }

  if (error && (!batchInfo || !batchInfo.batchAvailable)) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        {/* <Helmet> Dihapus </Helmet> */}
        <div className="my-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-lg text-center">
          <AlertTriangle className="text-red-500 dark:text-red-400 mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-bold text-red-700 dark:text-red-300 mb-3">Terjadi Kesalahan</h1>
          <p className="text-red-600 dark:text-red-300 mb-6 text-lg">{error}</p>
          <div className="space-x-0 space-y-3 sm:space-x-4 sm:space-y-0"> {/* Penyesuaian untuk mobile */}
            <button
              onClick={fetchAllData}
              className="w-full sm:w-auto px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center mx-auto mb-2 sm:mb-0 sm:inline-flex transition-colors"
            >
              <RefreshCw size={18} className="mr-2" />
              Coba Lagi
            </button>
            <Link to="/" className="w-full sm:w-auto block sm:inline-block px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-md items-center justify-center transition-colors">
              Kembali ke Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!batchInfo || !batchInfo.batchAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
         {/* <Helmet> Dihapus </Helmet> */}
        <div className="my-8 p-6 bg-yellow-50 dark:bg-gray-800 border border-yellow-300 dark:border-gray-700 rounded-lg shadow-lg text-center">
          <AlertTriangle className="text-yellow-500 dark:text-yellow-400 mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mb-3">Batch Belum Tersedia</h1>
          <p className="text-yellow-600 dark:text-yellow-300 mb-6 text-lg">
            {batchInfo?.message || "Maaf, link batch download untuk anime ini sepertinya belum tersedia."}
          </p>
          <Link to={`/anime/${animeId}`} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md inline-flex items-center justify-center transition-colors">
            Kembali ke Detail Anime
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
       {/* <Helmet> Dihapus </Helmet> */}
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <img
              className="h-auto w-full object-cover md:w-64 md:h-96"
              src={batchInfo.poster || '/placeholder-anime.jpg'}
              alt={`Poster ${batchInfo.title}`}
              onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-anime.jpg'; }}
            />
          </div>
          <div className="p-6 sm:p-8 flex-grow">
            <Link to={`/anime/${animeId}`} className="block text-sm text-blue-500 dark:text-blue-400 hover:underline mb-2">
                &laquo; Kembali ke Detail Anime
            </Link>
            <h1 className="block mt-1 text-3xl sm:text-4xl leading-tight font-bold text-black dark:text-white mb-1">
              {batchInfo.title}
            </h1>
            {batchInfo.alternativeTitle && (
              <p className="text-gray-600 dark:text-gray-400 text-md mb-4">
                {batchInfo.alternativeTitle}
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700 dark:text-gray-300">
              {batchInfo.type && <p className="flex items-center"><Film size={16} className="mr-2 text-indigo-500" /><strong>Tipe:</strong>&nbsp; {batchInfo.type}</p>}
              {batchInfo.status && <p className="flex items-center"><Tv size={16} className="mr-2 text-green-500" /><strong>Status:</strong>&nbsp; {batchInfo.status}</p>}
              {batchInfo.episodes && <p className="flex items-center"><List size={16} className="mr-2 text-purple-500" /><strong>Total Episode:</strong>&nbsp; {batchInfo.episodes}</p>}
              {batchInfo.studio && <p className="flex items-center"><Users size={16} className="mr-2 text-orange-500" /><strong>Studio:</strong>&nbsp; {batchInfo.studio}</p>}
              {batchInfo.releaseDate && <p className="flex items-center"><Calendar size={16} className="mr-2 text-red-500" /><strong>Rilis:</strong>&nbsp; {batchInfo.releaseDate}</p>}
            </div>

            {batchInfo.genres && batchInfo.genres.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center">
                    <Tag size={16} className="mr-2 text-teal-500"/> Genre:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {batchInfo.genres.map((genre, index) => (
                    <span key={index} className="px-2.5 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full">
                      {typeof genre === 'object' ? genre.name : genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

             {batchInfo.synopsis && (
                <div className="mt-6 prose prose-sm dark:prose-invert max-w-none">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-1">Sinopsis:</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {batchInfo.synopsis.length > 250 ? batchInfo.synopsis.substring(0, 250) + '...' : batchInfo.synopsis}
                        {batchInfo.synopsis.length > 250 && (
                             <Link to={`/anime/${animeId}`} className="text-blue-500 dark:text-blue-400 hover:underline ml-1">
                                Baca Selengkapnya
                            </Link>
                        )}
                    </p>
                </div>
            )}
          </div>
        </div>

        <div className="px-2 sm:px-6 py-6 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
            <Download size={26} className="mr-3 text-blue-500" />
            Pilihan Link Download Batch
          </h2>
          {batchInfo.downloadLinks.map((group, index) => (
            <div key={index} className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/30 shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-600 pb-3">
                {group.quality || 'Unduhan Tersedia'}
              </h3>
              {group.links && group.links.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.links.map((link, linkIndex) => (
                    <div
                      key={linkIndex}
                      className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 break-all flex items-center"
                          title={`Download dari ${link.host} - ${link.url}`}
                        >
                          <ExternalLink size={16} className="mr-2 flex-shrink-0"/>
                          {link.host || 'Unduh'}
                        </a>
                        {link.size && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Ukuran: {link.size}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopyLink(link.url)}
                        className={`mt-2 w-full text-xs py-1.5 px-2 rounded-md flex items-center justify-center transition-colors ${
                          copiedLink === link.url
                            ? 'bg-green-500 text-white focus:ring-green-400'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        title={copiedLink === link.url ? "Link Disalin!" : "Salin Link"}
                      >
                        {copiedLink === link.url ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                        {copiedLink === link.url ? "Disalin!" : "Salin"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                 <p className="text-sm text-gray-500 dark:text-gray-400 col-span-full">Tidak ada link yang tersedia untuk kualitas ini.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BatchDownloadPage;