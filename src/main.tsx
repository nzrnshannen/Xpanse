import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to catch white screen issues
window.addEventListener('error', (e) => {
  document.body.innerHTML += `<div style="position:fixed;top:0;left:0;z-index:9999;background:red;color:white;padding:20px;">${e.message}<br/>${e.filename}:${e.lineno}</div>`;
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
