import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AdminDashboard.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

function CreateAccountForm({ token }) {
  const [form, setForm] = useState({ email:'', username:'', password:'', role:'member' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault(); setError(''); setSuccess('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/create-account`, {
        method:'POST',
        headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || data.errors?.[0]?.msg || 'Failed'); return }
      setSuccess(`Account created for ${form.username} (${form.role})`)
      setForm({ email:'', username:'', password:'', role:'member' })
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.createForm}>
      <h3>➕ Create New Account</h3>
      <p>Create user or admin accounts directly from the admin panel.</p>
      {error   && <div className={styles.formError}>⚠ {error}</div>}
      {success && <div className={styles.formSuccess}>✅ {success}</div>}
      <form onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" required placeholder="user@example.com"
              value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          </div>
          <div className={styles.field}>
            <label>Username</label>
            <input required placeholder="e.g. new_user" minLength={3} maxLength={40} pattern="[a-zA-Z0-9_]+"
              value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Password</label>
            <input type="password" required placeholder="Min. 8 characters" minLength={8}
              value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
          </div>
          <div className={styles.field}>
            <label>Role</label>
            <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option value="member">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Creating…' : '🍳 Create Account'}
        </button>
      </form>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const [stats,     setStats]     = useState(null)
  const [users,     setUsers]     = useState([])
  const [activity,  setActivity]  = useState([])
  const [forums,    setForums]    = useState([])
  const [deletions, setDeletions] = useState([])
  const [actFilter, setActFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('overview')
  const [userSearch,setUserSearch]= useState('')
  const [deleteModal,setDeleteModal]=useState(null)
  const [loading,   setLoading]   = useState(true)
  const authH = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [sRes, uRes, aRes, fRes, dRes] = await Promise.all([
          fetch(`${API}/api/activity/stats`,     {headers:authH}),
          fetch(`${API}/api/activity/users-list`,{headers:authH}),
          fetch(`${API}/api/activity`,           {headers:authH}),
          fetch(`${API}/api/forums`),
          fetch(`${API}/api/activity/deletions`, {headers:authH}),
        ])
        if (sRes.ok) setStats(await sRes.json())
        if (uRes.ok) setUsers(await uRes.json())
        if (aRes.ok) setActivity(await aRes.json())
        if (fRes.ok) setForums(await fRes.json())
        if (dRes.ok) setDeletions(await dRes.json())
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [token])

  const STAT_CARDS = [
    { icon:'👥', label:'Total Users',    value: stats?.totalUsers     ?? '—', color:'#3D4A2D' },
    { icon:'🍳', label:'Total Recipes',  value: stats?.totalRecipes   ?? '—', color:'#C1502A' },
    { icon:'💬', label:'Comments',       value: stats?.totalComments  ?? '—', color:'#D4943A' },
    { icon:'🏆', label:'Challenges',     value: stats?.totalChallenges ?? '—', color:'#5C6E42' },
    { icon:'❤️', label:'Total Likes',    value: stats?.totalLikes     ?? '—', color:'#8B3318' },
    { icon:'🚩', label:'Open Reports',   value: stats?.openReports    ?? '—', color:'#C1502A' },
  ]

  // Activity filters
  const ACT_FILTERS = ['All','Admin','Users','Forums','Deletions']
  const filteredActivity = activity.filter(a => {
    if (actFilter === 'All')      return true
    if (actFilter === 'Admin')    return a.role === 'admin'
    if (actFilter === 'Users')    return a.role === 'member'
    if (actFilter === 'Forums')   return a.entity === 'forum'
    if (actFilter === 'Deletions') return a.action.includes('deleted')
    return true
  })

  const deleteUser = async (u) => {
    try {
      const res = await fetch(`${API}/api/users/${u.id}`, {method:'DELETE', headers:authH})
      if (res.ok) setUsers(us => us.filter(x => x.id !== u.id))
    } catch {}
    setDeleteModal(null)
  }

  const promoteUser = async (u) => {
    try {
      const res = await fetch(`${API}/api/users/${u.id}/role`, {
        method:'PUT', headers:authH, body: JSON.stringify({role:'admin'})
      })
      if (res.ok) setUsers(us => us.map(x => x.id===u.id ? {...x,role:'admin'} : x))
    } catch {}
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const TABS = [
    {id:'overview',     label:'📊 Overview'},
    {id:'notifications',label:'🔔 Activity'},
    {id:'users',        label:'👥 Users'},
    {id:'forums',       label:'💬 Forums'},
    {id:'deletions',    label:'🗑 Deletions'},
    {id:'create',       label:'➕ Create Account'},
  ]

  if (loading) return <div className={styles.page}><p style={{padding:'2rem'}}>Loading dashboard…</p></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.backLink}>← Back to site</Link>
          <h1>⚙️ Admin Dashboard</h1>
          <span className={styles.adminBadge}>Admin Panel</span>
        </div>
      </div>

      <div className={styles.tabNav}>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.tabBtn} ${activeTab===t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className={styles.content}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div className={styles.statGrid}>
              {STAT_CARDS.map(s => (
                <div key={s.label} className={styles.statCard} style={{borderTopColor:s.color}}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div className={styles.statValue}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className={styles.overviewGrid}>
              <div className={styles.overCard}>
                <h3>🔔 Recent Activity</h3>
                {activity.length === 0
                  ? <p className={styles.empty}>No activity yet.</p>
                  : activity.slice(0,5).map(a => (
                    <div key={a.id} className={styles.actRow}>
                      <span className={styles.actUser}>{a.username}</span>
                      <span className={styles.actAction}>{a.action.replace(/_/g,' ')}</span>
                      <span className={styles.actTime}>{timeAgo(a.created_at)}</span>
                    </div>
                  ))}
                <button className={styles.seeAll} onClick={() => setActiveTab('notifications')}>See all activity →</button>
              </div>
              <div className={styles.overCard}>
                <h3>👥 Recent Users</h3>
                {users.length === 0
                  ? <p className={styles.empty}>No users yet.</p>
                  : users.slice(0,5).map(u => (
                    <div key={u.id} className={styles.timerRow}>
                      <div className={styles.timerAvatar}>{u.username.slice(0,2).toUpperCase()}</div>
                      <div className={styles.timerInfo}>
                        <span className={styles.timerName}>{u.username}</span>
                        <span className={styles.timerJoined}>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`${styles.timerStatus} ${styles.status_active}`}>{u.role}</span>
                    </div>
                  ))}
                <button className={styles.seeAll} onClick={() => setActiveTab('users')}>Manage all users →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {activeTab === 'notifications' && (
          <div>
            <div className={styles.actFilterRow}>
              {ACT_FILTERS.map(f => (
                <button key={f}
                  className={`${styles.filterBtn} ${actFilter===f ? styles.filterBtnActive : ''}`}
                  onClick={() => setActFilter(f)}>{f}</button>
              ))}
            </div>
            <div className={styles.actList}>
              {filteredActivity.length === 0
                ? <p className={styles.empty}>No activity for this filter.</p>
                : filteredActivity.map(a => (
                  <div key={a.id} className={`${styles.actCard} ${a.role==='admin' ? styles.actAdmin : ''}`}>
                    <div className={styles.actCardAvatar}>{(a.username||'?').slice(0,2).toUpperCase()}</div>
                    <div className={styles.actCardBody}>
                      <strong>{a.username}</strong>
                      <span className={styles.actBadge}>{a.role}</span>
                      <p>{a.action.replace(/_/g,' ')} {a.entity && `(${a.entity} #${a.entity_id})`}</p>
                      {a.meta && (() => { try { const m=JSON.parse(a.meta); return <span className={styles.actMeta}>{m.title||m.body||''}</span> } catch { return null } })()}
                    </div>
                    <span className={styles.actCardTime}>{timeAgo(a.created_at)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div>
            <div className={styles.usersToolbar}>
              <input className={styles.userSearch} placeholder="🔍 Search users…"
                value={userSearch} onChange={e=>setUserSearch(e.target.value)} />
              <span className={styles.userCount}>{filteredUsers.length} users</span>
            </div>
            {filteredUsers.length === 0
              ? <p className={styles.empty}>No users found.</p>
              : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className={u.role==='admin' ? styles.adminRow : ''}>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.tableAvatar}>{u.username.slice(0,2).toUpperCase()}</div>
                            <span>{u.username}</span>
                          </div>
                        </td>
                        <td className={styles.emailCell}>{u.email}</td>
                        <td><span className={`${styles.rolePill} ${u.role==='admin'?styles.roleAdmin:''}`}>{u.role}</span></td>
                        <td className={styles.dateCell}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            {u.role!=='admin' && <button className={styles.promoteBtn} onClick={()=>promoteUser(u)}>⬆ Admin</button>}
                            <button className={styles.deleteBtn} onClick={()=>setDeleteModal(u)}>🗑 Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── FORUMS ── */}
        {activeTab === 'forums' && (
          <div>
            <p style={{marginBottom:'1rem',color:'var(--warm-gray)',fontSize:'0.9rem'}}>
              {forums.length} forum posts · Admin can delete any post
            </p>
            {forums.length === 0
              ? <p className={styles.empty}>No forum posts yet.</p>
              : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Replies</th><th>Posted</th><th>Actions</th></tr></thead>
                  <tbody>
                    {forums.map(f => (
                      <tr key={f.id}>
                        <td style={{fontWeight:600,maxWidth:'220px'}}>{f.title}</td>
                        <td>
                          <span className={`${styles.rolePill} ${f.author_role==='admin'?styles.roleAdmin:''}`}>
                            {f.author}
                          </span>
                        </td>
                        <td>{f.category}</td>
                        <td>💬 {f.reply_count}</td>
                        <td className={styles.dateCell}>{new Date(f.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className={styles.deleteBtn} onClick={async () => {
                            if (!window.confirm(`Delete "${f.title}"?`)) return
                            await fetch(`${API}/api/forums/${f.id}`, {method:'DELETE',headers:authH})
                            setForums(fs => fs.filter(x => x.id !== f.id))
                          }}>🗑 Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DELETIONS ── */}
        {activeTab === 'deletions' && (
          <div>
            <p style={{marginBottom:'1rem',color:'var(--warm-gray)',fontSize:'0.9rem'}}>
              All soft-deleted content — {deletions.length} items
            </p>
            {deletions.length === 0
              ? <p className={styles.empty}>No deleted content yet.</p>
              : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Type</th><th>Name</th><th>Deleted By</th><th>When</th></tr></thead>
                  <tbody>
                    {deletions.map((d,i) => (
                      <tr key={i}>
                        <td><span className={styles.rolePill}>{d.type.replace('_',' ')}</span></td>
                        <td>{d.name}</td>
                        <td>{d.deleted_by}</td>
                        <td className={styles.dateCell}>{timeAgo(d.deleted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CREATE ACCOUNT ── */}
        {activeTab === 'create' && <CreateAccountForm token={token} />}

      </div>

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className={styles.modalOverlay} onClick={()=>setDeleteModal(null)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3>Delete Account?</h3>
            <p>Permanently delete <strong>{deleteModal.username}</strong>'s account? Cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={()=>setDeleteModal(null)}>Cancel</button>
              <button className={styles.modalConfirm} onClick={()=>deleteUser(deleteModal)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
