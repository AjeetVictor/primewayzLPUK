import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const basePath = import.meta.env.VITE_APP_BASE_PATH || '/';
const routerBase = basePath === '/' ? undefined : basePath;
const rootElement = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter basename={routerBase}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

if (rootElement.innerHTML.trim()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
