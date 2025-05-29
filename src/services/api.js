// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'https://animek-api-ten.vercel.app';

// Helper function for API requests with better error handling
const fetchWithErrorHandling = async (url, options = {}) => {
  console.log(`📡 Fetching: ${url}`);
  
  // Gabungkan options default dengan options yang mungkin di-pass
  const fetchOptions = {
    ...options, // options yang mungkin di-pass dari fetchWithRetry (seperti method, body, dll.)
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // User-Agent umum
      // Anda bisa menambahkan header lain di sini jika diperlukan, misal:
      // 'Accept': 'application/json',
      // 'Content-Type': 'application/json', // Hanya jika Anda mengirim body JSON (misalnya untuk POST)
      ...(options.headers || {}), // Gabungkan dengan header yang mungkin sudah ada di options
    },
    // mode: 'cors', // uncomment jika ada masalah CORS, tapi 403 biasanya bukan CORS murni
  };

  // Hapus Content-Type jika tidak ada body (penting untuk GET request)
  if (!fetchOptions.body && fetchOptions.headers['Content-Type'] === 'application/json') {
    delete fetchOptions.headers['Content-Type'];
  }


  try {
    const response = await fetch(url, fetchOptions); // Menggunakan fetchOptions yang sudah dimodifikasi
    console.log(`📥 Response status: ${response.status} for ${url}`);
    console.log(`📄 Response headers for ${url}:`, Object.fromEntries(response.headers.entries()));


    if (!response.ok) {
      let errorDetail = '';
      try {
        // Coba baca respons sebagai JSON dulu jika gagal
        const errorData = await response.json();
        errorDetail = errorData.message || errorData.error || JSON.stringify(errorData);
      } catch (e) {
        // Jika gagal baca sebagai JSON (mungkin bukan JSON atau kosong), baca sebagai teks
        try {
            errorDetail = await response.text();
        } catch (textError){
            errorDetail = response.statusText; // Fallback ke statusText
        }
      }
      // Log detail error dari server jika ada
      console.error(`❌ Server error detail for ${url} (${response.status}):`, errorDetail);
      throw new Error(`API Error (${response.status}): ${errorDetail || response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        console.log(`✅ Success (JSON) for ${url}`, data);
        return data;
      } catch (error) {
        console.error(`❌ JSON parsing error for ${url}:`, error);
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
    } else {
      const text = await response.text();
      console.log(`✅ Success (Non-JSON text) for ${url}:`, text.substring(0, 100) + "..."); // Log sebagian kecil dari teks
      // Jika respons diharapkan JSON tapi tidak, ini bisa jadi masalah.
      // Namun, jika API terkadang mengembalikan teks (misal, HTML error page dari server proxy), ini menanganinya.
      // Untuk kasus umum API Anda, Anda mungkin selalu mengharapkan JSON.
      // Jika 'text' seharusnya JSON, coba parse di sini juga.
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          const data = JSON.parse(text);
          console.log(`✅ Parsed non-JSON text response as JSON for ${url}`, data);
          return data;
        } catch (error) {
          console.warn(`⚠️ Non-JSON text response for ${url} looks like JSON but couldn't be parsed. Returning text.`);
        }
      }
      // Jika API Anda seharusnya selalu JSON, mengembalikan teks bisa jadi error di sisi client.
      // Pertimbangkan untuk throw error jika contentType bukan JSON dan Anda selalu mengharapkannya.
      // throw new Error(`Received non-JSON response from server: ${contentType}`);
      return { success: true, text_response: text }; // Atau sesuaikan bagaimana Anda ingin menangani respons non-JSON
    }
  } catch (error) {
    // Pastikan error yang di-throw dari blok try di atas juga ditangkap di sini
    if (!error.url) { // Jika error berasal dari fetch atau parsing, tambahkan konteks
        console.error(`❌ Network or Parsing Error for ${url}:`, error);
        const enhancedError = new Error(`Request failed for ${url.split('/').slice(-2).join('/')}: ${error.message}`);
        enhancedError.originalError = error;
        enhancedError.url = url;
        throw enhancedError;
    }
    throw error; // Re-throw error yang sudah memiliki konteks
  }
};

// Retry mechanism for API requests (dari file Anda)
const fetchWithRetry = async (url, options = {}, retries = 2, delay = 1000) => {
  try {
    return await fetchWithErrorHandling(url, options);
  } catch (error) {
    // Hanya retry untuk error jaringan atau server tertentu, bukan 403 jika itu final.
    // Untuk error 403, retry mungkin tidak akan mengubah hasil jika disebabkan oleh header/izin.
    // Namun, jika 403 bersifat sementara (misal, WAF yang terlalu sensitif), retry bisa saja membantu.
    // Untuk sekarang, logika retry standar tetap dipertahankan.
    if (retries <= 0) {
      throw error;
    }
    console.log(`⏱️ Retrying request to ${url} in ${delay}ms... (${retries} retries left). Error: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
};

// --- Implementasi Fungsi API Otakudesu (tetap sama seperti sebelumnya) ---

export const getAnimeList = () =>
  fetchWithRetry(`${API_URL}/otakudesu/home`);

export const getAnimeDetails = (animeId) => {
  if (!animeId) return Promise.reject(new Error('Anime ID is required'));
  return fetchWithRetry(`${API_URL}/otakudesu/anime/${animeId}`);
};

export const searchAnime = (query, page) => {
  if (!query) return Promise.reject(new Error('Search query is required'));
  let searchUrl = `${API_URL}/otakudesu/search?q=${encodeURIComponent(query)}`;
  if (page) {
    searchUrl += `&page=${page}`;
  }
  return fetchWithRetry(searchUrl);
};

export const getEpisodeDetails = (episodeId) => {
  if (!episodeId) return Promise.reject(new Error('Episode ID is required'));
  return fetchWithRetry(`${API_URL}/otakudesu/episode/${episodeId}`);
};

export const getStreamingServerLink = (serverId) => {
  if (!serverId) return Promise.reject(new Error('Server ID is required'));
  return fetchWithRetry(`${API_URL}/otakudesu/server/${serverId}`);
};

export const getBatchDownload = async (batchId) => {
  if (!batchId) throw new Error('Batch ID is required');
  try {
    const batchResponse = await fetchWithRetry(`${API_URL}/otakudesu/batch/${batchId}`);
    return batchResponse.data ? batchResponse : { data: batchResponse };
  } catch (error) {
    console.warn(`Primary batch endpoint /otakudesu/batch/${batchId} failed. Trying fallback...`);
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
  fetchWithRetry(`${API_URL}/otakudesu/genres`);

export const getAnimeByGenre = (genreId, page = 1) => {
  if (!genreId) return Promise.reject(new Error('Genre ID is required'));
  return fetchWithRetry(`${API_URL}/otakudesu/genres/${genreId}?page=${page}`);
};

export const getReleaseSchedule = () =>
  fetchWithRetry(`${API_URL}/otakudesu/schedule`);

export const getOngoingAnime = (page = 1) =>
  fetchWithRetry(`${API_URL}/otakudesu/ongoing?page=${page}`);

export const getCompletedAnime = (page = 1) =>
  fetchWithRetry(`${API_URL}/otakudesu/completed?page=${page}`);

export const getAllAnimeList = () =>
  fetchWithRetry(`${API_URL}/otakudesu/anime`);

// --- Alias untuk kompatibilitas dengan Home.jsx yang ada ---
export const getHomeData = getAnimeList;
export const getRecentAnime = getOngoingAnime;
export const getPopularAnime = getCompletedAnime;