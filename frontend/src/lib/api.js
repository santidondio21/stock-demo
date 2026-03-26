import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Instancia de axios que agrega session_id automáticamente a cada request
const api = axios.create({ baseURL: `${BACKEND_URL}/api` });

api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('dino_demo_session');
  if (sessionId) {
    config.params = { ...config.params, session_id: sessionId };
  }
  return config;
});

export default api;
