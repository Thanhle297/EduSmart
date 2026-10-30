import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import { DemoProvider } from './app/providers'
import { router } from './app/router'
import { Notices } from './components/shared/ui'
import './styles/globals.css'
import './styles/typography.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoProvider>
      <RouterProvider router={router} />
      <Notices />
    </DemoProvider>
  </StrictMode>,
)
