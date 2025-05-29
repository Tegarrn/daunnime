// src/components/BatchDownloadSection.jsx

import React, { useEffect, useState } from 'react';
import { getBatchDownload } from '../services/batchService';

const BatchDownloadSection = ({ batchId }) => {
  const [loading, setLoading] = useState(true);
  const [batchData, setBatchData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!batchId) {
        setLoading(false);
        setError('ID batch tidak ditemukan');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🔍 Fetching batch data for ID: ${batchId}`);
        const data = await getBatchDownload(batchId);
        console.log('✅ Batch data received:', data?.batchAvailable, data?.title);
        setBatchData(data);
      } catch (err) {
        console.error('❌ Failed to fetch batch:', err);
        setError(`Gagal mengambil data batch: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [batchId]);

  if (loading) return (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
      <p>⏳ Memuat data batch...</p>
    </div>
  );
  
  if (error) return (
    <div className="text-red-500 text-center py-4 border border-red-200 bg-red-50 rounded-md">
      <p className="font-semibold">⚠️ Error</p>
      <p>{error}</p>
    </div>
  );

  if (!batchData) return (
    <div className="text-center py-4 text-gray-500">
      ⚠️ Tidak ada data batch yang ditemukan.
    </div>
  );

  const { title, poster, data, batchAvailable, hasEpisodes } = batchData || {};

  if (!batchAvailable) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <div className="text-center py-2 text-gray-700">
          <p className="font-semibold">⚠️ Batch download belum tersedia untuk anime ini.</p>
          {hasEpisodes && (
            <p className="mt-2">
              Silakan periksa di halaman episode untuk mengunduh episode secara individual.
            </p>
          )}
          {data?.message && <p className="mt-2">{data.message}</p>}
        </div>
      </div>
    );
  }

  // Check if downloadLinks is valid
  const hasValidLinks = data?.downloadLinks && 
                        Array.isArray(data.downloadLinks) && 
                        data.downloadLinks.length > 0;

  if (!hasValidLinks) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <div className="text-center py-2 text-gray-700">
          <p className="font-semibold">⚠️ Link batch download tidak ditemukan.</p>
          <p className="mt-2">Silakan coba lagi nanti atau hubungi admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Batch Download: {title}</h2>
      {poster && (
        <img 
          src={poster} 
          alt={title} 
          className="max-w-xs mx-auto rounded-lg mb-4 shadow" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/240x320?text=No+Image';
          }}
        />
      )}
      <div className="space-y-4">
        {data.downloadLinks.map((item, index) => {
          // Skip jika tidak ada links atau links kosong
          if (!item.links || !Array.isArray(item.links) || item.links.length === 0) {
            return null;
          }
          
          return (
            <div key={index} className="border p-3 rounded shadow-sm">
              <h3 className="font-semibold mb-2">{item.quality || 'Default'}</h3>
              <ul className="list-disc list-inside space-y-1">
                {item.links.map((link, i) => {
                  // Skip jika tidak ada URL
                  if (!link || !link.url) return null;
                  
                  return (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {link.host || 'Download Link'}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BatchDownloadSection;