import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const basePath = import.meta.env.VITE_APP_BASE_PATH || '/';
const routerBase = basePath === '/' ? undefined : basePath;

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <BrowserRouter basename={routerBase}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
