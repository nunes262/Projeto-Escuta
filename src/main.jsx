// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fontes servidas pelo próprio site (sem Google Fonts: nenhum pedido a terceiros)
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/global.css';
import App from './App';
import { ProvedorPreferencias } from './hooks/usePreferencias';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProvedorPreferencias>
      <App />
    </ProvedorPreferencias>
  </StrictMode>,
);
