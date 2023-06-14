import { createRoot } from 'react-dom/client';
import { App } from './App';
import siteData from 'island:site-data';

function renderInBrowser() {
  console.log(siteData);
  const containerElement = document.getElementById('root');
  if (!containerElement) {
    throw new Error('#root element not found');
  }
  createRoot(containerElement).render(<App />);
}

renderInBrowser();
