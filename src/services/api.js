// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'https://animek-api-rho.vercel.app';

// Helper function for API requests with better error handling
const fetchWithErrorHandling = async (url, options = {}) => {
  console.log(`📡 Fetching: ${url}`);
  try {
    const response = await fetch(url, options);
    
    // Log response status
    console.log(`📥 Response status: ${response.status} for ${url}`);
    
    if (!response.ok) {
      // Try to get more detailed error info if available
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        errorDetail = response.statusText;
      }
      
      throw new Error(`API Error (${response.status}): ${errorDetail}`);
    }
    
    // Check if the response is valid JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        console.log(`✅ Success for ${url}`, data);
        return data;
      } catch (error) {
        console.error(`❌ JSON parsing error for ${url}:`, error);
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
    } else {
      // For non-JSON responses, get text and try to parse it
      const text = await response.text();
      console.log(`✅ Received text response for ${url}`);
      
      // Try to parse as JSON if it looks like JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          const data = JSON.parse(text);
          console.log(`✅ Parsed text response as JSON for ${url}`, data);
          return data;
        } catch (error) {
          console.warn(`⚠️ Text response looks like JSON but couldn't be parsed for ${url}`);
        }
      }
      
      // Return text as fallback
      return { success: true, text };
    }
  } catch (error) {
    console.error(`❌ Error for ${url}:`, error);
    
    // Add more context to the error
    const enhancedError = new Error(`Request failed for ${url.split('/').slice(-2).join('/')}: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.url = url;
    throw enhancedError;
  }
};

// Retry mechanism for API requests
const fetchWithRetry = async (url, options = {}, retries = 2, delay = 1000) => {
  try {
    return await fetchWithErrorHandling(url, options);
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.log(`⏱️ Retrying request to ${url} in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
};

// Home page data
export const getHomeData = async () => {
  return fetchWithRetry(`${API_URL}/samehadaku/home`);
};

// Recent anime
export const getRecentAnime = async (page = 1) => {
  return fetchWithRetry(`${API_URL}/samehadaku/recent?page=${page}`);
};

// Popular anime
export const getPopularAnime = async (page = 1) => {
  return fetchWithRetry(`${API_URL}/samehadaku/popular?page=${page}`);
};

// Search anime
export const searchAnime = async (query, page = 1) => {
  if (!query) throw new Error('Search query is required');
  return fetchWithRetry(`${API_URL}/samehadaku/search?q=${encodeURIComponent(query)}&page=${page}`);
};

// Get anime details
export const getAnimeDetails = async (animeId) => {
  if (!animeId) throw new Error('Anime ID is required');
  return fetchWithRetry(`${API_URL}/samehadaku/anime/${animeId}`);
};

// Get episode data
export const getEpisodeData = async (episodeId) => {
  if (!episodeId) throw new Error('Episode ID is required');
  return fetchWithRetry(`${API_URL}/samehadaku/episode/${episodeId}`);
};

// Get server streaming data
export const getServerData = async (serverId) => {
  if (!serverId) throw new Error('Server ID is required');
  return fetchWithRetry(`${API_URL}/samehadaku/server/${serverId}`);
};

// Get ongoing anime
export const getOngoingAnime = async (page = 1, order = 'title') => {
  return fetchWithRetry(`${API_URL}/samehadaku/ongoing?page=${page}&order=${order}`);
};

// Get completed anime
export const getCompletedAnime = async (page = 1, order = 'title') => {
  return fetchWithRetry(`${API_URL}/samehadaku/completed?page=${page}&order=${order}`);
};

// Get anime movies
export const getAnimeMovies = async (page = 1) => {
  return fetchWithRetry(`${API_URL}/samehadaku/movies?page=${page}`);
};

// Get anime by genre
export const getAnimeByGenre = async (genreId, page = 1) => {
  if (!genreId) throw new Error('Genre ID is required');
  return fetchWithRetry(`${API_URL}/samehadaku/genres/${genreId}?page=${page}`);
};

// Get all genres
export const getAllGenres = async () => {
  return fetchWithRetry(`${API_URL}/samehadaku/genres`);
};

// Get all anime list
export const getAllAnime = async () => {
  return fetchWithRetry(`${API_URL}/samehadaku/anime`);
};

// Get anime schedule
export const getAnimeSchedule = async () => {
  return fetchWithRetry(`${API_URL}/samehadaku/schedule`);
};

// Get batch download with improved error handling
export const getBatchDownload = async (batchId) => {
  if (!batchId) throw new Error('Batch ID is required');
  
  try {
    // First try the direct batch endpoint
    return await fetchWithRetry(`${API_URL}/samehadaku/batch/${batchId}`);
  } catch (error) {
    console.log(`⚠️ Primary batch endpoint failed, trying fallback for ${batchId}...`);
    
    try {
      // If the direct batch endpoint fails, try to get batch info from anime details
      const animeDetails = await getAnimeDetails(batchId);
      
      // Check if anime details has batch download info
      if (animeDetails && animeDetails.batch) {
        console.log(`✅ Successfully retrieved batch data from anime details for ${batchId}`);
        return { data: animeDetails.batch, title: animeDetails.title };
      }
      
      // If anime details doesn't have batch info but has download links, construct batch data
      if (animeDetails && animeDetails.downloads) {
        console.log(`✅ Constructing batch data from anime downloads for ${batchId}`);
        return {
          data: {
            title: animeDetails.title,
            poster: animeDetails.poster || animeDetails.thumbnail,
            downloadLinks: animeDetails.downloads
          },
          title: animeDetails.title
        };
      }
      
      // If anime details has episodes, try to construct a batch from episode data
      if (animeDetails && animeDetails.episodes && Array.isArray(animeDetails.episodes) && animeDetails.episodes.length > 0) {
        console.log(`✅ Attempting to construct batch data from episodes for ${batchId}`);
        
        // Get the last episode data if available
        try {
          const lastEpisode = animeDetails.episodes[0];
          if (lastEpisode && lastEpisode.id) {
            const episodeData = await getEpisodeData(lastEpisode.id);
            
            if (episodeData && episodeData.downloads) {
              return {
                data: {
                  title: animeDetails.title,
                  poster: animeDetails.poster || animeDetails.thumbnail,
                  downloadLinks: episodeData.downloads,
                  episodeSource: lastEpisode.id,
                  note: "Batch tidak tersedia. Menampilkan download untuk episode terakhir."
                },
                title: animeDetails.title
              };
            }
          }
        } catch (episodeError) {
          console.warn(`⚠️ Could not get episode data for ${batchId}:`, episodeError);
        }
      }
      
      // Create a placeholder batch for anime without batch download
      console.log(`ℹ️ Creating placeholder batch for ${batchId}`);
      
      // Return a placeholder object that indicates batch download isn't available
      // but still includes anime info for UI display
      return {
        data: {
          title: animeDetails.title || "Unknown Anime",
          poster: animeDetails.poster || animeDetails.thumbnail || "",
          status: animeDetails.status || "Completed",
          type: animeDetails.type || "TV",
          downloadLinks: [],
          batchAvailable: false,
          message: "Batch download belum tersedia untuk anime ini."
        },
        title: animeDetails.title || "Unknown Anime",
        batchAvailable: false
      };
      
    } catch (fallbackError) {
      console.error(`❌ Both batch endpoints failed for ${batchId}:`, fallbackError);
      throw new Error(`Batch download not available: ${fallbackError.message}`);
    }
  }
};

// Get batch list
export const getBatchList = async (page = 1) => {
  return fetchWithRetry(`${API_URL}/samehadaku/batch?page=${page}`);
};