// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL;

// Home page data
export const getHomeData = async () => {
  try {
    const response = await fetch(`${API_URL}/samehadaku/home`);
    if (!response.ok) throw new Error('Failed to fetch home data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching home data:', error);
    throw error;
  }
};

// Recent anime
export const getRecentAnime = async (page = 1) => {
  try {
    const response = await fetch(`${API_URL}/samehadaku/recent?page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch recent anime');
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent anime:', error);
    throw error;
  }
};

// Popular anime
export const getPopularAnime = async (page = 1) => {
  try {
    const response = await fetch(`${API_URL}/samehadaku/popular?page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch popular anime');
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular anime:', error);
    throw error;
  }
};

// Search anime
export const searchAnime = async (query, page = 1) => {
  try {
    const response = await fetch(`${API_URL}/samehadaku/search?q=${encodeURIComponent(query)}&page=${page}`);
    if (!response.ok) throw new Error('Failed to search anime');
    return await response.json();
  } catch (error) {
    console.error('Error searching anime:', error);
    throw error;
  }
};

// Get anime details
export const getAnimeDetails = async (animeId) => {
  try {
    const response = await fetch(`${API_URL}/samehadaku/anime/${animeId}`);
    if (!response.ok) throw new Error('Failed to fetch anime details');
    return await response.json();
  } catch (error) {
    console.error('Error fetching anime details:', error);
    throw error;
  }
};

// Get episode data
export const getEpisodeData = async (episodeId) => {
  try {
    const response = await fetch(`${API_URL}/samehadaku/episode/${episodeId}`);
    if (!response.ok) throw new Error('Failed to fetch episode data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching episode data:', error);
    throw error;
  }
};

// Get server streaming data
export const getServerData = async (serverId) => {
  try {
    const response = await fetch(`${API_URL}/samehadaku/server/${serverId}`);
    if (!response.ok) throw new Error('Failed to fetch server data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching server data:', error);
    throw error;
  }
};