// src/services/api.js - Using CORS Proxy to bypass 403
const CORS_PROXIES = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

const ORIGINAL_API = 'https://animek-api-ten.vercel.app';
let currentProxyIndex = 0;

const getProxiedUrl = (endpoint) => {
  const fullUrl = `${ORIGINAL_API}${endpoint}`;
  const proxy = CORS_PROXIES[currentProxyIndex];
  
  if (proxy.includes('allorigins')) {
    return `${proxy}${encodeURIComponent(fullUrl)}`;
  } else {
    return `${proxy}${fullUrl}`;
  }
};

const switchProxy = () => {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  console.log(`🔄 Switching to proxy: ${CORS_PROXIES[currentProxyIndex]}`);
};

// Direct fetch without proxy (fallback)
const directFetch = async (endpoint, options = {}) => {
  const url = `${ORIGINAL_API}${endpoint}`;
  console.log(`📡 Direct fetch: ${url}`);
  
  const fetchOptions = {
    ...options,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
    mode: 'cors',
  };

  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Proxied fetch to bypass CORS and 403
const proxiedFetch = async (endpoint, options = {}) => {
  const url = getProxiedUrl(endpoint);
  console.log(`📡 Proxied fetch: ${url}`);
  
  const fetchOptions = {
    ...options,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Try multiple methods to fetch data
const fetchWithFallback = async (endpoint, options = {}) => {
  const methods = [
    () => directFetch(endpoint, options),
    () => proxiedFetch(endpoint, options),
  ];
  
  let lastError;
  
  for (const method of methods) {
    try {
      const result = await method();
      console.log(`✅ Success fetching: ${endpoint}`);
      return result;
    } catch (error) {
      console.log(`❌ Method failed: ${error.message}`);
      lastError = error;
      
      // If using proxy and it fails, try next proxy
      if (method === proxiedFetch) {
        switchProxy();
      }
    }
  }
  
  throw new Error(`All methods failed for ${endpoint}: ${lastError.message}`);
};

// Retry mechanism
const fetchWithRetry = async (endpoint, options = {}, retries = 2, delay = 1000) => {
  try {
    return await fetchWithFallback(endpoint, options);
  } catch (error) {
    if (retries <= 0) {
      throw new Error(`Request failed for ${endpoint}: ${error.message}`);
    }
    
    console.log(`⏱️ Retrying ${endpoint} in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(endpoint, options, retries - 1, delay * 1.5);
  }
};

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

const rateLimitedFetch = async (endpoint, options = {}) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  return fetchWithRetry(endpoint, options);
};

// --- API Functions ---

export const getAnimeList = () =>
  rateLimitedFetch('/otakudesu/home');

export const getAnimeDetails = (animeId) => {
  if (!animeId) return Promise.reject(new Error('Anime ID is required'));
  
  const cleanAnimeId = animeId.toString().trim().toLowerCase();
  console.log(`🎯 Getting anime details for ID: "${cleanAnimeId}"`);
  
  return rateLimitedFetch(`/otakudesu/anime/${cleanAnimeId}`);
};

export const searchAnime = (query, page) => {
  if (!query) return Promise.reject(new Error('Search query is required'));
  let searchEndpoint = `/otakudesu/search?q=${encodeURIComponent(query)}`;
  if (page) {
    searchEndpoint += `&page=${page}`;
  }
  return rateLimitedFetch(searchEndpoint);
};

export const getEpisodeDetails = (episodeId) => {
  if (!episodeId) return Promise.reject(new Error('Episode ID is required'));
  return rateLimitedFetch(`/otakudesu/episode/${episodeId}`);
};

export const getStreamingServerLink = (serverId) => {
  if (!serverId) return Promise.reject(new Error('Server ID is required'));
  return rateLimitedFetch(`/otakudesu/server/${serverId}`);
};

export const getBatchDownload = async (batchId) => {
  if (!batchId) throw new Error('Batch ID is required');
  try {
    const batchResponse = await rateLimitedFetch(`/otakudesu/batch/${batchId}`);
    return batchResponse.data ? batchResponse : { data: batchResponse };
  } catch (error) {
    console.warn(`Primary batch endpoint failed. Trying fallback...`);
    try {
      const animeDetailsResponse = await getAnimeDetails(batchId);
      if (animeDetailsResponse && animeDetailsResponse.data) {
        const animeData = animeDetailsResponse.data;
        if (animeData.batch_download_links && animeData.batch_download_links.length > 0) {
          return {
            data: {
              title: animeData.title,
              poster: animeData.poster,
              downloadLinks: animeData.batch_download_links,
            }
          };
        }
      }
      throw new Error('Batch download not available via fallback.');
    } catch (fallbackError) {
      throw new Error(`Batch download failed: ${fallbackError.message}`);
    }
  }
};

export const getGenres = () =>
  rateLimitedFetch('/otakudesu/genres');

export const getAnimeByGenre = (genreId, page = 1) => {
  if (!genreId) return Promise.reject(new Error('Genre ID is required'));
  return rateLimitedFetch(`/otakudesu/genres/${genreId}?page=${page}`);
};

export const getReleaseSchedule = () =>
  rateLimitedFetch('/otakudesu/schedule');

export const getOngoingAnime = (page = 1) =>
  rateLimitedFetch(`/otakudesu/ongoing?page=${page}`);

export const getCompletedAnime = (page = 1) =>
  rateLimitedFetch(`/otakudesu/completed?page=${page}`);

export const getAllAnimeList = () =>
  rateLimitedFetch('/otakudesu/anime');

// --- Aliases for compatibility ---
export const getHomeData = getAnimeList;
export const getRecentAnime = getOngoingAnime;
export const getPopularAnime = getCompletedAnime;