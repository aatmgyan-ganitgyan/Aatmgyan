import axios from 'axios';

const API = axios.create({
  baseURL: 'https://aatmgyan-production.up.railway.app/api',
});

// Har request mein token automatically add hoga
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;