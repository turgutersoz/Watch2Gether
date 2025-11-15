import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initDB, clearOldCache } from './utils/indexedDB';

// IndexedDB'yi başlat ve eski cache'i temizle
initDB().then(() => {
  // Uygulama başladığında eski cache'i temizle (arka planda)
  clearOldCache();
}).catch((error) => {
  console.warn('IndexedDB başlatılamadı:', error);
});

// Chrome extension hatalarını filtrele
window.addEventListener('error', (event) => {
  // Chrome extension kaynaklı hataları filtrele
  if (
    event.message?.includes('message channel closed') ||
    event.message?.includes('asynchronous response') ||
    event.filename?.includes('chrome-extension://') ||
    event.filename?.includes('moz-extension://')
  ) {
    event.preventDefault();
    return false;
  }
});

// Unhandled promise rejection'ları filtrele
window.addEventListener('unhandledrejection', (event) => {
  // Chrome extension kaynaklı promise rejection'ları filtrele
  if (
    event.reason?.message?.includes('message channel closed') ||
    event.reason?.message?.includes('asynchronous response') ||
    event.reason?.stack?.includes('chrome-extension://') ||
    event.reason?.stack?.includes('moz-extension://')
  ) {
    event.preventDefault();
    return false;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

