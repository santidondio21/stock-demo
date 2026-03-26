import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SessionContext = createContext(null);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const generateSessionId = () => `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const SessionProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      let sid = localStorage.getItem('dino_demo_session');
      if (!sid) {
        sid = generateSessionId();
        localStorage.setItem('dino_demo_session', sid);
      }
      try {
        await axios.post(`${API}/session/init?session_id=${sid}`);
      } catch (e) {
        console.error('Session init failed', e);
      }
      setSessionId(sid);
      setReady(true);
    };
    init();
  }, []);

  return (
    <SessionContext.Provider value={{ sessionId, ready }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
