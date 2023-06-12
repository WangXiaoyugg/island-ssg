"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const App_1 = require("./App");
function renderInBrowser() {
    const containerElement = document.getElementById('root');
    if (!containerElement) {
        throw new Error('#root element not found');
    }
    (0, react_1.createRoot)(containerElement).render(<App_1.App />);
}
renderInBrowser();
