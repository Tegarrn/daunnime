// src/services/batchService.js

import { getAnimeDetails } from './api'; // getAnimeDetails from services/api.js

const API_URL = import.meta.env.VITE_API_URL || 'https://animek-api-rho.vercel.app';

const fetchWithSafeJson = async (url, options = {}) => {
    console.log(`📡 Fetching: ${url}`);
    try {
      const response = await fetch(url, options);
      console.log(`📥 Response status: ${response.status} for ${url}`);
  
      const contentType = response.headers.get('content-type');
  
      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData?.message || errorData?.error || JSON.stringify(errorData);
        } catch (err) {
          errorDetail = response.statusText || 'Unknown error';
        }
        throw new Error(`API Error (${response.status}): ${errorDetail}`);
      }
  
      let text = '';
      try {
        text = await response.text();
      } catch (err) {
        console.warn(`⚠️ Cannot read response text for ${url}`, err);
        return { error: 'Failed to read response text' };
      }
  
      if (typeof text === 'string') {
        const trimmed = text.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            return JSON.parse(trimmed);
          } catch (parseErr) {
            console.warn(`⚠️ Failed to parse JSON from text for ${url}`, parseErr);
            return { error: 'Invalid JSON structure' };
          }
        }
      }
  
      return { text: text || '' };
  
    } catch (error) {
      console.error(`❌ Fetch failed for ${url}:`, error);
      throw error;
    }
  };
  
