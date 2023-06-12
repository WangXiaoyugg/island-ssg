import { createRoot } from 'react-dom/client';
import { App } from './App';

function renderInBrowser() {
    const containerElement = document.getElementById('root');
    if (!containerElement) {
        throw new Error('#root element not found');
    }
    createRoot(containerElement).render(<App />);
}

renderInBrowser();