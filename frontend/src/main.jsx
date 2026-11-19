// ==============================================================================
// Smart UPI Fraud Detection System
// Application Entry Point (React 18 / 19 DOM Root)
//
// WHAT HAPPENS HERE:
// ------------------------------------------------------------------------------
// 1. `document.getElementById('root')`: Attaches the React app into `index.html`.
// 2. `<BrowserRouter>`: Enables client-side URL routing via the HTML5 History API.
// 3. `<AppProvider>`: Wraps the entire application with global state (AppContext).
// 4. `<App />`: The root component containing all routes and protected pages.
// ==============================================================================
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
