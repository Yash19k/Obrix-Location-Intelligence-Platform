import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { AppRouter } from './router/index.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global toast notifications */}
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '14px',
          borderRadius: '12px',
        },
        success: { iconTheme: { primary: '#34d399', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#f87171', secondary: '#fff' } },
      }}
    />
    <AppRouter />
  </React.StrictMode>,
)
