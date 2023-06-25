import { createRoot } from 'react-dom/client';
import { App } from './App';
import { BrowserRouter } from 'react-router-dom';
import { initPageData } from './App';
import { DataContext } from './hooks';
import { HelmetProvider } from 'react-helmet-async';

async function renderInBrowser() {
  const containerElement = document.getElementById('root');
  if (!containerElement) {
    throw new Error('#root element not found');
  }
  const pageData = await initPageData(location.pathname);
  createRoot(containerElement).render(
    <HelmetProvider>
      <DataContext.Provider value={pageData}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DataContext.Provider>
    </HelmetProvider>
  );
}

renderInBrowser();
