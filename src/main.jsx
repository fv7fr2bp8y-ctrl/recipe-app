import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { captureAttribution } from './attribution.js'
import { inject } from '@vercel/analytics'

captureAttribution()
// Vercel Web Analytics: page views without cookies, so it needs no consent banner.
inject()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
