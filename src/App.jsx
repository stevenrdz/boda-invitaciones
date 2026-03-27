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
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);

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
          <div className={`invitation-stage ${isEnvelopeOpen ? 'is-open' : ''}`}>
            <div className={`invitation-reveal ${isEnvelopeOpen ? 'is-open' : ''}`} aria-hidden={!isEnvelopeOpen}>
              <div className="invitation-card">
                <div className="invitation-scroll">
                  {isEnvelopeOpen && (
                    <button
                      type="button"
                      className="invitation-close"
                      onClick={() => setIsEnvelopeOpen(false)}
                      aria-label="Cerrar invitación"
                    >
                      Cerrar
                    </button>
                  )}

                  <h1 className="title-accent" style={{ fontSize: '4.2rem', marginTop: '10px' }}>¡Me caso!</h1>

                  <p className="text-body invitation-intro" style={{ margin: '15px auto 0', fontSize: '1.2rem' }}>
                    Steven y yo hemos decidido dar el gran paso...
                  </p>

                  <p className="text-body invitation-guest" style={{ margin: '25px 0' }}>
                    <strong style={{ fontSize: '1.7rem', color: 'var(--color-primary)', fontFamily: 'var(--font-title)' }}>{guestName}</strong>
                  </p>

                  {config?.mostrarEvento !== false && (
                    <div className="event-details text-body">
                      <strong className="event-line" style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>
                        <span aria-hidden="true">📅</span>
                        {config?.fecha || 'Sábado, 1 de Agosto 2026'}
                      </strong>
                      <span className="event-line">
                        <span aria-hidden="true">⛪</span>
                        {config?.lugar || 'Iglesia Católica Santo Tomás Moro'}
                      </span>
                      <span className="event-line">
                        <span aria-hidden="true">🕕</span>
                        {config?.hora || '18:00 hrs'}
                      </span>
                    </div>
                  )}

                  <RSVPForm allowsPartner={allowsPartner} guestId={guestId} guestName={guestName} />
                </div>
              </div>
            </div>

            <div className={`envelope-shell ${isEnvelopeOpen ? 'is-open' : ''}`}>
              <div className="envelope-glow" aria-hidden="true"></div>
              <div className="envelope-back" aria-hidden="true"></div>
              <div className="envelope-flap" aria-hidden="true"></div>
              <div className="envelope-front" aria-hidden="true">
                <span className="envelope-seal">S</span>
              </div>
              {!isEnvelopeOpen && (
                <div className="envelope-message" aria-hidden="true">
                  <strong>Haz clic para abrir la invitación</strong>
                </div>
              )}

              {!isEnvelopeOpen && (
                <button
                  type="button"
                  className="envelope-trigger"
                  onClick={() => setIsEnvelopeOpen(true)}
                  aria-expanded={isEnvelopeOpen}
                  aria-label="Abrir invitación"
                >
                  Abrir invitación
                </button>
              )}
            </div>
          </div>
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
