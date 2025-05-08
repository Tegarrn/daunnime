// src/components/BatchDownloadSection.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink, Check, Info } from 'lucide-react';
import { getBatchDownload } from '../services/api';

const BatchDownloadSection = ({ animeId, animeTitle }) => {
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!animeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await getBatchDownload(animeId);
        
        // Debug output to analyze the response
        console.log('BatchDownloadSection API response:', response);
        
        // More robust handling of different response structures
        let processedData = normalizeResponseData(response);
        
        if (processedData) {
          console.log('Normalized batch data:', processedData);
          setBatchData(processedData);
        } else {
          throw new Error('Invalid data structure received from API');
        }
      } catch (err) {
        console.error('Error fetching batch download data:', err);
        setError('Failed to load batch download information.');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [animeId]);

  // Helper function to normalize response data
  const normalizeResponseData = (response) => {
    if (!response) return null;
    
    // Initialize a normalized data structure
    let normalizedData = {
      title: '',
      poster: '',
      downloadLinks: [],
      batchAvailable: false
    };
    
    // First, extract base data from most common response formats
    if (response.data) {
      // When response has nested data property
      Object.assign(normalizedData, response.data);
      
      // Additional extraction from nested data if needed
      if (response.data.data) {
        Object.assign(normalizedData, response.data.data);
      }
    } else {
      // Direct structure
      Object.assign(normalizedData, response);
    }
    
    // Set title from the most reliable source
    normalizedData.title = normalizedData.title || 
                         (response.data && response.data.title) || 
                         (response.title) || 
                         animeTitle ||
                         "Anime Batch";
    
    // Set poster/thumbnail from the most reliable source
    normalizedData.poster = normalizedData.poster || 
                          normalizedData.thumbnail || 
                          normalizedData.image ||
                          (response.data && (response.data.poster || response.data.thumbnail || response.data.image)) ||
                          '';
    
    // Extract and normalize download links
    normalizedData.downloadLinks = extractDownloadLinks(normalizedData) || extractDownloadLinks(response);
    
    // Set batch availability based on download links
    normalizedData.batchAvailable = Array.isArray(normalizedData.downloadLinks) && normalizedData.downloadLinks.length > 0;
    
    // For debugging
    console.log('Normalized response data:', normalizedData);
    
    return normalizedData;
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mt-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mt-6">
        <h2 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Download size={20} />
          Batch Download
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Info size={18} />
            {error.includes("not available") ? 
              "Batch download belum tersedia untuk anime ini." : 
              "Gagal memuat informasi batch download. Silakan coba lagi nanti."}
          </p>
          {animeId && (
            <Link 
              to={`/anime/${animeId}`}
              className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>Lihat detail anime</span>
              <ExternalLink size={14} className="ml-1" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Get download links
  const downloadLinks = batchData.downloadLinks || [];
  const hasDownloadLinks = Array.isArray(downloadLinks) && downloadLinks.length > 0;
  const batchAvailable = batchData && batchData.batchAvailable;

  // Debug
  console.log('Download links check:', { downloadLinks, hasDownloadLinks, batchAvailable });

  if (!hasDownloadLinks && !batchAvailable) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mt-6">
        <h2 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Download size={20} />
          Batch Download
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Info size={18} />
            {batchData && batchData.message ? batchData.message : "Batch download belum tersedia untuk anime ini."}
          </p>
          {animeId && (
            <Link 
              to={`/anime/${animeId}`}
              className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>View full anime details</span>
              <ExternalLink size={14} className="ml-1" />
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Download size={20} />
          Batch Download
        </h2>
        
        <Link 
          to={`/batch/${animeId}`}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
        >
          <span>View all options</span>
          <ExternalLink size={14} className="ml-1" />
        </Link>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 mb-4">
        <p className="text-gray-700 dark:text-gray-300">
          Download all episodes of <span className="font-medium">{animeTitle || batchData.title}</span> in 
          batch format. Choose your preferred quality and mirror below.
        </p>
      </div>
      
      {downloadLinks.length > 0 && (
        <div className="space-y-4">
          {downloadLinks.slice(0, 2).map((link, index) => (
            <div key={index} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 font-medium flex justify-between items-center">
                <span className="dark:text-white">{link.quality || `Quality Option ${index + 1}`}</span>
                {link.size && <span className="text-sm text-gray-500 dark:text-gray-400">{link.size}</span>}
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {renderDownloadLinkButtons(link, handleCopyLink, copiedLink)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {downloadLinks.length > 2 && (
        <div className="mt-4 text-center">
          <Link 
            to={`/batch/${animeId}`}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
          >
            <span>View All Quality Options</span>
            <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </div>
  );
};

// Helper function to extract download links from various data structures
function extractDownloadLinks(data) {
  if (!data) return [];
  
  // Debug data structure
  console.log('Extracting download links from:', data);

  // Case 1: Direct downloadLinks array
  if (Array.isArray(data.downloadLinks) && data.downloadLinks.length > 0) {
    return normalizeDownloadLinks(data.downloadLinks);
  }
  
  // Case 2: Check for nested structure in 'data'
  if (data.data && Array.isArray(data.data.downloadLinks) && data.data.downloadLinks.length > 0) {
    return normalizeDownloadLinks(data.data.downloadLinks);
  }
  
  // Case 3: Check for downloads property
  if (data.downloads) {
    if (Array.isArray(data.downloads)) {
      return normalizeDownloadLinks(data.downloads);
    }
    
    if (data.downloads.links && Array.isArray(data.downloads.links)) {
      return normalizeDownloadLinks(data.downloads.links);
    }
    
    // Handle case where downloads might be an object with quality keys
    if (typeof data.downloads === 'object' && !Array.isArray(data.downloads)) {
      const links = [];
      for (const quality in data.downloads) {
        if (data.downloads[quality]) {
          const qualityLinks = Array.isArray(data.downloads[quality]) 
            ? data.downloads[quality] 
            : [data.downloads[quality]];
            
          links.push({
            quality,
            links: qualityLinks.map(link => {
              // Normalize link structure
              if (typeof link === 'string') {
                return { url: link, host: 'Download' };
              }
              return link;
            })
          });
        }
      }
      if (links.length > 0) return links;
    }
  }
  
  // Case 4: Direct array of links in the root
  if (Array.isArray(data.links) && data.links.length > 0) {
    return [{
      quality: 'Default Quality',
      links: data.links.map(link => {
        if (typeof link === 'string') {
          return { url: link, host: 'Download' };
        }
        return link;
      })
    }];
  }
  
  // Case 5: Single URL at the root
  if (data.url) {
    return [{
      quality: 'Default Quality',
      links: [{ 
        url: data.url,
        host: data.host || data.name || 'Download'
      }]
    }];
  }
  
  // Case 6: No links found
  return [];
}

// Helper function to normalize download links structure
function normalizeDownloadLinks(links) {
  if (!Array.isArray(links)) return [];
  
  return links.map(link => {
    // Case 1: Link is already in the correct format with quality and links array
    if (link.quality && Array.isArray(link.links)) {
      return {
        ...link,
        links: link.links.map(subLink => {
          if (typeof subLink === 'string') {
            return { url: subLink, host: 'Download' };
          }
          return subLink;
        })
      };
    }
    
    // Case 2: Link has a single URL property with no nested links array
    if (link.url) {
      return {
        quality: link.quality || 'Default Quality',
        links: [{ url: link.url, host: link.host || link.name || 'Download' }]
      };
    }
    
    // Case 3: Link is a string
    if (typeof link === 'string') {
      return {
        quality: 'Default Quality',
        links: [{ url: link, host: 'Download' }]
      };
    }
    
    // Case 4: Link has hosts or servers properties
    if (link.hosts || link.servers) {
      const subLinks = link.hosts || link.servers;
      return {
        quality: link.quality || 'Default Quality',
        links: Array.isArray(subLinks) ? subLinks.map(server => {
          if (typeof server === 'string') {
            return { url: server, host: 'Server' };
          }
          return server;
        }) : []
      };
    }
    
    return link;
  });
}

// Helper function to render download link buttons
function renderDownloadLinkButtons(link, handleCopyLink, copiedLink) {
  // Case 1: If link.links is an array, render each link
  if (Array.isArray(link.links) && link.links.length > 0) {
    return link.links.slice(0, 8).map((downloadLink, linkIndex) => (
      <div key={linkIndex} className="flex flex-col gap-1">
        <a
          href={downloadLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
        >
          <Download size={16} />
          <span className="line-clamp-1">{downloadLink.host || downloadLink.name || `Mirror ${linkIndex + 1}`}</span>
        </a>
        <button
          onClick={() => handleCopyLink(downloadLink.url)}
          className="text-xs text-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-1"
        >
          {copiedLink === downloadLink.url ? (
            <span className="flex items-center justify-center gap-1">
              <Check size={12} /> Copied
            </span>
          ) : (
            "Copy Link"
          )}
        </button>
      </div>
    ));
  }
  
  // Case 2: If link itself has a url (flat structure)
  if (link.url) {
    return (
      <div className="flex flex-col gap-1">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
        >
          <Download size={16} />
          <span className="line-clamp-1">{link.host || link.name || "Download"}</span>
        </a>
        <button
          onClick={() => handleCopyLink(link.url)}
          className="text-xs text-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-1"
        >
          {copiedLink === link.url ? (
            <span className="flex items-center justify-center gap-1">
              <Check size={12} /> Copied
            </span>
          ) : (
            "Copy Link"
          )}
        </button>
      </div>
    );
  }
  
  // Fallback case: If no links found
  return <div className="text-gray-500 dark:text-gray-400">No download links available</div>;
}

export default BatchDownloadSection;