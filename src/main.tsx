import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
import '@fontsource/geist-sans/700.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import './index.css'
import App from './App'
import { loadFonts } from './lib/fonts'
import { ToastProvider } from './ui/Toast'
import { FluidProvider } from '@/lib/fluid-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

// Text is measured on canvas for wrapping, so fonts must be ready first.
// The editor is one dense region: the compact (28px) step applies everywhere.
loadFonts().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <FluidProvider size="compact">
        <TooltipProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </TooltipProvider>
      </FluidProvider>
    </StrictMode>,
  )
})
