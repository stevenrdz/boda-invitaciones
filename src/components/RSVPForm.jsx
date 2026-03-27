import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RSVPForm({ allowsPartner, guestId, guestName, onConfirm }) {
    // steps: 'question' -> 'partner' -> 'partner_form' -> 'submitting' -> 'success_yes' / 'success_no'
    const [step, setStep] = useState('question');
    const [hasPartner, setHasPartner] = useState(null); // 'yes' | 'no'
    const [partnerDetails, setPartnerDetails] = useState({ name: '', lastname: '', phone: '' });
    const [errorMsg, setErrorMsg] = useState('');

    const submitToGoogle = async (isDama, partnerData) => {
        setStep('submitting');
        setErrorMsg('');
        const requestData = {
            guestId,
            attending: isDama,
            hasPartner: partnerData && partnerData.hasPartner === 'yes',
            partnerName: partnerData && partnerData.hasPartner === 'yes' ? partnerData.name : '',
            partnerLastname: partnerData && partnerData.hasPartner === 'yes' ? partnerData.lastname : '',
            partnerPhone: partnerData && partnerData.hasPartner === 'yes' ? partnerData.phone : ''
        };

        try {
            const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
            if (!scriptUrl) {
                throw new Error('Script URL is missing');
            }
            const res = await fetch(scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(requestData)
            });
            if (!res.ok) throw new Error('Error al guardar datos');

            setStep(isDama ? 'success_yes' : 'success_no');
            if (onConfirm) onConfirm();
        } catch (error) {
            console.error(error);
            setErrorMsg('Ocurrió un error guardando tus respuestas. Por favor reintenta.');
            setStep(isDama ? (partnerData?.hasPartner === 'yes' ? 'partner_form' : 'partner') : 'question');
        }
    };

    const handleDecline = () => {
        submitToGoogle(false, null);
    };

    const handleAccept = () => {
        if (allowsPartner) {
            setStep('partner');
        } else {
            submitToGoogle(true, { hasPartner: 'no' });
        }
    };

    const handlePartnerSelect = (choice) => {
        setHasPartner(choice);
        if (choice === 'no') {
            submitToGoogle(true, { hasPartner: 'no' });
        } else {
            setStep('partner_form');
        }
    };

    const submitPartnerForm = (e) => {
        e.preventDefault();
        submitToGoogle(true, { hasPartner: 'yes', ...partnerDetails });
    };

    return (
        <div className="step-container">
            {errorMsg && <div className="error-text" style={{ marginBottom: 15 }}>{errorMsg}</div>}

            <AnimatePresence mode="wait">
                {step === 'question' && (
                    <motion.div
                        key="question"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%' }}
                    >
                        <p className="text-body" style={{ fontSize: '1.15rem', marginBottom: '30px' }}>
                            Eres muy especial para mí y no imagino este día sin ti a mi lado...
                        </p>
                        <h3 className="title-main" style={{ fontSize: '1.6rem', marginBottom: '25px', color: 'var(--color-primary)' }}>
                            ¿Aceptas ser mi Dama de Honor?
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <button onClick={handleAccept} className="btn-primary">
                                ¡Sí, acepto encantada!
                            </button>
                            <button onClick={handleDecline} className="btn-secondary">
                                Lamentablemente no podré
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'partner' && (
                    <motion.div
                        key="partner"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%' }}
                    >
                        <p className="text-body" style={{ fontSize: '1.15rem', marginBottom: '25px' }}>
                            ¡Qué gran emoción! Ahora para organizar la logística...
                        </p>
                        <h3 className="title-main" style={{ fontSize: '1.4rem', marginBottom: '25px', color: 'var(--color-primary)' }}>
                            ¿Asistirás a la boda con un acompañante?
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => handlePartnerSelect('yes')} className="btn-primary">
                                Sí, iré acompañada
                            </button>
                            <button onClick={() => handlePartnerSelect('no')} className="btn-secondary">
                                Iré sola a disfrutar
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'partner_form' && (
                    <motion.form
                        key="partner_form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%' }}
                        onSubmit={submitPartnerForm}
                    >
                        <h3 className="title-main" style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--color-primary)' }}>
                            Datos de tu acompañante
                        </h3>
                        <div className="form-group">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ej. Juan"
                                required
                                value={partnerDetails.name}
                                onChange={(e) => setPartnerDetails({ ...partnerDetails, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Apellidos</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ej. Pérez"
                                required
                                value={partnerDetails.lastname}
                                onChange={(e) => setPartnerDetails({ ...partnerDetails, lastname: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Teléfono Celular (Para logística)</label>
                            <input
                                type="tel"
                                className="form-input"
                                inputMode="tel"
                                placeholder="Ej. 099 123 4567"
                                required
                                value={partnerDetails.phone}
                                onChange={(e) => setPartnerDetails({ ...partnerDetails, phone: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                            Completar Registro
                        </button>
                    </motion.form>
                )}

                {step === 'submitting' && (
                    <motion.div
                        key="submitting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ padding: '40px 0' }}
                    >
                        <span className="spinner"></span>
                        <p className="text-body" style={{ marginTop: '20px' }}>Guardando tu respuesta...</p>
                    </motion.div>
                )}

                {step === 'success_yes' && (
                    <motion.div
                        key="success_yes"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3 className="title-main" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>
                            ¡Todo listo! ✨
                        </h3>
                        <p className="text-body" style={{ fontSize: '1.15rem' }}>
                            ¡Prepárate para vivir juntas el mejor día de mi vida! Gracias por aceptar ser mi Dama de Honor.
                        </p>
                    </motion.div>
                )}

                {step === 'success_no' && (
                    <motion.div
                        key="success_no"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3 className="title-main" style={{ color: 'var(--color-primary)', fontSize: '1.8rem' }}>
                            ¡Gracias por avisarme!
                        </h3>
                        <p className="text-body" style={{ fontSize: '1.15rem' }}>
                            Lo entiendo perfectamente. Aún así me encantará verte en la boda para celebrar a lo grande.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
