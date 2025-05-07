// src/components/Pagination.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [visiblePages, setVisiblePages] = useState([]);
  
  useEffect(() => {
    // Calculate visible page numbers
    calculateVisiblePages(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const calculateVisiblePages = (current, total) => {
    let pages = [];
    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
    
    if (total <= maxVisiblePages) {
      // Show all pages if total is less than maxVisiblePages
      pages = Array.from({ length: total }, (_, i) => i + 1);
    } else {
      // Always include first and last page
      const siblingsCount = Math.floor((maxVisiblePages - 3) / 2); // -3 for current, first, last
      
      // Calculate range
      let start = Math.max(2, current - siblingsCount);
      let end = Math.min(total - 1, current + siblingsCount);
      
      // Adjust range if at the edges
      if (current <= siblingsCount + 1) {
        end = maxVisiblePages - 1;
      } else if (current >= total - siblingsCount) {
        start = total - maxVisiblePages + 2;
      }
      
      // Generate array of visible pages
      pages.push(1);
      if (start > 2) pages.push('...');
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }
    
    setVisiblePages(pages);
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const goToFirstPage = () => {
    if (currentPage !== 1) onPageChange(1);
  };

  const goToLastPage = () => {
    if (currentPage !== totalPages) onPageChange(totalPages);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Disable pagination if there's only one page
  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center items-center my-8" aria-label="Pagination">
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* First Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentPage === 1}
          onClick={goToFirstPage}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
          aria-label="Go to first page"
        >
          <ChevronsLeft size={18} />
        </motion.button>

        {/* Previous Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentPage === 1}
          onClick={goToPrevPage}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </motion.button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center space-x-1">
          {visiblePages.map((page, index) => (
            <div key={`${page}-${index}`}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
              ) : (
                <motion.button
                  whileHover={page !== currentPage ? { scale: 1.05 } : {}}
                  whileTap={page !== currentPage ? { scale: 0.95 } : {}}
                  onClick={() => handlePageClick(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md relative ${
                    page === currentPage
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`Page ${page}`}
                >
                  {page === currentPage && (
                    <motion.div
                      layoutId="activePage"
                      className="absolute inset-0 bg-blue-600 dark:bg-blue-700 rounded-md -z-10"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  {page}
                </motion.button>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Current Page Indicator */}
        <span className="sm:hidden text-gray-700 dark:text-gray-300 px-2">
          {currentPage} / {totalPages}
        </span>

        {/* Next Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentPage === totalPages}
          onClick={goToNextPage}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </motion.button>

        {/* Last Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentPage === totalPages}
          onClick={goToLastPage} 
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
          aria-label="Go to last page"
        >
          <ChevronsRight size={18} />
        </motion.button>
      </div>
    </nav>
  );
};

export default Pagination;