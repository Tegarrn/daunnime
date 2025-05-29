// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, Film, Home as HomeIcon, Search as SearchIconLucide, Download, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SearchBar from './SearchBar';
import elainaLogo from '../assets/elaina.png';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchActiveMobile, setIsSearchActiveMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef(null);

  // Definisikan navItems dengan path yang sesuai untuk logika `isActive`
  // Jika 'Ongoing' dan 'Completed' adalah tab di halaman Home, path-nya harus menyertakan query param
  const navItems = [
    { name: 'Home', path: '/', queryTab: null, icon: <HomeIcon size={20} />, exact: true },
    { name: 'Ongoing', path: '/', queryTab: 'recent', icon: <Film size={20} /> },
    { name: 'Completed', path: '/', queryTab: 'popular', icon: <Download size={20} /> },
  ];

  const extraSidebarItems = [
    { name: 'Pengaturan', path: '/settings', icon: <Settings size={20} /> },
    { name: 'Keluar', path: '#', icon: <LogOut size={20} />, action: () => { console.log("Logout clicked"); setIsMobileMenuOpen(false); } },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchActiveMobile(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isMobileMenuOpen || isSearchActiveMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen, isSearchActiveMobile]);

  const isActive = (item) => {
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const currentUrlTab = searchParams.get('tab');
    const currentSearchQuery = searchParams.get('q');

    if (currentSearchQuery) return false; // Tidak ada yang aktif saat hasil pencarian ditampilkan

    if (currentPath === item.path) {
      if (item.queryTab) { // Untuk item dengan queryTab (Ongoing, Completed)
        return currentUrlTab === item.queryTab;
      }
      if (item.exact) { // Untuk Home (path: '/')
        return !currentUrlTab; // Aktif jika tidak ada tab spesifik
      }
    }
    // Untuk path non-home yang berdiri sendiri (misal /settings)
    if (item.path !== '/' && currentPath === item.path) return true;
    
    return false;
  };
  
  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 320, damping: 35, mass: 0.9 } },
    closed: { x: "-100%", transition: { type: "spring", stiffness: 320, damping: 35, mass: 0.9, delay: 0.1 } }
  };

  const overlayVariants = {
    open: { opacity: 1, transition: { duration: 0.4, ease: "easeInOut" } },
    closed: { opacity: 0, transition: { duration: 0.3, ease: "easeInOut", delay: 0.1 } }
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05, // Stagger effect
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };
  
  const handleMobileSearchSubmit = (query) => {
    if(query.trim()){
        navigate(`/search?q=${encodeURIComponent(query.trim())}&page=1`);
        setIsSearchActiveMobile(false);
        setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    if (isSearchActiveMobile && !isMobileMenuOpen) setIsSearchActiveMobile(false);
  };

  const toggleMobileSearch = () => {
    setIsSearchActiveMobile(prev => !prev);
    if (isMobileMenuOpen && !isSearchActiveMobile) setIsMobileMenuOpen(false);
  };
  
  const LogoAndBrand = ({ inSidebar = false, onLinkClick }) => (
    <Link 
        to="/" 
        className={`flex items-center space-x-2.5 rtl:space-x-reverse group ${inSidebar ? 'mb-6 p-1' : ''}`}
        onClick={() => { if (onLinkClick) onLinkClick(); }}
    >
      <motion.img
        src={elainaLogo} alt="Daunnime Logo"
        className={`rounded-full object-cover shadow-sm group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-white dark:group-hover:ring-offset-gray-800 group-hover:ring-blue-500 transition-all duration-300 ${inSidebar ? 'w-11 h-11' : 'w-9 h-9'}`}
        whileHover={{ rotate: [0, 10, -10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.h1 
        className={`font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${inSidebar ? 'text-xl' : 'text-xl md:text-2xl'}`}
      >
        Daunnime
      </motion.h1>
    </Link>
  );

  return (
    <>
      <motion.header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-200 ease-out ${
          isScrolled || isSearchActiveMobile || isMobileMenuOpen
            ? 'shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg'
            : 'bg-transparent shadow-none'
        }`}
        initial={{ y: -80 }} animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className={`transition-opacity duration-200 ${isSearchActiveMobile ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100 translate-x-0'}`}>
              <LogoAndBrand onLinkClick={() => {setIsMobileMenuOpen(false); setIsSearchActiveMobile(false);}} />
            </div>

            <AnimatePresence>
            {isSearchActiveMobile && (
              <motion.div 
                className="absolute inset-0 z-30 px-4 flex items-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
                initial={{ opacity: 0, y: "-20%" }} animate={{ opacity: 1, y: "0%" }}
                exit={{ opacity: 0, y: "-20%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="w-full max-w-md mx-auto">
                    <SearchBar onSearch={handleMobileSearchSubmit} heroStyle={false} autoFocus={true} />
                </div>
                <motion.button whileTap={{scale:0.9}} onClick={toggleMobileSearch} className="p-2 ml-2 text-gray-600 dark:text-gray-300"> <X size={24}/> </motion.button>
              </motion.div>
            )}
            </AnimatePresence>

            <div className="hidden md:flex flex-grow items-center justify-center">
              <nav className="flex items-center space-x-1 bg-gray-100/70 dark:bg-gray-800/70 px-2 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.queryTab ? `${item.path}?tab=${item.queryTab}&page=1` : `${item.path}?page=1`}
                    className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium flex items-center transition-all duration-200 ease-out group
                      ${ isActive(item) ? 'text-white' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400' }`}
                  >
                    {item.icon && <span className="mr-1.5 group-hover:scale-110 transition-transform">{item.icon}</span>}
                    <span>{item.name}</span>
                    {isActive(item) && (
                      <motion.span
                        layoutId="desktop-navbar-indicator"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-full -z-10 shadow-lg"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className={`flex items-center space-x-1.5 sm:space-x-2 ${isSearchActiveMobile ? 'opacity-0 pointer-events-none translate-x-4' : 'opacity-100 translate-x-0'} transition-all duration-200`}>
              <div className="hidden lg:block">
                <SearchBar onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query.trim())}&page=1`)} />
              </div>

              <motion.button
                  whileTap={{ scale: 0.9 }} onClick={toggleMobileSearch}
                  className="p-2.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors lg:hidden"
                  aria-label="Open search"
              > <SearchIconLucide size={21} /> </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, rotate: theme === 'light' ? 20 : -20 }} whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={theme}
                    initial={{ y: -18, opacity: 0, rotate: -45 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 18, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.25, type: 'spring', stiffness: 200, damping: 15 }}
                  > {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />} </motion.div>
                </AnimatePresence>
              </motion.button>

              <div className="md:hidden">
                <motion.button
                  whileTap={{ scale: 0.9 }} onClick={toggleMobileMenu}
                  className="p-2.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors"
                  aria-label="Open menu"
                > <Menu size={23} /> </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="sidebar-overlay" variants={overlayVariants} initial="closed" animate="open" exit="closed"
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="sidebar-content" variants={sidebarVariants} initial="closed" animate="open" exit="closed"
              className="fixed inset-y-0 left-0 z-50 w-4/5 max-w-[280px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col md:hidden border-r border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <LogoAndBrand inSidebar={true} onLinkClick={() => setIsMobileMenuOpen(false)} />
                <motion.button
                  whileTap={{ scale: 0.9, rotate: 180 }} transition={{duration:0.3}}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close menu"
                > <X size={24} /> </motion.button>
              </div>
              
              <div className="p-4 mb-1">
                  <SearchBar onSearch={handleMobileSearchSubmit} autoFocus={false} />
              </div>

              <nav className="flex-grow px-3 pt-2 space-y-1.5 overflow-y-auto pb-4">
                {navItems.map((item, index) => (
                  <motion.div key={item.name} custom={index} variants={navItemVariants} initial="hidden" animate="visible" exit="hidden">
                    <Link
                      to={item.queryTab ? `${item.path}?tab=${item.queryTab}&page=1` : `${item.path}?page=1`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center justify-between px-4 py-3 rounded-xl text-base transition-all duration-200 ease-out
                        ${ isActive(item)
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:pl-5'
                        }`}
                    >
                      <div className="flex items-center">
                        {item.icon && <span className={`mr-3 transition-transform duration-200 group-hover:scale-110 ${isActive(item) ? '' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300'}`}>{item.icon}</span>}
                        <span>{item.name}</span>
                      </div>
                      {isActive(item) && <motion.span layoutId="active-mobile-indicator"><ChevronRight size={20}/></motion.span>}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              
              <div className="mt-auto px-3 py-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                {extraSidebarItems.map((item, index) => (
                   <motion.div key={item.name + "-extra"} custom={index + navItems.length} variants={navItemVariants} initial="hidden" animate="visible" exit="hidden">
                    <Link
                        to={item.action ? '#' : item.path}
                        onClick={() => { if (item.action) item.action(); else setIsMobileMenuOpen(false);}}
                        className="group flex items-center px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        {item.icon && <span className="mr-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300">{item.icon}</span>}
                        <span>{item.name}</span>
                    </Link>
                   </motion.div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;