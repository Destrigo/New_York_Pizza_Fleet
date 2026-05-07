import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { I18nProvider } from '@/context/I18nContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
