import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import App from './App.jsx';

function getToken() {
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;

  const cookieToken = document.cookie.split('; ').find((cookie) => cookie.startsWith('token='));

  return cookieToken?.split('=')[1] || null;
}

axios.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password')) {
      return config;
    }

    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
