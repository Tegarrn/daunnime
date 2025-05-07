// src/components/Loader.jsx
import { motion } from 'framer-motion';

const Loader = ({ size = 'default' }) => {
  const sizes = {
    small: 'w-12 h-12',
    default: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  const spinnerSize = sizes[size] || sizes.default;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        className={`${spinnerSize} relative`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Outer spinner */}
        <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 dark:border-blue-500 opacity-30"></div>
        
        {/* Inner spinner */}
        <div className="absolute inset-0 rounded-full border-t-4 border-r-4 border-blue-600 dark:border-blue-500"></div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>
      
      <motion.p 
        className="mt-4 text-gray-600 dark:text-gray-400 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Loading awesome anime...
      </motion.p>
    </div>
  );
};

export default Loader;