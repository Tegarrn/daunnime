// src/pages/Watch.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEpisodeDetails, getStreamingServerLink, getAnimeDetails } from '../services/api';
import Loader from '../components/Loader';
import VideoPlayer from '../components/VideoPlayer';
import { AlertTriangle, ChevronLeft, ChevronRight, List, Download, PlayCircle } from 'lucide-react';

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const [episodeData, setEpisodeData] = useState(null);
  const [animeDetails, setAnimeDetails] = useState(null);
  const [currentServer, setCurrentServer] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingServer, setLoadingServer] = useState(false);

  const fetchEpisodeAndAnimeData = useCallback(async () => {
    if (!episodeId) {
        setError("ID Episode tidak valid.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      // getEpisodeDetails now returns core data object
      const epData = await getEpisodeDetails(episodeId);
      setEpisodeData(epData);

      const parentAnimeId = epData?.anime?.id || epData?.anime_id || epData?.animeId;
      if (parentAnimeId) {
        try {
            // getAnimeDetails now returns core data object
            const animeParentData = await getAnimeDetails(parentAnimeId);
            setAnimeDetails(animeParentData);
            if (epData && epData.title && animeParentData && animeParentData.title) {
                document.title = `Nonton ${epData.title} - ${animeParentData.title} - DaunNime`;
            } else if (epData && epData.title) {
                document.title = `Nonton ${epData.title} - DaunNime`;
            } else {
                document.title = "Nonton Anime - DaunNime";
            }
        } catch (animeErr) {
            console.warn("Could not fetch parent anime details for episode list:", animeErr);
            if (epData && epData.title) {
                document.title = `Nonton ${epData.title} - DaunNime`;
            }
        }
      } else if (epData && epData.title) {
        document.title = `Nonton ${epData.title} - DaunNime`;
      }


      if (epData && epData.servers && epData.servers.length > 0) {
        const preferredServer = epData.servers.find(s => s.type === 'direct_link' || (s.name && s.name.toLowerCase().includes('direct'))) || epData.servers[0];
        handleServerChange(preferredServer);
      } else if (epData && epData.videoUrl) {
        setVideoUrl(epData.videoUrl);
        setCurrentServer({name: "Default Source", url: epData.videoUrl});
      } else {
        console.warn("No servers found for this episode.");
      }

    } catch (err) {
      console.error("Failed to fetch episode data:", err);
      setError(err.message || 'Gagal memuat data episode.');
      document.title = "Error Nonton Anime - DaunNime";
    } finally {
      setLoading(false);
    }
  }, [episodeId]); 

   const handleServerChange = useCallback(async (server) => { 
    if (!server) return;
    setCurrentServer(server);
    setLoadingServer(true);
    setVideoUrl(''); 
    setError(null); 

    try {
      let serverIdentifier = server.id || server.stream_id || server.value; 
      
      if (server.url && (server.type === 'embed' || !serverIdentifier) ) { 
        setVideoUrl(server.url);
      } else if (serverIdentifier) {
         const streamResponse = await getStreamingServerLink(serverIdentifier);
         // getStreamingServerLink might return { url: ... } or { data: { url: ... } }
         // The service/api.js now tries to return the inner data if response.data.url exists.
        const actualUrl = streamResponse?.url || streamResponse?.link; // Adjusted to check root first after api.js change
        if (!actualUrl) throw new Error ("URL streaming tidak ditemukan dari server.");
        setVideoUrl(actualUrl);
      } else {
        throw new Error("Server identifier tidak ditemukan untuk mengambil link streaming.");
      }
    } catch (err) {
      console.error(`Failed to fetch streaming link for server ${server.name}:`, err);
      setError(`Gagal memuat video dari server ${server.name}. ${err.message}`);
      setVideoUrl('');
    } finally {
        setLoadingServer(false);
    }
  }, []); 

  useEffect(() => {
    fetchEpisodeAndAnimeData();
  }, [fetchEpisodeAndAnimeData]);


  const episodeTitleForDisplay = episodeData?.title || `Episode ${episodeId.split('-').pop()}`;


  if (loading && !episodeData) { 
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader /></div>;
  }

  if (error && !episodeData) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-red-500 text-xl mb-3">Gagal Memuat Episode</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
            onClick={fetchEpisodeAndAnimeData}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
            Coba Lagi
            </button>
        </div>
    );
  }
  
  const serverFetchError = error && episodeData; 


  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {animeDetails?.title ? `${animeDetails.title} - ` : ''}{episodeTitleForDisplay}
          </h1>
          {animeDetails?.id && (
             <Link to={`/anime/${animeDetails.id}`} className="text-sm text-blue-500 dark:text-blue-400 hover:underline">
                Kembali ke Detail Anime
            </Link>
          )}
        </div>

        <div className="aspect-video bg-black">
          {loadingServer && <div className="w-full h-full flex justify-center items-center"><Loader /> <p className="ml-2 text-white">Memuat server...</p></div>}
          {!loadingServer && videoUrl && 
            <VideoPlayer 
                src={videoUrl} 
                poster={animeDetails?.poster || episodeData?.thumbnail} 
            />
          }
          {!loadingServer && !videoUrl && !serverFetchError && (
            <div className="w-full h-full flex flex-col justify-center items-center text-gray-400 p-4">
                <PlayCircle size={64} className="mb-4 opacity-50" />
                <p>Pilih server di bawah untuk memulai streaming.</p>
                {(!episodeData || !episodeData.servers || episodeData.servers.length === 0) && !episodeData?.videoUrl &&
                    <p className="mt-2 text-yellow-500">Tidak ada server streaming yang tersedia untuk episode ini.</p>
                }
            </div>
          )}
           {!loadingServer && !videoUrl && serverFetchError && (
             <div className="w-full h-full flex flex-col justify-center items-center text-red-400 p-4">
                <AlertTriangle size={64} className="mb-4 opacity-80" />
                <p className="font-semibold">Gagal memuat video dari server ini.</p>
                <p className="text-sm">{error}</p> 
                <p className="text-sm mt-2">Silakan coba server lain.</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
            {episodeData && episodeData.servers && episodeData.servers.length > 0 && (
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Pilih Server:</h2>
                <div className="flex flex-wrap gap-2">
                {episodeData.servers.map((server, index) => (
                    <button
                    key={server.id || server.name || index} 
                    onClick={() => handleServerChange(server)} 
                    disabled={loadingServer}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                                ${currentServer && (currentServer.id === server.id || currentServer.name === server.name) 
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}
                                ${loadingServer ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                    {server.name || `Server ${index + 1}`}
                    {server.quality && <span className="ml-1 text-xs opacity-80">({server.quality})</span>}
                    </button>
                ))}
                </div>
            </div>
            )}
            {episodeData && (!episodeData.servers || episodeData.servers.length === 0) && !episodeData.videoUrl && !loading &&
                 <p className="text-yellow-500 dark:text-yellow-400 text-sm mb-4">Tidak ada pilihan server yang tersedia untuk episode ini.</p>
            }

          <div className="flex justify-between items-center mb-4">
            {episodeData?.prev_episode_id || episodeData?.prevEp ? (
              <Link
                to={`/watch/${episodeData.prev_episode_id || episodeData.prevEp.id || episodeData.prevEp.episodeId}`}
                className="inline-flex items-center px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
              >
                <ChevronLeft size={18} className="mr-1" /> Episode Sebelumnya
              </Link>
            ) : <div className="w-1/3" />}
            {animeDetails?.id && (
                <Link to={`/anime/${animeDetails.id}#episode-list`} className="px-4 py-2 text-sm bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-colors flex items-center">
                    <List size={16} className="mr-2"/> Daftar Episode
                </Link>
            )}
            {episodeData?.next_episode_id || episodeData?.nextEp ? (
              <Link
                to={`/watch/${episodeData.next_episode_id || episodeData.nextEp.id || episodeData.nextEp.episodeId}`}
                className="inline-flex items-center px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
              >
                Episode Berikutnya <ChevronRight size={18} className="ml-1" />
              </Link>
            ) : <div className="w-1/3"/>}
          </div>
          
          {episodeData?.download_links && episodeData.download_links.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Opsi Unduhan Episode:</h3>
                <div className="flex flex-wrap gap-2">
                    {episodeData.download_links.map((dlink, i) => (
                        <a 
                            href={dlink.url} 
                            key={i} target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 text-xs bg-green-100 dark:bg-green-700 hover:bg-green-200 dark:hover:bg-green-600 text-green-700 dark:text-green-100 rounded-md"
                        >
                            <Download size={14} className="mr-1.5"/> {dlink.quality || dlink.host || `Link ${i+1}`}
                        </a>
                    ))}
                </div>
            </div>
          )}

          {animeDetails && animeDetails.episodes && animeDetails.episodes.length > 0 && (
            <div id="episode-list" className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Semua Episode</h2>
              <div className="max-h-60 overflow-y-auto pr-2 rounded-md custom-scrollbar">
                <ul className="space-y-1.5">
                  {animeDetails.episodes.map((ep, index) => (
                    <li key={ep.id || ep.episodeId || index}>
                      <Link
                        to={`/watch/${ep.id || ep.episodeId}`}
                        className={`block p-2.5 rounded-md text-sm transition-colors
                                    ${(ep.id === episodeId || ep.episodeId === episodeId)
                                    ? 'bg-blue-500 text-white font-semibold shadow'
                                    : 'bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600/60 text-gray-700 dark:text-gray-300'}`}
                      >
                        {ep.title || ep.name || `Episode ${ep.episode_number || ep.number || (index + 1)}`}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watch;