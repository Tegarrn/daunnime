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
    const errorBody = await response.text();
    console.error(`HTTP ${response.status} on directFetch ${url}: ${response.statusText}`, errorBody);
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
    const errorBody = await response.text();
    console.error(`HTTP ${response.status} on proxiedFetch ${url}: ${response.statusText}`, errorBody);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Try multiple methods to fetch data
const fetchWithFallback = async (endpoint, options = {}) => {
  const methods = [
    () => directFetch(endpoint, options), // Try direct fetch first
    () => proxiedFetch(endpoint, options),
  ];
  
  let lastError;
  
  for (const method of methods) {
    try {
      const result = await method();
      console.log(`✅ Success fetching: ${endpoint}`);
      return result;
    } catch (error) {
      console.log(`❌ Method failed for ${endpoint}: ${error.message}`);
      lastError = error;
      
      if (method === proxiedFetch) { // Assuming directFetch might be preferred and proxiedFetch is the fallback
        switchProxy(); // Switch proxy only if proxiedFetch fails
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
      console.error(`Request failed for ${endpoint} after multiple retries: ${error.message}`);
      throw new Error(`Request failed for ${endpoint}: ${error.message}`);
    }
    
    console.log(`⏱️ Retrying ${endpoint} in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(endpoint, options, retries - 1, delay * 1.5);
  }
};

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

const rateLimitedFetch = async (endpoint, options = {}) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️ Rate limiting: waiting ${waitTime}ms for ${endpoint}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  return fetchWithRetry(endpoint, options);
};

// Helper to extract data from response, prioritizing 'data' or 'list' property
const extractData = (response) => {
  if (response && typeof response === 'object') {
    if (response.data) { // Common pattern: { statusCode: 200, data: { ... } }
        // If response.data.list exists (like in getAllAnimeList), return response.data
        // otherwise, if response.data is the actual payload, return it.
        return response.data;
    }
    if (response.list && Array.isArray(response.list)) { // For structures like { list: [] } directly
        return response.list;
    }
    // Fallback: if no 'data' or 'list', assume the response itself is the core data
    // This handles cases where the API might return the data object directly
  }
  return response; 
};


// --- API Functions ---

export const getAnimeList = async () => {
  const response = await rateLimitedFetch('/otakudesu/home');
  // Assuming /home might return { data: { ongoing: [], completed: [] } } or similar
  return extractData(response); 
}

export const getAnimeDetails = async (animeId) => {
  if (!animeId) return Promise.reject(new Error('Anime ID is required'));
  
  const cleanAnimeId = animeId.toString().trim().toLowerCase();
  console.log(`🎯 Getting anime details for ID: "${cleanAnimeId}"`);
  
  const response = await rateLimitedFetch(`/otakudesu/anime/${cleanAnimeId}`);
  // Expects { data: { title: ..., episodes: ... } }
  return extractData(response);
};

export const searchAnime = async (query, page) => {
  if (!query) return Promise.reject(new Error('Search query is required'));
  let searchEndpoint = `/otakudesu/search?q=${encodeURIComponent(query)}`;
  if (page) {
    searchEndpoint += `&page=${page}`;
  }
  const response = await rateLimitedFetch(searchEndpoint);
  // Expects { data: [ {title:...}, ... ] } or { data: { results: []} }
  return extractData(response); 
};

export const getEpisodeDetails = async (episodeId) => {
  if (!episodeId) return Promise.reject(new Error('Episode ID is required'));
  const response = await rateLimitedFetch(`/otakudesu/episode/${episodeId}`);
  // Expects { data: { title: ..., servers: ... } }
  return extractData(response);
};

export const getStreamingServerLink = async (serverId) => {
  if (!serverId) return Promise.reject(new Error('Server ID is required'));
  const response = await rateLimitedFetch(`/otakudesu/server/${serverId}`);
  // This might return { url: "..." } or { data: { url: "..." } }
  // The extractData helper will try to get response.data first.
  // If response.data.url exists, it's fine. If response.url exists, it's also fine.
  const extracted = extractData(response);
  // Ensure we return an object with a URL if possible, or the extracted data.
  return (extracted && extracted.url) ? extracted : response;
};

export const getBatchDownload = async (batchId) => { // This is the one in services/api.js
  if (!batchId) throw new Error('Batch ID is required');
  try {
    const batchResponse = await rateLimitedFetch(`/otakudesu/batch/${batchId}`);
    // Expects { data: { title: ..., downloadLinks: ... } }
    return extractData(batchResponse);
  } catch (error) {
    console.warn(`Primary batch endpoint /otakudesu/batch/${batchId} failed. Trying fallback...`, error);
    try {
      const animeDetailsData = await getAnimeDetails(batchId); // This will now return unwrapped data
      if (animeDetailsData) { 
        // Check if batch related info is in the anime details
        if (animeDetailsData.batch_download_links && animeDetailsData.batch_download_links.length > 0) {
          return { // Construct a data object similar to what primary endpoint might give
              title: animeDetailsData.title,
              poster: animeDetailsData.poster,
              downloadLinks: animeDetailsData.batch_download_links,
              // Add other relevant fields if your batch page expects them from this fallback
          };
        } else if (animeDetailsData.downloads && Object.keys(animeDetailsData.downloads).length > 0) {
           // Handle if animeDetailsData itself contains 'downloads' structure for batch
           return {
              title: animeDetailsData.title,
              poster: animeDetailsData.poster,
              downloadLinks: animeDetailsData.downloads, // Or reformat as needed
           };
        }
      }
      throw new Error('Batch download not available via fallback or fallback data structure mismatch.');
    } catch (fallbackError) {
      console.error(`Batch download fallback failed for ${batchId}: ${fallbackError.message}`);
      throw new Error(`Batch download failed: ${fallbackError.message}`);
    }
  }
};

export const getGenres = async () => {
  const response = await rateLimitedFetch('/otakudesu/genres');
  // Expects { data: [ { name: ..., id: ... } ] }
  return extractData(response);
}

export const getAnimeByGenre = async (genreId, page = 1) => {
  if (!genreId) return Promise.reject(new Error('Genre ID is required'));
  const response = await rateLimitedFetch(`/otakudesu/genres/${genreId}?page=${page}`);
  // Expects { data: [ { title: ... } ] } or { data: { animeList: [] } }
  return extractData(response);
};

export const getReleaseSchedule = async () => {
  const response = await rateLimitedFetch('/otakudesu/schedule');
  // Expects { data: { Monday: [], ... } } or similar
  return extractData(response);
}

export const getOngoingAnime = async (page = 1) => {
  const response = await rateLimitedFetch(`/otakudesu/ongoing?page=${page}`);
  // Expects { data: { ongoing: [] } } or { data: [ ... ] }
  return extractData(response); 
}

export const getCompletedAnime = async (page = 1) => {
  const response = await rateLimitedFetch(`/otakudesu/completed?page=${page}`);
  // Expects { data: { completed: [] } } or { data: [ ... ] }
  return extractData(response); 
}

export const getAllAnimeList = async () => {
  const response = await rateLimitedFetch('/otakudesu/anime');
  // The user's example JSON is { data: { list: [] } }
  // extractData will return response.data which is { list: [] }
  // The component Home.jsx will then need to access rawData.list
  return extractData(response); 
}

// --- Aliases for compatibility ---
export const getHomeData = getAnimeList;
export const getRecentAnime = getOngoingAnime;
export const getPopularAnime = getCompletedAnime;