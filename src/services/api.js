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
    
    const data = await response.json();
    console.log(`✅ Success for ${url}`, data);
    return data;
  } catch (error) {
    console.error(`❌ Error for ${url}:`, error);
    
    // Add more context to the error
    const enhancedError = new Error(`Request failed for ${url.split('/').slice(-2).join('/')}: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.url = url;
    throw enhancedError;
  }
};

// Home page data
export const getHomeData = async () => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/home`);
};

// Recent anime
export const getRecentAnime = async (page = 1) => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/recent?page=${page}`);
};

// Popular anime
export const getPopularAnime = async (page = 1) => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/popular?page=${page}`);
};

// Search anime
export const searchAnime = async (query, page = 1) => {
  if (!query) throw new Error('Search query is required');
  return fetchWithErrorHandling(`${API_URL}/samehadaku/search?q=${encodeURIComponent(query)}&page=${page}`);
};

// Get anime details
export const getAnimeDetails = async (animeId) => {
  if (!animeId) throw new Error('Anime ID is required');
  return fetchWithErrorHandling(`${API_URL}/samehadaku/anime/${animeId}`);
};

// Get episode data
export const getEpisodeData = async (episodeId) => {
  if (!episodeId) throw new Error('Episode ID is required');
  return fetchWithErrorHandling(`${API_URL}/samehadaku/episode/${episodeId}`);
};

// Get server streaming data
export const getServerData = async (serverId) => {
  if (!serverId) throw new Error('Server ID is required');
  return fetchWithErrorHandling(`${API_URL}/samehadaku/server/${serverId}`);
};

// Get ongoing anime
export const getOngoingAnime = async (page = 1, order = 'title') => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/ongoing?page=${page}&order=${order}`);
};

// Get completed anime
export const getCompletedAnime = async (page = 1, order = 'title') => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/completed?page=${page}&order=${order}`);
};

// Get anime movies
export const getAnimeMovies = async (page = 1) => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/movies?page=${page}`);
};

// Get anime by genre
export const getAnimeByGenre = async (genreId, page = 1) => {
  if (!genreId) throw new Error('Genre ID is required');
  return fetchWithErrorHandling(`${API_URL}/samehadaku/genres/${genreId}?page=${page}`);
};

// Get all genres
export const getAllGenres = async () => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/genres`);
};

// Get all anime list
export const getAllAnime = async () => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/anime`);
};

// Get anime schedule
export const getAnimeSchedule = async () => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/schedule`);
};

// Get batch download
export const getBatchDownload = async (batchId) => {
  if (!batchId) throw new Error('Batch ID is required');
  return fetchWithErrorHandling(`${API_URL}/samehadaku/batch/${batchId}`);
};

// Get batch list
export const getBatchList = async (page = 1) => {
  return fetchWithErrorHandling(`${API_URL}/samehadaku/batch?page=${page}`);
};