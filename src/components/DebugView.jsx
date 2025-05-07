// src/components/DebugView.jsx
import { useState } from 'react';

/**
 * A debug component to display API responses during development
 * Add this to your Home.jsx for debugging
 */
const DebugView = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  return (
    <div className="fixed bottom-0 right-0 mb-4 mr-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700"
      >
        {isOpen ? 'Hide' : 'Show'} API Debug
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 overflow-auto">
          <div className="bg-white dark:bg-gray-800 p-4 m-4 rounded shadow-lg max-w-4xl mx-auto mt-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">API Response Debug</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded"
              >
                Close
              </button>
            </div>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-[70vh] text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugView;