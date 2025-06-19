import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { DataProvider } from './contexts/DataContext.tsx';
import { FirebaseProvider } from './contexts/FirebaseContext.tsx';

// Importação essencial para o mapa funcionar
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')!).render(
  // StrictMode foi removido para compatibilidade com a biblioteca de "arrastar e soltar"
  <ThemeProvider>
    <FirebaseProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </FirebaseProvider>
  </ThemeProvider>
);