import React, { useState, useEffect } from 'react';

const DemoBanner = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Empezar a desvanecer a los 4 segundos
    const fadeTimer = setTimeout(() => setFading(true), 4000);
    // Ocultar completamente a los 5 segundos
    const hideTimer = setTimeout(() => setVisible(false), 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#1A1A1A',
        color: '#A8D5BA',
        textAlign: 'center',
        padding: '12px 24px',
        fontSize: '14px',
        fontFamily: 'Public Sans, sans-serif',
        fontWeight: 500,
        letterSpacing: '0.02em',
        transition: 'opacity 1s ease',
        opacity: fading ? 0 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}
    >
      <span style={{ fontSize: '16px' }}>⚡</span>
      This is a demonstration — it may be somewhat slower than the final product.
      <span style={{ fontSize: '16px' }}>⚡</span>
    </div>
  );
};

export default DemoBanner;
