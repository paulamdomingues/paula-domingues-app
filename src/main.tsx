import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationsProvider } from './context/NotificationsContext';
import './index.css';

// PWA "instalável" (21/08/2026) — registra o service worker mínimo em
// `public/sw.js`, que é um dos requisitos do Chrome/Android pra oferecer o
// botão "Instalar aplicativo" (ver comentário no próprio arquivo pra
// entender por que ele não faz cache de nada de propósito).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Falha em registrar não deve quebrar o app — só significa que o
      // site continua funcionando normal, sem a opção de "instalar".
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <NotificationsProvider>
            <App />
          </NotificationsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
