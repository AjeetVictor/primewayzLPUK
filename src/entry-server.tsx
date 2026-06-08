import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App, { type InitialAppData } from './App.tsx';
import './index.css';

export function render(url: string, basePath = '/', initialData: InitialAppData = {}) {
  const cleanBase = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  const pathForRouter =
    cleanBase && url.startsWith(cleanBase)
      ? url.slice(cleanBase.length) || '/'
      : url || '/';

  const html = renderToString(
    <StrictMode>
      <MemoryRouter initialEntries={[pathForRouter]}>
        <App initialData={initialData} />
      </MemoryRouter>
    </StrictMode>,
  );

  return { html };
}
