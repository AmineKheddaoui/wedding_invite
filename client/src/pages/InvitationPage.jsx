import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, Check, X } from 'lucide-react';

// En dev, utilise le proxy Vite (/api); en prod, utilise l'URL complète si définie
const API_URL = import.meta.env.VITE_API_URL || '';

export default function InvitationPage() {
  const [eventInfo, setEventInfo] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    attending: null,
    plusOneCount: 0,
    plusOneNames: [],
    dietaryRestrictions: [],
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Charger les infos de l'événement
    axios.get(`${API_URL}/api/event`)
      .then(res => setEventInfo(res.data))
      .catch(err => console.error('Erreur chargement événement:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.attending === null) {
      setError('Veuillez indiquer si vous serez présent(e)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Adapter les données pour l'API
      const payload = {
        ...formData,
        plusOne: formData.plusOneCount > 0,
        plusOneName: formData.plusOneNames.filter(n => n.trim()).join(', ') || null,
        dietaryRestrictions: formData.dietaryRestrictions.length > 0 
          ? formData.dietaryRestrictions.join(', ') 
          : null
      };
      delete payload.plusOneCount;
      delete payload.plusOneNames;
      
      await axios.post(`${API_URL}/api/rsvp`, payload);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!eventInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Heart size={48} color="#c9a96e" />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      {/* Header élégant */}
      <header style={{ 
        textAlign: 'center', 
        padding: '4rem 1rem 2rem',
        background: 'linear-gradient(180deg, rgba(201,169,110,0.1) 0%, transparent 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p style={{ 
            fontFamily: 'var(--font-sans)', 
            textTransform: 'uppercase', 
            letterSpacing: '4px',
            fontSize: '0.8rem',
            color: 'var(--color-gold)',
            marginBottom: '1rem'
          }}>
            Vous êtes invité(e)
          </p>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontWeight: 700,
            margin: '0 0 1rem',
            lineHeight: 1.1
          }}>
            {eventInfo.event_title}
          </h1>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '2rem', 
            flexWrap: 'wrap',
            marginTop: '2rem',
            color: 'var(--color-text)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--color-gold)" />
              <span>{new Date(eventInfo.event_date).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--color-gold)" />
              <span>{eventInfo.event_location}</span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Contenu principal */}
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="card"
            >
              <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem' }}>
                Confirmez votre présence
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Prénom *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="input-group">
                    <label>Nom *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Email (optionnel)</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="votre@email.com"
                  />
                </div>

                <div className="input-group">
                  <label>Serez-vous présent(e) ? *</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleChange('attending', true)}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        border: `2px solid ${formData.attending === true ? 'var(--color-success)' : '#e0ddd8'}`,
                        background: formData.attending === true ? 'var(--color-success)' : 'white',
                        color: formData.attending === true ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Check size={20} />
                      Oui, je serai là
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('attending', false)}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        border: `2px solid ${formData.attending === false ? 'var(--color-error)' : '#e0ddd8'}`,
                        background: formData.attending === false ? 'var(--color-error)' : 'white',
                        color: formData.attending === false ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <X size={20} />
                      Non, hélas
                    </button>
                  </div>
                </div>

                {formData.attending === true && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ 
                      background: 'rgba(201, 169, 110, 0.08)', 
                      padding: '1.5rem', 
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      border: '1px solid rgba(201, 169, 110, 0.2)'
                    }}
                  >
                    <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      👥 Accompagnants
                    </h4>

                    {/* Toggle */}
                    <div className="input-group">
                      <label>Venez-vous accompagné(e) ?</label>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, plusOneCount: 0, plusOneNames: [] }))}
                          style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            border: `2px solid ${formData.plusOneCount === 0 ? 'var(--color-dark)' : '#e0ddd8'}`,
                            background: formData.plusOneCount === 0 ? 'var(--color-dark)' : 'white',
                            color: formData.plusOneCount === 0 ? 'white' : 'var(--color-text)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Non, je viens seul(e)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            plusOneCount: prev.plusOneCount || 1, 
                            plusOneNames: prev.plusOneCount > 0 ? prev.plusOneNames : [''] 
                          }))}
                          style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            border: `2px solid ${formData.plusOneCount > 0 ? 'var(--color-gold)' : '#e0ddd8'}`,
                            background: formData.plusOneCount > 0 ? 'var(--color-gold)' : 'white',
                            color: formData.plusOneCount > 0 ? 'white' : 'var(--color-text)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Oui, je viens accompagné(e)
                        </button>
                      </div>
                    </div>

                    {/* Section nombre + noms qui s'ouvre */}
                    <AnimatePresence>
                      {formData.plusOneCount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label>Combien de personnes vous accompagnent ?</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCount = Math.max(1, formData.plusOneCount - 1);
                                  setFormData(prev => ({
                                    ...prev,
                                    plusOneCount: newCount,
                                    plusOneNames: prev.plusOneNames.slice(0, newCount)
                                  }));
                                }}
                                style={{
                                  width: '40px', height: '40px',
                                  border: '1px solid #e0ddd8', background: 'white',
                                  fontSize: '1.2rem', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >−</button>
                              <span style={{ fontSize: '1.5rem', fontWeight: 700, minWidth: '2rem', textAlign: 'center', color: 'var(--color-dark)' }}>
                                {formData.plusOneCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCount = Math.min(10, formData.plusOneCount + 1);
                                  setFormData(prev => ({
                                    ...prev,
                                    plusOneCount: newCount,
                                    plusOneNames: [...prev.plusOneNames, ...Array(newCount - prev.plusOneNames.length).fill('')]
                                  }));
                                }}
                                style={{
                                  width: '40px', height: '40px',
                                  border: '1px solid var(--color-gold)', background: 'var(--color-gold)',
                                  color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >+</button>
                            </div>
                          </div>

                          {formData.plusOneNames.map((name, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="input-group"
                              style={{ marginBottom: index < formData.plusOneNames.length - 1 ? '1rem' : 0 }}
                            >
                              <label>Nom de l'accompagnant {index + 1}</label>
                              <input 
                                type="text" 
                                value={name}
                                onChange={(e) => {
                                  const newNames = [...formData.plusOneNames];
                                  newNames[index] = e.target.value;
                                  setFormData(prev => ({ ...prev, plusOneNames: newNames }));
                                }}
                                placeholder="Prénom et nom"
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {formData.attending === true && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ 
                      background: 'rgba(201, 169, 110, 0.08)', 
                      padding: '1.5rem', 
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      border: '1px solid rgba(201, 169, 110, 0.2)'
                    }}
                  >
                    <h4 style={{ 
                      margin: '0 0 1rem', 
                      fontSize: '1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem' 
                    }}>
                      🍽️ Préférences alimentaires
                    </h4>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>Sélectionnez vos restrictions (plusieurs choix possibles)</label>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        {[
                          { value: 'vegetarien', label: '🥬 Végétarien' },
                          { value: 'vegan', label: '🌱 Vegan' },
                          { value: 'sans-gluten', label: '🌾 Sans gluten' },
                          { value: 'sans-lactose', label: '🥛 Sans lactose' },
                          { value: 'halal', label: '☪️ Halal' },
                          { value: 'kosher', label: '✡️ Casher' },
                          { value: 'autre', label: '📝 Autre' },
                        ].map((option) => {
                          const isSelected = formData.dietaryRestrictions.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  dietaryRestrictions: isSelected
                                    ? prev.dietaryRestrictions.filter(r => r !== option.value)
                                    : [...prev.dietaryRestrictions, option.value]
                                }));
                              }}
                              style={{
                                padding: '0.6rem 0.75rem',
                                border: `2px solid ${isSelected ? 'var(--color-gold)' : '#e0ddd8'}`,
                                background: isSelected ? 'rgba(201, 169, 110, 0.15)' : 'white',
                                color: isSelected ? 'var(--color-dark)' : 'var(--color-text)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.85rem',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                fontWeight: isSelected ? 600 : 400
                              }}
                            >
                              {isSelected ? '✓ ' : ''}{option.label}
                            </button>
                          );
                        })}
                      </div>
                      {formData.dietaryRestrictions.length === 0 && (
                        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem', fontStyle: 'italic' }}>
                          ✨ Aucune restriction sélectionnée
                        </p>
                      )}
                      {formData.dietaryRestrictions.includes('autre') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          style={{ marginTop: '0.75rem' }}
                        >
                          <label style={{ fontSize: '0.8rem' }}>Précisez votre restriction</label>
                          <input 
                            type="text" 
                            placeholder="Ex: allergie aux fruits à coque..."
                            style={{ marginTop: '0.25rem' }}
                          />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                <div className="input-group">
                  <label>Un petit mot ? (optionnel)</label>
                  <textarea 
                    rows="3"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Laissez-nous un message..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: 'var(--color-error)', textAlign: 'center', marginBottom: '1rem' }}
                  >
                    {error}
                  </motion.p>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer ma réponse'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="card"
              style={{ textAlign: 'center', padding: '4rem 2rem' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                {formData.attending ? (
                  <Heart size={80} color="var(--color-gold)" fill="var(--color-gold)" />
                ) : (
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💌</div>
                )}
              </motion.div>
              
              <h2 style={{ marginTop: '1.5rem', fontSize: '2rem' }}>
                {formData.attending ? 'Merci !' : 'Message bien reçu'}
              </h2>
              <p style={{ marginTop: '1rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                {formData.attending 
                  ? `Nous avons hâte de vous retrouver ${formData.plusOneCount > 0 ? `avec vos ${formData.plusOneCount} accompagnant(s)` : ''} !`
                  : 'Nous regrettons que vous ne puissiez pas être parmi nous.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer discret */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        fontSize: '0.8rem', 
        color: '#999',
        borderTop: '1px solid rgba(201,169,110,0.2)'
      }}>
        <p>Faire-part numérique • Réponse automatique</p>
      </footer>
    </div>
  );
}
