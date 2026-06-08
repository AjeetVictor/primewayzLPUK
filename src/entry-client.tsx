import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App, { type InitialAppData } from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __PRIMEWAYZ_INITIAL_DATA__?: InitialAppData;
  }
}

const basePath = import.meta.env.VITE_APP_BASE_PATH || '/';
const routerBase = basePath === '/' ? undefined : basePath;
const rootElement = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter basename={routerBase}>
      <App initialData={window.__PRIMEWAYZ_INITIAL_DATA__ || {}} />
    </BrowserRouter>
  </StrictMode>
);

if (rootElement.childElementCount > 0) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
