import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, useSearchParams } from 'react-router-dom';
import RSVPForm from './components/RSVPForm';
import './index.css';

function InvitationContent() {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');

  const [guestName, setGuestName] = useState('Nuestra Invitada Especial');
  const [allowsPartner, setAllowsPartner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    async function fetchGuest() {
      if (!guestId) {
        setGuestName('Nuestra Invitada Especial');
        setTimeout(() => setLoading(false), 1000); // Simulamos carga si no hay ID
        return;
      }
      try {
        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
        const res = await fetch(`${scriptUrl}?id=${guestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setGuestName(data.name);
          setAllowsPartner(data.allowsPartner);
          if (data.config) {
            setConfig(data.config);
            if (data.config.fondoUrl) {
              const img = new Image();
              img.src = data.config.fondoUrl.trim();
              await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
              });
            }
          }
        } else {
          setGuestName(guestId.charAt(0).toUpperCase() + guestId.slice(1));
        }
      } catch (e) {
        console.error(e);
        setGuestName(guestId.charAt(0).toUpperCase() + guestId.slice(1));
      } finally {
        setLoading(false);
      }
    }
    fetchGuest();
  }, [guestId]);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="fullscreen-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              backgroundColor: '#f5f5f5', zIndex: 9999, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <span className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--color-primary)' }}></span>
            <p className="text-body" style={{ marginTop: '20px', color: 'var(--color-text-main)', fontSize: '1.2rem' }}>
              Abriendo invitación...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Siempre cargado en el DOM, pero detrás del loader hasta que esté listo */}
      <div
        className="background-image"
        style={config?.fondoUrl ? { backgroundImage: `url('${config.fondoUrl}')` } : {}}
      ></div>

      {!loading && (
        <div className="content-wrapper">
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <h1 className="title-accent" style={{ fontSize: '4.2rem', marginTop: '10px' }}>¡Me caso!</h1>

            <p className="text-body" style={{ margin: '15px 0', fontSize: '1.2rem' }}>
              Steven y yo hemos decidido dar el gran paso...<br />
            </p>

            <p className="text-body" style={{ margin: '25px 0' }}>
              <strong style={{ fontSize: '1.7rem', color: 'var(--color-primary)', fontFamily: 'var(--font-title)' }}>{guestName}</strong>
            </p>

            {config?.mostrarEvento !== false && (
              <div className="text-body" style={{ margin: '25px 0', borderTop: '1px solid rgba(155,89,182,0.2)', borderBottom: '1px solid rgba(155,89,182,0.2)', padding: '20px 0' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{config?.fecha || 'Sábado, 1 de Agosto 2026'}</strong><br />
                <span style={{ display: 'block', margin: '8px 0' }}>{config?.lugar || 'Iglesia Católica Santo Tomás Moro'}</span>
                {config?.hora || '18:00 hrs'}
              </div>
            )}

            <RSVPForm allowsPartner={allowsPartner} guestId={guestId} guestName={guestName} />
          </motion.div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <InvitationContent />
    </Router>
  );
}

export default App;
