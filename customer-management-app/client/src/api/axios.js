import axios from 'axios';

const api = axios.create({
  baseURL: 'https://qwipo-backend-eyfo.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;
