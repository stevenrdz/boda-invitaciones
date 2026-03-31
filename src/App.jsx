import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, useSearchParams } from 'react-router-dom';
import RSVPForm from './components/RSVPForm';
import collageBackground from '../collage.png';
import './index.css';

const DEFAULT_BACKGROUND_URL = collageBackground;

function InvitationContent() {
  const [searchParams] = useSearchParams();
  const guestId = searchParams.get('id');
  const MotionDiv = motion.div;

  const [guestName, setGuestName] = useState('Nuestra Invitada Especial');
  const [allowsPartner, setAllowsPartner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BACKGROUND_URL);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const preloadImage = url => new Promise(resolve => {
      const img = new Image();
      img.src = url;
      img.onload = resolve;
      img.onerror = resolve;
    });

    async function fetchGuest() {
      setLoading(true);

      if (!guestId) {
        setGuestName('Nuestra Invitada Especial');
        setConfig(null);
        setBackgroundUrl(DEFAULT_BACKGROUND_URL);
        setTimeout(() => {
          if (isActive) setLoading(false);
        }, 1000);
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
          const nextConfig = data.config || null;
          const nextBackgroundUrl = DEFAULT_BACKGROUND_URL;

          await preloadImage(nextBackgroundUrl);
          if (!isActive) return;

          setConfig(nextConfig);
          setBackgroundUrl(nextBackgroundUrl);
        } else {
          setGuestName(guestId.charAt(0).toUpperCase() + guestId.slice(1));
          setConfig(null);
          setBackgroundUrl(DEFAULT_BACKGROUND_URL);
        }
      } catch (e) {
        console.error(e);
        setGuestName(guestId.charAt(0).toUpperCase() + guestId.slice(1));
        setConfig(null);
        setBackgroundUrl(DEFAULT_BACKGROUND_URL);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    fetchGuest();

    return () => {
      isActive = false;
    };
  }, [guestId]);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <MotionDiv
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
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Siempre cargado en el DOM, pero detrás del loader hasta que esté listo */}
      <div
        className="background-image"
        style={{ backgroundImage: `url('${backgroundUrl}')` }}
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

                  <p className="text-body invitation-lead" style={{ margin: '18px auto 0', fontSize: '1.18rem' }}>
                    <strong>Una nueva etapa est&#225; por comenzar</strong>
                  </p>

                  <p className="text-body invitation-intro" style={{ margin: '12px auto 0', fontSize: '1.15rem' }}>
                    Despu&#233;s de tantas historias, sue&#241;os y momentos compartidos, Steven y yo hemos decidido unir nuestras vidas para siempre.
                  </p>

                  {config?.mostrarEvento !== false && (
                    <>
                      <p className="text-body invitation-note" style={{ margin: '26px auto 0', fontSize: '1.08rem' }}>
                        <strong>&#161;El d&#237;a especial est&#225; cada vez m&#225;s cerca!</strong>
                      </p>

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
                    </>
                  )}

                  <p className="text-body invitation-guest" style={{ margin: '24px 0 0' }}>
                    <strong style={{ fontSize: '1.7rem', color: 'var(--color-primary)', fontFamily: 'var(--font-title)' }}>{guestName}</strong>
                  </p>

                  <RSVPForm allowsPartner={allowsPartner} guestId={guestId} />
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
