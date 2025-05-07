// src/pages/BatchDownload.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeDetails } from '../services/api';
import Loader from '../components/Loader';
import { Download } from 'lucide-react';

const BatchDownload = () => {
  const { batchId } = useParams();
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAnimeDetails(batchId);
        setBatchData(data);
      } catch (err) {
        setError('Failed to load batch download data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchBatchData();
    }
  }, [batchId]);

  if (loading) {
    return <Loader />;
  }

  if (error || !batchData) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-red-500 text-lg">{error || 'Batch download not found'}</p>
        <Link 
          to="/" 
          className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <Link 
          to={`/anime/${batchData.id}`}
          className="text-blue-500 hover:underline"
        >
          &larr; Back to {batchData.title}
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="md:flex gap-6 mb-6">
          <div className="flex-shrink-0 mb-4 md:mb-0">
            <img 
              src={batchData.poster || batchData.thumbnail} 
              alt={batchData.title} 
              className="w-40 h-auto rounded-lg mx-auto md:mx-0"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2 dark:text-white">{batchData.title}</h1>
            {batchData.alternativeTitle && (
              <p className="text-gray-600 dark:text-gray-300 mb-3">{batchData.alternativeTitle}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {batchData.genres?.map((genre) => (
                <span key={genre} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm dark:text-white">
                  {genre}
                </span>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              {batchData.type && (
                <div className="dark:text-white">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span> {batchData.type}
                </div>
              )}
              {batchData.episodes && (
                <div className="dark:text-white">
                  <span className="text-gray-600 dark:text-gray-400">Episodes:</span> {batchData.episodes}
                </div>
              )}
              {batchData.status && (
                <div className="dark:text-white">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span> {batchData.status}
                </div>
              )}
              {batchData.studio && (
                <div className="dark:text-white">
                  <span className="text-gray-600 dark:text-gray-400">Studio:</span> {batchData.studio}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Batch Download Links</h2>
          
          {batchData.downloadLinks?.length > 0 ? (
            <div className="space-y-4">
              {batchData.downloadLinks.map((link, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 font-medium dark:text-white">
                    {link.quality || `Download Option ${index + 1}`}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {link.links?.map((downloadLink, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={downloadLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                        >
                          <Download size={18} />
                          <span>{downloadLink.host || `Mirror ${linkIndex + 1}`}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No download links available for this anime.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchDownload;