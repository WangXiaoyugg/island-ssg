"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const client_1 = require("react-dom/client");
const App_1 = require("./App");
function renderInBrowser() {
    const containerElement = document.getElementById('root');
    if (!containerElement) {
        throw new Error('#root element not found');
    }
    (0, client_1.createRoot)(containerElement).render((0, jsx_runtime_1.jsx)(App_1.App, {}));
}
renderInBrowser();