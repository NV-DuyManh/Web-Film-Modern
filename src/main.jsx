import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import CategoryProvider from './contexts/CategoryProvider.jsx'
import CategoryTypeProvider from './contexts/CategoryTypeProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CategoryProvider>
        <CategoryTypeProvider>
          <App />
        </CategoryTypeProvider>
      </CategoryProvider>
    </BrowserRouter>
  </StrictMode>,
)
