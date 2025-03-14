import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios';
import './index.css'
import App from './App.tsx'

axios.defaults.baseURL = 'http://localhost:3000';

axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)