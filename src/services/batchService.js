// src/services/batchService.js

import { getAnimeDetails } from './api';

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
    const primary = await fetchWithSafeJson(`${API_URL}/samehadaku/batch/${batchId}`);
    
    // Debug the primary response
    console.log('🔍 Primary batch response:', primary);
    
    // Check if response contains error
    if (primary?.error) {
      console.warn(`⚠️ Primary batch error: ${primary.error}`);
      throw new Error(primary.error);
    }
    
    // Check if primary response is an array (some APIs return arrays for batch data)
    if (Array.isArray(primary)) {
      console.log('📋 Primary response is an array, formatting accordingly');
      if (primary.length > 0) {
        return {
          data: {
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
    
    // Check for direct downloadLinks in primary response
    if (primary?.downloadLinks && Array.isArray(primary.downloadLinks) && primary.downloadLinks.length > 0) {
      console.log('📦 Using direct downloadLinks from primary response');
      return {
        data: primary,
        title: primary.title || 'Batch Download',
        poster: primary.poster || '',
        batchAvailable: true
      };
    }
    
    // Check if response has a data property (API might have changed to wrap responses)
    if (primary?.data && typeof primary.data === 'object') {
      console.log('🔍 Primary response has data property, checking inside');
      
      if (primary.data.downloadLinks && Array.isArray(primary.data.downloadLinks) && primary.data.downloadLinks.length > 0) {
        console.log('📦 Using downloadLinks from primary.data');
        return {
          data: primary.data,
          title: primary.data.title || primary.title || 'Batch Download',
          poster: primary.data.poster || primary.poster || '',
          batchAvailable: true
        };
      }
      
      // Check for batch property in primary.data
      if (primary.data.batch && typeof primary.data.batch === 'object') {
        console.log('📦 Using batch from primary.data');
        return {
          data: primary.data.batch,
          title: primary.data.title || primary.data.batch.title || 'Batch Download',
          poster: primary.data.poster || primary.data.batch.poster || '',
          batchAvailable: true
        };
      }
    }
    
    // Check for batch property in primary response
    if (primary?.batch && typeof primary.batch === 'object') {
      console.log('📦 Using batch from primary response');
      
      // Check and normalize downloadLinks in batch
      if (!primary.batch.downloadLinks || !Array.isArray(primary.batch.downloadLinks) || primary.batch.downloadLinks.length === 0) {
        console.log('⚠️ Batch exists but missing downloadLinks, trying to construct from other properties');
        
        // Try to construct downloadLinks from other properties
        if (primary.batch.links || primary.batch.downloads) {
          const links = primary.batch.links || primary.batch.downloads;
          primary.batch.downloadLinks = [{
            quality: 'Default',
            links: Array.isArray(links)
              ? links
              : Object.keys(links).map(key => ({
                  url: typeof links[key] === 'string' ? links[key] : links[key]?.url || '',
                  host: typeof links[key] === 'string' ? key : links[key]?.host || links[key]?.name || key
                }))
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
    
    throw new Error('Valid download links not found in primary batch response');
  } catch (primaryError) {
    console.warn(`⚠️ Primary batch failed: ${primaryError.message}`);

    try {
      console.log(`🔄 Trying fallback with getAnimeDetails for ID: ${batchId}`);
      const details = await getAnimeDetails(batchId);
      
      // Log full details structure for debugging
      console.log(`📋 getAnimeDetails full response:`, details);
      
      // Check if details is null or undefined
      if (!details) {
        throw new Error('getAnimeDetails returned null or undefined');
      }
      
      // Handle different API response formats
      
      // Case 1: If response has a data property (new API format)
      if (details?.data) {
        console.log('🔍 Using new API format with details.data');
        
        // Check if details.data has nested data (some APIs double-wrap)
        if (details.data.data && typeof details.data.data === 'object') {
          console.log('🔍 Found nested data in details.data.data');
          details.data = details.data.data;
        }
        
        // Check for batch in details.data
        if (details.data.batch && typeof details.data.batch === 'object') {
          console.log('📦 Using details.data.batch');
          
          // Normalize downloadLinks if needed
          if (!details.data.batch.downloadLinks || !Array.isArray(details.data.batch.downloadLinks)) {
            console.log('⚠️ Normalizing batch.downloadLinks');
            details.data.batch.downloadLinks = [];
            
            // Try to construct from links or downloads property
            if (details.data.batch.links || details.data.batch.downloads) {
              const links = details.data.batch.links || details.data.batch.downloads;
              if (Array.isArray(links)) {
                details.data.batch.downloadLinks = [{
                  quality: 'Default',
                  links: links
                }];
              } else if (typeof links === 'object') {
                details.data.batch.downloadLinks = [{
                  quality: 'Default',
                  links: Object.keys(links).map(key => ({
                    url: typeof links[key] === 'string' ? links[key] : links[key]?.url || '',
                    host: typeof links[key] === 'string' ? key : links[key]?.host || links[key]?.name || key
                  }))
                }];
              }
            }
          }
          
          return {
            data: details.data.batch,
            title: details.data.title || details.data.batch.title || 'Batch Download',
            poster: details.data.poster || details.data.thumbnail || details.data.batch.poster || '',
            batchAvailable: details.data.batch.downloadLinks && details.data.batch.downloadLinks.length > 0
          };
        }
        
        // Check for downloads in details.data
        if (details.data.downloads) {
          console.log('📦 Using details.data.downloads');
          let downloadLinks = [];
          
          // Process different formats of downloads
          if (Array.isArray(details.data.downloads)) {
            downloadLinks = details.data.downloads;
          } else if (typeof details.data.downloads === 'object') {
            // Handle object format with qualities
            if (Object.values(details.data.downloads).some(val => typeof val === 'object' && val !== null)) {
              // Format with quality keys
              downloadLinks = Object.keys(details.data.downloads).map(quality => ({
                quality,
                links: Array.isArray(details.data.downloads[quality]) 
                  ? details.data.downloads[quality] 
                  : Object.keys(details.data.downloads[quality]).map(host => ({
                      url: typeof details.data.downloads[quality][host] === 'string' 
                        ? details.data.downloads[quality][host] 
                        : details.data.downloads[quality][host]?.url || '',
                      host
                    }))
              }));
            } else {
              // Format with host keys
              downloadLinks = [{
                quality: 'Default',
                links: Object.keys(details.data.downloads).map(key => ({
                  url: typeof details.data.downloads[key] === 'string' 
                    ? details.data.downloads[key] 
                    : details.data.downloads[key]?.url || '',
                  host: typeof details.data.downloads[key] === 'string' 
                    ? key 
                    : details.data.downloads[key]?.host || details.data.downloads[key]?.name || key
                }))
              }];
            }
          }
          
          const formatted = {
            title: details.data.title || 'Batch Download',
            poster: details.data.poster || details.data.thumbnail || '',
            downloadLinks
          };
          
          // Ensure links are not empty
          const hasValidLinks = formatted.downloadLinks.some(item => 
            item.links && item.links.length > 0 && item.links.some(link => link.url)
          );
          
          return {
            data: formatted,
            title: formatted.title,
            poster: formatted.poster,
            batchAvailable: hasValidLinks
          };
        }
        
        // Check for alternative batch link formats
        const batchLinks = details.data.batch_links || details.data.downloadBatch || details.data.batchLinks;
        if (batchLinks) {
          console.log('🔗 Found alternative batch links format');
          
          // Create formatted response
          const formatted = {
            title: details.data.title || 'Batch Download',
            poster: details.data.poster || details.data.thumbnail || '',
            downloadLinks: []
          };
          
          // Process batch links
          if (Array.isArray(batchLinks)) {
            formatted.downloadLinks = batchLinks;
          } else if (typeof batchLinks === 'object') {
            // Format with quality keys
            formatted.downloadLinks = Object.keys(batchLinks).map(quality => ({
              quality,
              links: Array.isArray(batchLinks[quality]) 
                ? batchLinks[quality] 
                : Object.keys(batchLinks[quality] || {}).map(host => ({
                    url: typeof batchLinks[quality][host] === 'string' 
                      ? batchLinks[quality][host] 
                      : batchLinks[quality][host]?.url || '',
                    host
                  }))
            }));
          }
          
          // Ensure links are not empty
          if (formatted.downloadLinks.length > 0) {
            return {
              data: formatted,
              title: formatted.title,
              poster: formatted.poster,
              batchAvailable: true
            };
          }
        }
        
        // Handle episodes
        if (details.data.episodes && Array.isArray(details.data.episodes) && details.data.episodes.length > 0) {
          console.log('📺 No batch found, but episodes are available in data');
          
          // Check if episodes have downloads
          const episodeDownloads = details.data.episodes.filter(ep => 
            ep.downloads || ep.download_links || ep.downloadLinks
          );
          
          if (episodeDownloads.length > 0) {
            console.log(`📁 Found ${episodeDownloads.length} episodes with downloads`);
            
            // Create a batch-like structure from episodes
            const batchLinks = episodeDownloads.map(ep => {
              const downloads = ep.downloads || ep.download_links || ep.downloadLinks || {};
              
              // Get episode number from title or id
              const episodeNum = ep.episode || 
                (ep.title && ep.title.match(/(\d+)/) ? ep.title.match(/(\d+)/)[1] : '') || 
                '';
              
              // Format episode title
              const episodeTitle = episodeNum ? `Episode ${episodeNum}` : (ep.title || 'Episode');
              
              return {
                quality: episodeTitle,
                links: Array.isArray(downloads) 
                  ? downloads 
                  : Object.keys(downloads).map(host => ({
                      url: typeof downloads[host] === 'string' ? downloads[host] : downloads[host]?.url || '',
                      host: typeof downloads[host] === 'string' ? host : downloads[host]?.host || host
                    }))
              };
            }).filter(item => item.links && item.links.length > 0);
            
            if (batchLinks.length > 0) {
              return {
                data: {
                  title: details.data.title || 'Episode Downloads',
                  poster: details.data.poster || details.data.thumbnail || '',
                  downloadLinks: batchLinks
                },
                title: details.data.title || 'Episode Downloads',
                poster: details.data.poster || details.data.thumbnail || '',
                batchAvailable: true,
                isEpisodeCollection: true
              };
            }
          }
          
          return {
            data: {
              title: details.data.title || 'Episode Downloads',
              message: 'Batch download tidak tersedia, tetapi episode individu dapat diunduh.',
              downloadLinks: []
            },
            title: details.data.title || 'Episode Downloads',
            poster: details.data.poster || details.data.thumbnail || '',
            batchAvailable: false,
            hasEpisodes: true
          };
        }
      }
      
      // Case 2: Old API format with details.batch
      if (details?.batch) {
        console.log('📦 Using details.batch (old format)');
        
        // Ensure batch has downloadLinks
        if (!details.batch.downloadLinks || !Array.isArray(details.batch.downloadLinks) || details.batch.downloadLinks.length === 0) {
          console.log('⚠️ Batch exists but missing downloadLinks, trying to construct from other properties');
          
          // Try to construct downloadLinks from other properties
          const links = details.batch.links || details.batch.downloads;
          
          if (links) {
            details.batch.downloadLinks = [{
              quality: 'Default',
              links: Array.isArray(links)
                ? links
                : Object.keys(links).map(key => ({
                    url: typeof links[key] === 'string' ? links[key] : links[key]?.url || '',
                    host: typeof links[key] === 'string' ? key : links[key]?.host || links[key]?.name || key
                  }))
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
      
      // Case 3: Old API format with details.downloads
      if (details?.downloads) {
        console.log('📦 Using details.downloads (old format)');
        
        let downloadLinks = [];
        
        // Process different formats of downloads
        if (Array.isArray(details.downloads)) {
          downloadLinks = details.downloads;
        } else if (typeof details.downloads === 'object') {
          // Handle object format
          if (Object.values(details.downloads).some(val => typeof val === 'object' && val !== null)) {
            // Format with quality keys
            downloadLinks = Object.keys(details.downloads).map(quality => ({
              quality,
              links: Array.isArray(details.downloads[quality]) 
                ? details.downloads[quality] 
                : Object.keys(details.downloads[quality]).map(host => ({
                    url: typeof details.downloads[quality][host] === 'string' 
                      ? details.downloads[quality][host] 
                      : details.downloads[quality][host]?.url || '',
                    host
                  }))
            }));
          } else {
            // Format with host keys
            downloadLinks = [{
              quality: 'Default',
              links: Object.keys(details.downloads).map(key => ({
                url: typeof details.downloads[key] === 'string' 
                  ? details.downloads[key] 
                  : details.downloads[key]?.url || '',
                host: typeof details.downloads[key] === 'string' 
                  ? key 
                  : details.downloads[key]?.host || details.downloads[key]?.name || key
              }))
            }];
          }
        }
        
        const formatted = {
          title: details.title || 'Batch Download',
          poster: details.poster || details.thumbnail || '',
          downloadLinks
        };
        
        // Ensure links are not empty
        const hasValidLinks = formatted.downloadLinks.some(item => 
          item.links && item.links.length > 0 && item.links.some(link => link && link.url)
        );
        
        return {
          data: formatted,
          title: formatted.title,
          poster: formatted.poster,
          batchAvailable: hasValidLinks
        };
      }
      
      // Case 4: Check if episodes have download links
      if (details?.episodes && Array.isArray(details.episodes) && details.episodes.length > 0) {
        console.log('📺 No batch found, checking if episodes have download links');
        
        const episodeDownloads = details.episodes.filter(ep => 
          ep.downloads || ep.download_links || ep.downloadLinks
        );
        
        if (episodeDownloads.length > 0) {
          console.log(`📁 Found ${episodeDownloads.length} episodes with downloads`);
          
          // Create a batch-like structure from episodes
          const batchLinks = episodeDownloads.map(ep => {
            const downloads = ep.downloads || ep.download_links || ep.downloadLinks || {};
            
            // Get episode number from title or id
            const episodeNum = ep.episode || 
              (ep.title && ep.title.match(/(\d+)/) ? ep.title.match(/(\d+)/)[1] : '') || 
              '';
            
            // Format episode title
            const episodeTitle = episodeNum ? `Episode ${episodeNum}` : (ep.title || 'Episode');
            
            return {
              quality: episodeTitle,
              links: Array.isArray(downloads) 
                ? downloads 
                : Object.keys(downloads).map(host => ({
                    url: typeof downloads[host] === 'string' ? downloads[host] : downloads[host]?.url || '',
                    host: typeof downloads[host] === 'string' ? host : downloads[host]?.host || host
                  }))
            };
          }).filter(item => item.links && item.links.length > 0);
          
          if (batchLinks.length > 0) {
            return {
              data: {
                title: details.title || 'Episode Downloads',
                poster: details.poster || details.thumbnail || '',
                downloadLinks: batchLinks
              },
              title: details.title || 'Episode Downloads',
              poster: details.poster || details.thumbnail || '',
              batchAvailable: true,
              isEpisodeCollection: true
            };
          }
        }
        
        return {
          data: {
            title: details.title || 'Episode Downloads',
            message: 'Batch download tidak tersedia, tetapi episode individu dapat diunduh.',
            downloadLinks: []
          },
          title: details.title || 'Episode Downloads',
          poster: details.poster || details.thumbnail || '',
          batchAvailable: false,
          hasEpisodes: true
        };
      }
      
      // Case 5: Handle error messages
      if (details?.ok === false && details?.message) {
        console.log('🚫 API returned message: ' + details.message);
        return {
          data: {
            title: 'Batch Download',
            message: details.message || 'Batch download tidak tersedia untuk anime ini.',
            downloadLinks: []
          },
          title: 'Batch Download',
          poster: '',
          batchAvailable: false,
          apiMessage: details.message
        };
      }
      
      // Case 6: Handle unexpected format
      console.log('🚫 Unknown API response format, dumping keys:', Object.keys(details));
      throw new Error('Unexpected API response format');
    } catch (fallbackError) {
      console.error(`❌ Fallback failed: ${fallbackError.message}`);
      // Include some debug info in the error message
      throw new Error(`Fallback failed: ${fallbackError.message} (${batchId})`);
    }
  }

  // Default return if all methods fail
  return {
    data: {
      title: 'Batch Download',
      message: 'Batch download tidak tersedia untuk anime ini.',
      downloadLinks: []
    },
    title: 'Batch Download',
    poster: '',
    batchAvailable: false
  };
};  