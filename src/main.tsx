import { Buffer } from 'buffer'

// officecrypto-tool (used to decrypt password-protected bank Excel exports)
// relies on Node's global Buffer, which doesn't exist in real browsers.
// Polyfill it before any component code can trigger a decrypt.
if (typeof (globalThis as { Buffer?: unknown }).Buffer === 'undefined') {
  ;(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@seed-design/css/base.css'
import './theme.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
