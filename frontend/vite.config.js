// ==============================================================================
// Smart UPI Fraud Detection System
// Vite Build & Development Server Configuration
//
// WHAT IS VITE?
// ------------------------------------------------------------------------------
// Vite is a lightning-fast modern frontend build tool.
// 1. In Development (`npm run dev`):
//    - Serves your React files via native ES Modules instantly without bundling.
//    - Provides Hot Module Replacement (HMR) — edits appear in the browser in milliseconds!
// 2. In Production (`npm run build`):
//    - Compiles and minifies JavaScript, JSX, and CSS into the `frontend/dist/` folder.
//    - The `dist/` directory is what Vercel or any static web host serves to users.
//
// HOW VERCEL DEPLOYMENT WORKS WITH VITE:
// ------------------------------------------------------------------------------
// - Build Command: `cd frontend && npm install && npm run build`
// - Output Directory: `frontend/dist`
// - SPA Rewrites: Configured in root `vercel.json` so React Router paths work on reload.
// ==============================================================================
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Enables Fast Refresh and JSX transformation for React
    react(),
  ],
  server: {
    port: 5173,       // Local development port: http://localhost:5173
    open: false,      // Do not auto-open external browser window on launch
  },
})
