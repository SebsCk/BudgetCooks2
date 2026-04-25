import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './ChallengesPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function ChallengeCard({ ch, token, isAdmin, onStatusChange }) {
  const [entering, setEntering] = useState(false)

  const join = async () => {
    if (!token) { alert('Please log in to join a challenge.'); return }
    setEntering(true)
    try {
      const res = await fetch(`${API}/api/challenges/${ch.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe_id: null }),
      })
      const data = await res.json()
      alert(data.message || data.error)
    } catch { alert('Failed to join challenge.') }
    finally { setEntering(false) }
  }

  const changeStatus = async (status) => {
    try {
      await fetch(`${API}/api/challenges/${ch.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      onStatusChange()
    } catch { alert('Failed to update status.') }
  }

  return (
    <div className={`${styles.card} ${ch.status === 'active' ? styles.cardLive : ''}`}>
      <div className={styles.cardIcon}>{ch.icon || '🏆'}</div>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={`${styles.badge} ${ch.status === 'active' ? styles.badgeLive : ch.status === 'pending' ? styles.badgeSoon : styles.badgeOpen}`}>
            {ch.status === 'active' ? '🔥 Live' : ch.status === 'pending' ? '⏳ Pending' : ch.status === 'closed' ? '✅ Closed' : '✅ Open'}
          </span>
          {ch.budget_limit && <span className={styles.budget}>₱{ch.budget_limit} limit</span>}
        </div>
        <h3 className={styles.cardTitle}>{ch.title}</h3>
        <p className={styles.cardDesc}>{ch.description || 'Share your best budget recipe for this challenge!'}</p>
        <div className={styles.cardFooter}>
          <span className={styles.entries}>👥 {ch.entry_count || 0} entries</span>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {ch.status === 'active' && (
              <button className="btn btn-primary" style={{fontSize:'0.82rem',padding:'0.5rem 1rem'}}
                onClick={join} disabled={entering}>
                {entering ? 'Joining…' : 'Join Challenge →'}
              </button>
            )}
            {ch.status === 'pending' && !isAdmin && (
              <span style={{fontSize:'0.8rem',color:'var(--warm-gray)'}}>Awaiting admin approval</span>
            )}
            {isAdmin && ch.status === 'pending' && (
              <>
                <button className="btn btn-primary" style={{fontSize:'0.8rem',padding:'0.4rem 0.8rem'}}
                  onClick={() => changeStatus('active')}>✅ Approve</button>
                <button className="btn btn-outline" style={{fontSize:'0.8rem',padding:'0.4rem 0.8rem',color:'var(--terra)',borderColor:'var(--terra)'}}
                  onClick={() => changeStatus('rejected')}>❌ Reject</button>
              </>
            )}
            {isAdmin && ch.status === 'active' && (
              <button className="btn btn-outline" style={{fontSize:'0.8rem',padding:'0.4rem 0.8rem'}}
                onClick={() => changeStatus('closed')}>Close</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddChallengeModal({ token, onClose, onAdded }) {
  const [form, setForm] = useState({ title:'', description:'', budget_limit:'', starts_at:'', ends_at:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch(`${API}/api/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, budget_limit: form.budget_limit || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      onAdded()
      onClose()
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const f = (k, v) => setForm(p => ({...p, [k]: v}))

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>➕ Add Challenge</h3>
        {error && <p className={styles.formError}>⚠ {error}</p>}
        <form onSubmit={submit} className={styles.form}>
          <label>Title *</label>
          <input required value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. ₱100 Budget Meal Challenge" />

          <label>Description</label>
          <textarea value={form.description} onChange={e => f('description', e.target.value)}
            placeholder="What's this challenge about?" rows={3} />

          <label>Budget Limit (₱)</label>
          <input type="number" value={form.budget_limit} onChange={e => f('budget_limit', e.target.value)} placeholder="e.g. 100" />

          <div className={styles.formRow}>
            <div>
              <label>Start Date</label>
              <input type="date" value={form.starts_at} onChange={e => f('starts_at', e.target.value)} />
            </div>
            <div>
              <label>End Date</label>
              <input type="date" value={form.ends_at} onChange={e => f('ends_at', e.target.value)} />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ChallengesPage() {
  const { user, token } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const isAdmin = user?.role === 'admin'

  const fetchAll = async () => {
    setLoading(true)
    try {
      // Fetch active + pending (admin sees pending too)
      const statuses = isAdmin ? ['active', 'pending', 'closed'] : ['active']
      const results = await Promise.all(
        statuses.map(s => fetch(`${API}/api/challenges?status=${s}`).then(r => r.ok ? r.json() : []))
      )
      setChallenges(results.flat())
    } catch { setChallenges([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [isAdmin])

  const active  = challenges.filter(c => c.status === 'active')
  const pending = challenges.filter(c => c.status === 'pending')
  const closed  = challenges.filter(c => c.status === 'closed')

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>🏆 Challenges</h1>
        <p>Compete with the community, showcase your budget cooking skills!</p>
      </div>

      <div className="container">
        {isAdmin && (
          <div style={{padding:'1.5rem 0 0',display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ Add Challenge
            </button>
          </div>
        )}

        {loading ? (
          <p className={styles.empty}>Loading challenges…</p>
        ) : challenges.length === 0 ? (
          <div className={styles.empty}>
            <p>😅 No challenges yet.{isAdmin ? ' Add one using the button above!' : ' Check back soon!'}</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🔥 Live Now</h2>
                <div className={styles.grid}>
                  {active.map(ch => <ChallengeCard key={ch.id} ch={ch} token={token} isAdmin={isAdmin} onStatusChange={fetchAll} />)}
                </div>
              </section>
            )}
            {isAdmin && pending.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>⏳ Pending Approval</h2>
                <div className={styles.grid}>
                  {pending.map(ch => <ChallengeCard key={ch.id} ch={ch} token={token} isAdmin={isAdmin} onStatusChange={fetchAll} />)}
                </div>
              </section>
            )}
            {isAdmin && closed.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>✅ Closed</h2>
                <div className={styles.grid}>
                  {closed.map(ch => <ChallengeCard key={ch.id} ch={ch} token={token} isAdmin={isAdmin} onStatusChange={fetchAll} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddChallengeModal token={token} onClose={() => setShowModal(false)} onAdded={fetchAll} />
      )}
    </div>
  )
}
