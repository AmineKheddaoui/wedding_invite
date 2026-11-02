import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Clock, UserPlus, LogOut, Trash2, Download, ChevronDown, ChevronUp } from 'lucide-react';

// En dev, utilise le proxy Vite (/api); en prod, utilise l'URL complète si définie
const API_URL = import.meta.env.VITE_API_URL || '';

export default function DashboardPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, attending, declining, pending
  const [expandedGuests, setExpandedGuests] = useState({});

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Test d'authentification en récupérant les stats
      await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { 'x-admin-password': password }
      });
      setIsAuthenticated(true);
      setError('');
      fetchData(password);
    } catch (err) {
      setError('Mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (pwd) => {
    try {
      const [statsRes, guestsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, {
          headers: { 'x-admin-password': pwd || password }
        }),
        axios.get(`${API_URL}/api/admin/guests`, {
          headers: { 'x-admin-password': pwd || password }
        })
      ]);
      setStats(statsRes.data);
      setGuests(guestsRes.data);
    } catch (err) {
      console.error('Erreur fetch:', err);
    }
  };

  const deleteGuest = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet invité ?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/guests/${id}`, {
        headers: { 'x-admin-password': password }
      });
      fetchData();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const exportCSV = () => {
    const headers = ['Prénom', 'Nom', 'Email', 'Statut', '+1', 'Nom +1', 'Restrictions alimentaires', 'Message', 'Date réponse'];
    const rows = guests.map(g => [
      g.first_name,
      g.last_name,
      g.email || '',
      g.attending === 1 ? 'Présent' : g.attending === 2 ? 'Absent' : 'En attente',
      g.plus_one ? 'Oui' : 'Non',
      g.plus_one_name || '',
      g.dietary_restrictions ? g.dietary_restrictions.replace(/-/g, ' ') : '',
      g.message || '',
      new Date(g.updated_at).toLocaleString('fr-FR')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invites_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredGuests = guests.filter(g => {
    if (filter === 'all') return true;
    if (filter === 'attending') return g.attending === 1;
    if (filter === 'declining') return g.attending === 2;
    if (filter === 'pending') return g.attending === 0;
    return true;
  });

  // Écran de connexion
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--color-cream)'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}
        >
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Accès Dashboard</h2>
          <form onSubmit={login}>
            <div className="input-group">
              <label>Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe admin"
                autoFocus
              />
            </div>
            {error && <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-cream)', padding: '2rem' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Dashboard RSVP</h1>
          <p style={{ color: '#999', marginTop: '0.5rem' }}>Gestion des invités</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </header>

      {/* Statistiques */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <StatCard 
            icon={<Users size={24} />} 
            label="Total Réponses" 
            value={stats.total} 
            color="#6b7280"
          />
          <StatCard 
            icon={<CheckCircle size={24} />} 
            label="Présents" 
            value={stats.attending} 
            subtext={`+ ${stats.plusOnes} accompagnants`}
            color="var(--color-success)"
          />
          <StatCard 
            icon={<XCircle size={24} />} 
            label="Absents" 
            value={stats.declining} 
            color="var(--color-error)"
          />
          <StatCard 
            icon={<Clock size={24} />} 
            label="En attente" 
            value={stats.pending} 
            color="#f59e0b"
          />
          <StatCard 
            icon={<UserPlus size={24} />} 
            label="Total Attendus" 
            value={stats.totalAttendees} 
            color="var(--color-gold)"
            highlight
          />
        </div>
      )}

      {/* Filtres et liste */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h3>Liste des invités ({filteredGuests.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'attending', 'declining', 'pending'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e0ddd8',
                  background: filter === f ? 'var(--color-gold)' : 'white',
                  color: filter === f ? 'white' : 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  textTransform: 'capitalize'
                }}
              >
                {f === 'all' ? 'Tous' : f === 'attending' ? 'Présents' : f === 'declining' ? 'Absents' : 'En attente'}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau responsive */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0ddd8', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Invité</th>
                <th style={{ padding: '0.75rem' }}>Statut</th>
                <th style={{ padding: '0.75rem' }}>+1</th>
                <th style={{ padding: '0.75rem' }}>Régime</th>
                <th style={{ padding: '0.75rem' }}>Message</th>
                <th style={{ padding: '0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map(guest => (
                <tr key={guest.id} style={{ borderBottom: '1px solid #f0ede8' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>{guest.first_name} {guest.last_name}</div>
                    {guest.email && <div style={{ fontSize: '0.8rem', color: '#999' }}>{guest.email}</div>}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: guest.attending === 1 ? '#dcfce7' : guest.attending === 2 ? '#fee2e2' : '#fef3c7',
                      color: guest.attending === 1 ? '#166534' : guest.attending === 2 ? '#991b1b' : '#92400e'
                    }}>
                      {guest.attending === 1 ? 'Présent' : guest.attending === 2 ? 'Absent' : 'En attente'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {guest.plus_one ? (() => {
                      const names = guest.plus_one_name ? guest.plus_one_name.split(', ') : [];
                      const count = names.length || 1;
                      const isExpanded = expandedGuests[guest.id];
                      const visibleNames = isExpanded ? names : names.slice(0, 2);
                      const hasMore = names.length > 2;

                      return (
                        <div>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            +{count}
                          </span>
                          {names.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                              {visibleNames.map((name, i) => (
                                <div key={i}>{name}</div>
                              ))}
                              {!isExpanded && hasMore && (
                                <div style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.25rem',
                                  marginTop: '0.25rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  background: '#f3f4f6',
                                  color: '#6b7280',
                                  cursor: 'pointer'
                                }}
                                  onClick={() => setExpandedGuests(prev => ({ ...prev, [guest.id]: true }))}
                                >
                                  +{names.length - 2} autres <ChevronDown size={12} />
                                </div>
                              )}
                              {isExpanded && hasMore && (
                                <div style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.25rem',
                                  marginTop: '0.25rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  background: '#f3f4f6',
                                  color: '#6b7280',
                                  cursor: 'pointer'
                                }}
                                  onClick={() => setExpandedGuests(prev => ({ ...prev, [guest.id]: false }))}
                                >
                                  Réduire <ChevronUp size={12} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <span style={{ color: '#ccc' }}>Seul(e)</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {guest.dietary_restrictions ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {guest.dietary_restrictions.split(', ').map((restriction, i) => (
                          <span key={i} style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: '#fef3c7',
                            color: '#92400e',
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap'
                          }}>
                            {restriction.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#ccc' }}>Aucune</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {guest.message || <span style={{ color: '#ccc' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#666' }}>
                    {new Date(guest.updated_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button 
                      onClick={() => deleteGuest(guest.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: '#999',
                        padding: '0.25rem'
                      }}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    Aucun invité dans cette catégorie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Composant carte statistique
function StatCard({ icon, label, value, subtext, color, highlight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ 
        padding: '1.5rem',
        borderLeft: `4px solid ${color}`,
        background: highlight ? 'linear-gradient(135deg, white 0%, rgba(201,169,110,0.05) 100%)' : 'white'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-dark)', lineHeight: 1 }}>
        {value}
      </div>
      {subtext && <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>{subtext}</div>}
    </motion.div>
  );
}
