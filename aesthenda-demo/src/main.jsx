import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Add debugging info
console.log('Aesthenda Demo: Application initializing...');
console.log('Aesthenda Demo: Application loading...');

// Make sure the root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found! Check your index.html file.');
  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error: Root element missing</h1><p>Please check the console for details.</p></div>';
} else {
  console.log('Root element found, rendering application...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
}