// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; //
import { ThemeProvider } from './context/ThemeContext.jsx'; //
// import { HelmetProvider } from 'react-helmet-async'; // Dihapus

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <HelmetProvider> */} {/* Dihapus */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    {/* </HelmetProvider> */} {/* Dihapus */}
  </React.StrictMode>
);