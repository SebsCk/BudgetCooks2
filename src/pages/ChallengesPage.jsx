import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import styles from './ChallengesPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function ChallengeCard({ ch, token, user, isAdmin, onRefresh }) {
  const [busy,         setBusy]         = useState(false)
  const [showPick,     setShowPick]     = useState(false)
  const [recipes,      setRecipes]      = useState([])
  const [loadingR,     setLoadingR]     = useState(false)
  const [pickedId,     setPickedId]     = useState('')
  const [showEntries,  setShowEntries]  = useState(false)
  const [entries,      setEntries]      = useState([])
  const [loadingE,     setLoadingE]     = useState(false)
  const navigate = useNavigate()

  const changeStatus = async (status) => {
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/challenges/${ch.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Failed to update'); return }
      onRefresh()
    } catch (err) { alert('Network error: ' + err.message) }
    finally { setBusy(false) }
  }

  const openPicker = async () => {
    if (!token) { alert('Please log in to join.'); return }
    setShowPick(true)
    setLoadingR(true)
    try {
      const res = await fetch(`${API}/api/recipes?mine=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRecipes(Array.isArray(data) ? data : (data.recipes || []))
      }
    } catch {}
    setLoadingR(false)
  }

  const confirmJoin = async () => {
    if (!pickedId) { alert('Please select a recipe.'); return }
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/challenges/${ch.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe_id: parseInt(pickedId) }),
      })
      const data = await res.json()
      alert(data.message || data.error)
      if (res.ok) { setShowPick(false); onRefresh() }
    } catch { alert('Network error') }
    finally { setBusy(false) }
  }

  const toggleEntries = async () => {
    if (showEntries) { setShowEntries(false); return }
    setShowEntries(true)
    if (entries.length > 0) return   // already loaded
    setLoadingE(true)
    try {
      const res = await fetch(`${API}/api/challenges/${ch.id}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      }
    } catch {}
    setLoadingE(false)
  }

  return (
    <>
      <div className={`${styles.card} ${ch.status === 'active' ? styles.cardLive : ''}`}>
        <div className={styles.cardIcon}>{ch.icon || '🏆'}</div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            <span className={`${styles.badge} ${ch.status==='active'?styles.badgeLive:ch.status==='pending'?styles.badgeSoon:styles.badgeOpen}`}>
              {ch.status==='active'?'🔥 Live':ch.status==='pending'?'⏳ Pending':ch.status==='closed'?'🏁 Closed':'Open'}
            </span>
            {ch.budget_limit && <span className={styles.budget}>₱{ch.budget_limit} limit</span>}
          </div>
          <h3 className={styles.cardTitle}>{ch.title}</h3>
          <p className={styles.cardDesc}>{ch.description || 'Share your best budget recipe!'}</p>
          {ch.status === 'closed' && ch.winner_recipe_id && (
            <div className={styles.winnerBanner} onClick={() => navigate(`/recipe/${ch.winner_recipe_id}/comments`)}>
              <span className={styles.winnerCrown}>🥇</span>
              <div className={styles.winnerInfo}>
                <span className={styles.winnerLabel}>Winner</span>
                <span className={styles.winnerTitle}>{ch.winner_title}</span>
                <span className={styles.winnerAuthor}>by {ch.winner_username}</span>
              </div>
              {ch.winner_image_url && (
                <img src={ch.winner_image_url} alt={ch.winner_title} className={styles.winnerImg} />
              )}
            </div>
          )}
          {ch.status === 'closed' && !ch.winner_recipe_id && (
            <div className={styles.noWinner}>No entries were submitted.</div>
          )}
          <div className={styles.cardFooter}>
            <button
              className={styles.entriesBtn}
              onClick={toggleEntries}
              disabled={ch.entry_count === 0}
            >
              👥 {ch.entry_count || 0} {ch.entry_count === 1 ? 'entry' : 'entries'}
              {ch.entry_count > 0 && <span className={styles.entriesChevron}>{showEntries ? ' ▲' : ' ▼'}</span>}
            </button>
            <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
              {ch.status==='active' && !isAdmin && (
                <button className="btn btn-primary" style={{fontSize:'0.82rem',padding:'0.5rem 1rem'}}
                  onClick={openPicker} disabled={busy}>{busy?'…':'Join Challenge →'}</button>
              )}
              {isAdmin && ch.status==='pending' && (
                <>
                  <button className="btn btn-primary" style={{fontSize:'0.8rem',padding:'0.4rem 0.8rem'}}
                    onClick={()=>changeStatus('active')} disabled={busy}>✅ Approve</button>
                  <button className="btn btn-outline" style={{fontSize:'0.8rem',padding:'0.4rem 0.8rem',color:'var(--terra)',borderColor:'var(--terra)'}}
                    onClick={()=>changeStatus('rejected')} disabled={busy}>❌ Reject</button>
                </>
              )}
              {isAdmin && ch.status==='active' && (
                <button className="btn btn-outline" style={{fontSize:'0.8rem',padding:'0.4rem 0.8rem',color:'var(--terra)',borderColor:'var(--terra)'}}
                  onClick={()=>changeStatus('closed')} disabled={busy}>🔒 Close</button>
              )}
            </div>
          </div>

          {/* Entries panel */}
          {showEntries && (
            <div className={styles.entriesPanel}>
              {loadingE ? (
                <p className={styles.entriesLoading}>Loading entries…</p>
              ) : entries.length === 0 ? (
                <p className={styles.entriesEmpty}>No entries yet.</p>
              ) : (
                <div className={styles.entriesList}>
                  {entries.map((e, i) => (
                    <div
                      key={i}
                      className={styles.entryRow}
                      onClick={() => navigate(`/recipe/${e.recipe_id}/comments`)}
                    >
                      {e.image_url
                        ? <img src={e.image_url} alt={e.title} className={styles.entryImg} />
                        : <div className={styles.entryImgPlaceholder}>🍽</div>
                      }
                      <div className={styles.entryInfo}>
                        <span className={styles.entryTitle}>{e.title}</span>
                        <span className={styles.entryMeta}>
                          by <strong>{e.author}</strong> · ₱{e.estimated_cost || '—'}
                          {ch.budget_limit && e.estimated_cost > ch.budget_limit && (
                            <span className={styles.overBudgeTag}> ⚠️ Over limit</span>
                          )}
                        </span>
                      </div>
                      <span className={styles.entryLikes}>❤ {e.like_count || 0}</span>
                      <span className={styles.entryArrow}>→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recipe picker modal */}
      {showPick && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}
          onClick={() => setShowPick(false)}>
          <div style={{background:'#fff',borderRadius:'14px',padding:'2rem',width:'100%',maxWidth:'480px',maxHeight:'80vh',overflowY:'auto'}}
            onClick={e => e.stopPropagation()}>
            <h3 style={{marginBottom:'0.5rem',fontSize:'1.1rem'}}>🏆 Join: {ch.title}</h3>
            <p style={{fontSize:'0.85rem',color:'#666',marginBottom:'1.25rem'}}>Select one of your recipes to submit.</p>
            {loadingR ? (
              <p style={{color:'#999',fontSize:'0.9rem'}}>Loading your recipes…</p>
            ) : recipes.length === 0 ? (
              <p style={{color:'#999',fontSize:'0.9rem'}}>You haven't posted any recipes yet. <a href="/share" style={{color:'var(--terra)'}}>Share one first!</a></p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginBottom:'1.25rem'}}>
                {recipes.map(r => {
                  const overBudget = ch.budget_limit && r.estimated_cost > ch.budget_limit
                  return (
                    <label key={r.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.65rem 0.85rem',border:`2px solid ${overBudget?'#fed7d7':pickedId==r.id?'var(--terra)':'#e2e8f0'}`,borderRadius:'9px',cursor:overBudget?'not-allowed':'pointer',background:overBudget?'#fff5f5':pickedId==r.id?'#fff5f0':'#fff',opacity:overBudget?0.6:1}}>
                      <input type="radio" name="recipeId" value={r.id}
                        checked={pickedId == r.id}
                        onChange={() => !overBudget && setPickedId(r.id)}
                        disabled={overBudget}
                        style={{accentColor:'var(--terra)'}} />
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:'0.9rem'}}>{r.title}</div>
                        <div style={{fontSize:'0.78rem',color:'#888'}}>₱{r.estimated_cost || '—'} · {r.servings || 1} servings</div>
                      </div>
                      {overBudget && <span style={{fontSize:'0.72rem',color:'#c53030',fontWeight:600,whiteSpace:'nowrap'}}>Over ₱{ch.budget_limit} limit</span>}
                    </label>
                  )
                })}
                {recipes.every(r => ch.budget_limit && r.estimated_cost > ch.budget_limit) && (
                  <p style={{color:'#c53030',fontSize:'0.85rem',marginTop:'0.25rem'}}>⚠️ All your recipes exceed the ₱{ch.budget_limit} budget limit. <a href="/share" style={{color:'var(--terra)'}}>Share a cheaper one!</a></p>
                )}
              </div>
            )}
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button onClick={() => setShowPick(false)}
                style={{padding:'0.5rem 1rem',border:'1.5px solid #ddd',borderRadius:'8px',background:'none',cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={confirmJoin} disabled={busy || !pickedId || loadingR}
                style={{padding:'0.5rem 1.25rem',background:'var(--terra)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',opacity:(!pickedId||busy)?0.5:1}}>
                {busy ? 'Submitting…' : '🏆 Submit Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
      onAdded(); onClose()
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const f = (k,v) => setForm(p => ({...p,[k]:v}))

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <h3>➕ Add Challenge</h3>
        {error && <p className={styles.formError}>⚠ {error}</p>}
        <form onSubmit={submit} className={styles.form}>
          <label>Title *</label>
          <input required value={form.title} onChange={e=>f('title',e.target.value)} placeholder="e.g. ₱100 Budget Meal Challenge" />
          <label>Description</label>
          <textarea value={form.description} onChange={e=>f('description',e.target.value)} placeholder="What's this challenge about?" rows={3} />
          <label>Budget Limit (₱)</label>
          <input type="number" value={form.budget_limit} onChange={e=>f('budget_limit',e.target.value)} placeholder="e.g. 100" />
          <div className={styles.formRow}>
            <div><label>Start Date</label><input type="date" value={form.starts_at} onChange={e=>f('starts_at',e.target.value)} /></div>
            <div><label>End Date</label><input type="date" value={form.ends_at} onChange={e=>f('ends_at',e.target.value)} /></div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Adding…':'Add Challenge'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ChallengesPage() {
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const [challenges, setChallenges] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const isAdmin = user?.role === 'admin'

  const fetchAll = async () => {
    setLoading(true)
    try {
      const statuses = isAdmin ? ['active','pending','closed'] : ['active','closed']
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
        <p>Compete with the community and showcase your budget cooking skills!</p>
      </div>
      <div className="container">
        {isAdmin && (
          <div style={{padding:'1.5rem 0 0',display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Challenge</button>
          </div>
        )}
        {loading ? <p className={styles.empty}>Loading challenges…</p>
          : challenges.length === 0 ? (
            <div className={styles.empty}>
              <p>😅 No challenges yet.{isAdmin?' Add one above!':' Check back soon!'}</p>
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>🔥 Live Now</h2>
                  <div className={styles.grid}>
                    {active.map(ch => <ChallengeCard key={ch.id} ch={ch} token={token} user={user} isAdmin={isAdmin} onRefresh={fetchAll} />)}
                  </div>
                </section>
              )}
              {isAdmin && pending.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>⏳ Pending Approval</h2>
                  <div className={styles.grid}>
                    {pending.map(ch => <ChallengeCard key={ch.id} ch={ch} token={token} user={user} isAdmin={isAdmin} onRefresh={fetchAll} />)}
                  </div>
                </section>
              )}
              {closed.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>🏁 Past Challenges</h2>
                  <div className={styles.grid}>
                    {closed.map(ch => <ChallengeCard key={ch.id} ch={ch} token={token} user={user} isAdmin={isAdmin} onRefresh={fetchAll} />)}
                  </div>
                </section>
              )}
            </>
          )}
      </div>
      {showModal && <AddChallengeModal token={token} onClose={() => setShowModal(false)} onAdded={fetchAll} />}
    </div>
  )
}
