import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// If you use React Router:
// import { BrowserRouter } from 'react-router-dom'

// If you use any global context:
// import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap App with providers if needed */}
    {/* <BrowserRouter> */}
    {/* <AuthProvider> */}
      <App />
    {/* </AuthProvider> */}
    {/* </BrowserRouter> */}
  </React.StrictMode>
)