export const getBatchDownload = async (batchId) => {
  if (!batchId) throw new Error('Batch ID is required');

  try {
    // Primary fetch still uses fetchWithSafeJson which might return a wrapped response
    const primaryRaw = await fetchWithSafeJson(`${API_URL}/samehadaku/batch/${batchId}`);
    // Normalize primary response: if it has a .data, use it, otherwise use the object itself.
    const primary = primaryRaw.data || primaryRaw;
    
    console.log('🔍 Primary batch response (data extracted if present):', primary);
    
    if (primary?.error) {
      console.warn(`⚠️ Primary batch error: ${primary.error}`);
      throw new Error(primary.error);
    }
    
    if (Array.isArray(primary)) {
      console.log('📋 Primary response is an array, formatting accordingly');
      if (primary.length > 0) {
        return {
          data: { // Ensure data property exists for consistency in BatchDownload.jsx
            title: primary[0]?.title || 'Batch Download',
            poster: primary[0]?.poster || primary[0]?.thumbnail || '',
            downloadLinks: primary.map(item => ({
              quality: item.quality || 'Default',
              links: item.links || []
            })).filter(item => item.links && item.links.length > 0)
          },
          title: primary[0]?.title || 'Batch Download',
          poster: primary[0]?.poster || primary[0]?.thumbnail || '',
          batchAvailable: true
        };
      }
    }
    
    if (primary?.downloadLinks && Array.isArray(primary.downloadLinks) && primary.downloadLinks.length > 0) {
      console.log('📦 Using direct downloadLinks from primary response');
      return {
        data: primary, // primary is already the data part
        title: primary.title || 'Batch Download',
        poster: primary.poster || '',
        batchAvailable: true
      };
    }
    
    // The primary object might already be the core data.
    // Check for properties directly on `primary` if it's an object
    if (typeof primary === 'object' && primary !== null) {
        if (primary.batch && typeof primary.batch === 'object') {
            console.log('📦 Using batch from primary response (already extracted data)');
             if (!primary.batch.downloadLinks || !Array.isArray(primary.batch.downloadLinks) || primary.batch.downloadLinks.length === 0) {
                if (primary.batch.links || primary.batch.downloads) {
                    const links = primary.batch.links || primary.batch.downloads;
                    primary.batch.downloadLinks = [{
                        quality: 'Default',
                        links: Array.isArray(links) ? links : Object.keys(links).map(key => ({ url: typeof links[key] === 'string' ? links[key] : links[key]?.url || '', host: typeof links[key] === 'string' ? key : links[key]?.host || links[key]?.name || key }))
                    }];
                }
            }
            return {
                data: primary.batch,
                title: primary.title || primary.batch.title || 'Batch Download',
                poster: primary.poster || primary.batch.poster || '',
                batchAvailable: primary.batch.downloadLinks && primary.batch.downloadLinks.length > 0
            };
        }
    }
    
    throw new Error('Valid download links not found in primary batch response');
  } catch (primaryError) {
    console.warn(`⚠️ Primary batch failed: ${primaryError.message}`);

    try {
      console.log(`🔄 Trying fallback with getAnimeDetails for ID: ${batchId}`);
      // getAnimeDetails from services/api.js now returns the unwrapped data object
      const details = await getAnimeDetails(batchId); 
      
      console.log(`📋 getAnimeDetails full response (fallback):`, details);
      
      if (!details) {
        throw new Error('getAnimeDetails returned null or undefined');
      }
      
      // `details` is now the core anime object, not a wrapped response.
      // Access properties directly from `details`.

      // Case 1: details.batch (if batch data is part of anime details)
      if (details.batch && typeof details.batch === 'object') {
        console.log('📦 Using details.batch (from fallback)');
        if (!details.batch.downloadLinks || !Array.isArray(details.batch.downloadLinks) || details.batch.downloadLinks.length === 0) {
          const links = details.batch.links || details.batch.downloads;
          if (links) {
            details.batch.downloadLinks = [{
              quality: 'Default',
              links: Array.isArray(links) ? links : Object.keys(links).map(key => ({ url: typeof links[key] === 'string' ? links[key] : links[key]?.url || '', host: typeof links[key] === 'string' ? key : links[key]?.host || links[key]?.name || key }))
            }];
          } else {
            details.batch.downloadLinks = [];
          }
        }
        return {
          data: details.batch,
          title: details.title || details.batch.title || 'Batch Download',
          poster: details.poster || details.thumbnail || details.batch.poster || '',
          batchAvailable: details.batch.downloadLinks && details.batch.downloadLinks.length > 0
        };
      }
      
      // Case 2: details.downloads (if downloads are directly in anime details)
      if (details.downloads) {
        console.log('📦 Using details.downloads (from fallback)');
        let downloadLinks = [];
        if (Array.isArray(details.downloads)) {
          downloadLinks = details.downloads;
        } else if (typeof details.downloads === 'object') {
          if (Object.values(details.downloads).some(val => typeof val === 'object' && val !== null)) {
            downloadLinks = Object.keys(details.downloads).map(quality => ({
              quality,
              links: Array.isArray(details.downloads[quality]) ? details.downloads[quality] : Object.keys(details.downloads[quality]).map(host => ({ url: typeof details.downloads[quality][host] === 'string' ? details.downloads[quality][host] : details.downloads[quality][host]?.url || '', host }))
            }));
          } else {
            downloadLinks = [{
              quality: 'Default',
              links: Object.keys(details.downloads).map(key => ({ url: typeof details.downloads[key] === 'string' ? details.downloads[key] : details.downloads[key]?.url || '', host: typeof details.downloads[key] === 'string' ? key : details.downloads[key]?.host || details.downloads[key]?.name || key }))
            }];
          }
        }
        const formatted = {
          title: details.title || 'Batch Download',
          poster: details.poster || details.thumbnail || '',
          downloadLinks
        };
        const hasValidLinks = formatted.downloadLinks.some(item => item.links && item.links.length > 0 && item.links.some(link => link && link.url));
        return {
          data: formatted,
          title: formatted.title,
          poster: formatted.poster,
          batchAvailable: hasValidLinks
        };
      }
      
      // Case 3: Check for alternative batch link formats in `details`
      const batchLinksSource = details.batch_links || details.downloadBatch || details.batchLinks;
      if (batchLinksSource) {
          console.log('🔗 Found alternative batch links format in fallback details');
          const formatted = {
              title: details.title || 'Batch Download',
              poster: details.poster || details.thumbnail || '',
              downloadLinks: []
          };
          if (Array.isArray(batchLinksSource)) {
              formatted.downloadLinks = batchLinksSource;
          } else if (typeof batchLinksSource === 'object') {
              formatted.downloadLinks = Object.keys(batchLinksSource).map(quality => ({
                  quality,
                  links: Array.isArray(batchLinksSource[quality]) ? batchLinksSource[quality] : Object.keys(batchLinksSource[quality] || {}).map(host => ({ url: typeof batchLinksSource[quality][host] === 'string' ? batchLinksSource[quality][host] : batchLinksSource[quality][host]?.url || '', host }))
              }));
          }
          if (formatted.downloadLinks.length > 0 && formatted.downloadLinks.some(dl => dl.links && dl.links.length > 0)) {
              return { data: formatted, title: formatted.title, poster: formatted.poster, batchAvailable: true };
          }
      }

      // Case 4: Handle episodes if no direct batch found in `details`
      if (details.episodes && Array.isArray(details.episodes) && details.episodes.length > 0) {
        console.log('📺 No batch found in fallback details, but episodes are available');
        const episodeDownloads = details.episodes.filter(ep => ep.downloads || ep.download_links || ep.downloadLinks);
        if (episodeDownloads.length > 0) {
          console.log(`📁 Found ${episodeDownloads.length} episodes with downloads in fallback`);
          const batchLinksFromEpisodes = episodeDownloads.map(ep => {
            const downloads = ep.downloads || ep.download_links || ep.downloadLinks || {};
            const episodeNum = ep.episode || (ep.title && ep.title.match(/(\d+)/) ? ep.title.match(/(\d+)/)[1] : '') || '';
            const episodeTitle = episodeNum ? `Episode ${episodeNum}` : (ep.title || 'Episode');
            return {
              quality: episodeTitle,
              links: Array.isArray(downloads) ? downloads : Object.keys(downloads).map(host => ({ url: typeof downloads[host] === 'string' ? downloads[host] : downloads[host]?.url || '', host: typeof downloads[host] === 'string' ? host : downloads[host]?.host || host }))
            };
          }).filter(item => item.links && item.links.length > 0);
          
          if (batchLinksFromEpisodes.length > 0) {
            return {
              data: { title: details.title || 'Episode Downloads', poster: details.poster || details.thumbnail || '', downloadLinks: batchLinksFromEpisodes },
              title: details.title || 'Episode Downloads', poster: details.poster || details.thumbnail || '',
              batchAvailable: true, isEpisodeCollection: true
            };
          }
        }
        return {
          data: { title: details.title || 'Episode Downloads', message: 'Batch download tidak tersedia, tetapi episode individu dapat diunduh.', downloadLinks: [] },
          title: details.title || 'Episode Downloads', poster: details.poster || details.thumbnail || '',
          batchAvailable: false, hasEpisodes: true
        };
      }
      
      // If details itself is an error message object (some APIs might do this)
      if (details.ok === false && details.message) {
          console.log('🚫 API (fallback) returned message: ' + details.message);
          return {
              data: { title: 'Batch Download', message: details.message, downloadLinks: [] },
              title: 'Batch Download', poster: '', batchAvailable: false, apiMessage: details.message
          };
      }

      console.log('🚫 Unknown API response format from getAnimeDetails (fallback), dumping keys:', Object.keys(details));
      throw new Error('Unexpected API response format in fallback');
    } catch (fallbackError) {
      console.error(`❌ Fallback failed: ${fallbackError.message}`);
      throw new Error(`Fallback failed: ${fallbackError.message} (${batchId})`);
    }
  }

  return { // Default return if all methods fail or primary response is not parsable as batch
    data: { title: 'Batch Download', message: 'Batch download tidak tersedia untuk anime ini.', downloadLinks: [] },
    title: 'Batch Download', poster: '', batchAvailable: false
  };
};