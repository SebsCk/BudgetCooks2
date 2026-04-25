import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AdminDashboard.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const NOTIF_FILTERS = ['All', 'Favorites', 'Forum', 'Users', 'Deletions', 'Admin']
const NOTIF_TYPE_MAP = { favorite:'Favorites', forum:'Forum', user_add:'Users', delete:'Deletions', admin_add:'Admin' }

function CreateAccountForm() {
  const { createAccount } = useAuth()
  const [form, setForm] = useState({ email: '', username: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await createAccount(form.email, form.username, form.password, form.role)
      setSuccess(`Account created successfully for ${form.username} (${form.role})`)
      setForm({ email: '', username: '', password: '', role: 'user' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.createForm}>
      <h3>➕ Create New Account</h3>
      <p>Create user or admin accounts directly from the admin panel.</p>
      {error && <div className={styles.error}>⚠ {error}</div>}
      {success && <div className={styles.success}>✅ {success}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="user@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" placeholder="e.g. new_user" value={form.username} onChange={handleChange} required minLength={3} maxLength={40} pattern="[a-zA-Z0-9_]+" />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required minLength={8} />
          </div>
          <div className={styles.field}>
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="user">User</option>
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
  const { token } = useAuth()
  const [users,        setUsers]       = useState([])
  const [stats,        setStats]       = useState(null)
  const [notifs,       setNotifs]      = useState([])
  const [notifFilter,  setNotifFilter] = useState('All')
  const [activeTab,    setActiveTab]   = useState('overview')
  const [deleteModal,  setDeleteModal] = useState(null)
  const [promotedUser, setPromotedUser] = useState(null)
  const [userSearch,   setUserSearch]  = useState('')
  const [loading,      setLoading]     = useState(true)
  const [error,        setError]       = useState('')

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [usersRes, statsRes] = await Promise.all([
          fetch(`${API}/api/users`, { headers: authHeaders }),
          fetch(`${API}/api/users/stats`, { headers: authHeaders }),
        ])
        if (usersRes.ok) setUsers(await usersRes.json())
        if (statsRes.ok) setStats(await statsRes.json())
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  const STAT_CARDS = [
    { icon:'👥', label:'Total Users',    value: stats?.totalUsers     ?? '—', color:'#3D4A2D' },
    { icon:'🍳', label:'Total Recipes',  value: stats?.totalRecipes   ?? '—', color:'#C1502A' },
    { icon:'💬', label:'Comments',       value: stats?.totalComments  ?? '—', color:'#D4943A' },
    { icon:'🏆', label:'Challenges',     value: stats?.totalChallenges ?? '—', color:'#5C6E42' },
    { icon:'❤️', label:'Total Likes',    value: stats?.totalLikes     ?? '—', color:'#8B3318' },
    { icon:'🚩', label:'Open Reports',   value: stats?.openReports    ?? '—', color:'#C1502A' },
  ]

  const filteredNotifs = notifFilter === 'All' ? notifs : notifs.filter(n => NOTIF_TYPE_MAP[n.type] === notifFilter)
  const unreadCount = notifs.filter(n => !n.read).length
  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })))
  const markRead    = id => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))

  const confirmDelete = async (user) => {
    try {
      const res = await fetch(`${API}/api/users/${user.id}`, { method: 'DELETE', headers: authHeaders })
      if (res.ok) {
        setUsers(us => us.filter(u => u.id !== user.id))
        setNotifs(ns => [{ id: Date.now(), type:'delete', icon:'🗑', text: `User "${user.username}" was deleted by admin`, time:'just now', read:false }, ...ns])
      }
    } catch (err) { console.error('Delete failed', err) }
    setDeleteModal(null)
  }

  const promoteUser = async (user) => {
    try {
      const res = await fetch(`${API}/api/users/${user.id}/role`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ role: 'admin' }) })
      if (res.ok) {
        setUsers(us => us.map(u => u.id === user.id ? { ...u, role: 'admin' } : u))
        setNotifs(ns => [{ id: Date.now(), type:'admin_add', icon:'⚙️', text: `${user.username} was granted admin privileges`, time:'just now', read:false }, ...ns])
        setPromotedUser(user.username)
        setTimeout(() => setPromotedUser(null), 3000)
      }
    } catch (err) { console.error('Promote failed', err) }
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const TABS = [
    { id:'overview',       label:'📊 Overview'      },
    { id:'notifications',  label:'🔔 Notifications'  },
    { id:'users',          label:'👥 Users'          },
    { id:'create-account', label:'➕ Create Account' },
  ]

  if (loading) return <div className={styles.page}><p style={{padding:'2rem'}}>Loading dashboard…</p></div>
  if (error)   return <div className={styles.page}><p style={{padding:'2rem',color:'red'}}>{error}</p></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.backLink}>← Back to site</Link>
          <h1>⚙️ Admin Dashboard</h1>
          <span className={styles.adminBadge}>Admin Panel</span>
        </div>
        <div className={styles.headerRight}>
          {unreadCount > 0 && <div className={styles.notifPill}>🔔 {unreadCount} unread</div>}
        </div>
      </div>

      {promotedUser && <div className={styles.successToast}>✅ {promotedUser} has been granted admin privileges!</div>}

      <div className={styles.tabNav}>
        {TABS.map(t => (
          <button key={t.id} className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.id === 'notifications' && unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
        ))}
      </div>

      <div className={styles.content}>

        {activeTab === 'overview' && (
          <div>
            <div className={styles.statGrid}>
              {STAT_CARDS.map(s => (
                <div key={s.label} className={styles.statCard} style={{ borderTopColor: s.color }}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div className={styles.statValue}>{s.value}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className={styles.overviewGrid}>
              <div className={styles.overCard}>
                <h3>🔔 Recent Activity</h3>
                {notifs.length === 0
                  ? <p className={styles.empty}>No recent activity yet.</p>
                  : notifs.slice(0,5).map(n => (
                    <div key={n.id} className={`${styles.notifRow} ${!n.read ? styles.notifUnread : ''}`}>
                      <span className={styles.notifIcon}>{n.icon}</span>
                      <div className={styles.notifText}>{n.text}</div>
                      <span className={styles.notifTime}>{n.time}</span>
                    </div>
                  ))}
                <button className={styles.seeAll} onClick={() => setActiveTab('notifications')}>See all notifications →</button>
              </div>
              <div className={styles.overCard}>
                <h3>👥 Recent Users</h3>
                {users.length === 0
                  ? <p className={styles.empty}>No users yet.</p>
                  : users.slice(0,6).map(u => (
                    <div key={u.id} className={styles.timerRow}>
                      <div className={styles.timerAvatar}>{u.username.slice(0,2).toUpperCase()}</div>
                      <div className={styles.timerInfo}>
                        <span className={styles.timerName}>{u.username}</span>
                        <span className={styles.timerJoined}>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`${styles.timerStatus} ${styles.status_active}`}>active</span>
                    </div>
                  ))}
                <button className={styles.seeAll} onClick={() => setActiveTab('users')}>Manage all users →</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <div className={styles.notifHeader}>
              <div className={styles.notifFilterRow}>
                {NOTIF_FILTERS.map(f => (
                  <button key={f} className={`${styles.filterBtn} ${notifFilter === f ? styles.filterBtnActive : ''}`} onClick={() => setNotifFilter(f)}>{f}</button>
                ))}
              </div>
              {unreadCount > 0 && <button className={styles.markAll} onClick={markAllRead}>✓ Mark all read</button>}
            </div>
            <div className={styles.notifList}>
              {filteredNotifs.length === 0
                ? <p className={styles.empty}>No notifications yet.</p>
                : filteredNotifs.map(n => (
                  <div key={n.id} className={`${styles.notifCard} ${!n.read ? styles.notifCardUnread : ''}`} onClick={() => markRead(n.id)}>
                    <span className={styles.notifCardIcon}>{n.icon}</span>
                    <div className={styles.notifCardBody}>
                      <p className={styles.notifCardText}>{n.text}</p>
                      <span className={styles.notifCardTime}>{n.time}</span>
                    </div>
                    {!n.read && <span className={styles.unreadDot} />}
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className={styles.usersToolbar}>
              <input className={styles.userSearch} placeholder="🔍 Search users…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              <span className={styles.userCount}>{filteredUsers.length} users</span>
            </div>
            {filteredUsers.length === 0
              ? <p className={styles.empty}>No users found.</p>
              : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>User</th><th>Email</th><th>Role</th><th>Date Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className={u.role === 'admin' ? styles.adminRow : ''}>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.tableAvatar}>{u.username.slice(0,2).toUpperCase()}</div>
                            <span>{u.username}</span>
                          </div>
                        </td>
                        <td className={styles.emailCell}>{u.email}</td>
                        <td><span className={`${styles.rolePill} ${u.role === 'admin' ? styles.roleAdmin : ''}`}>{u.role}</span></td>
                        <td className={styles.dateCell}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            {u.role !== 'admin' && <button className={styles.promoteBtn} onClick={() => promoteUser(u)} title="Promote to Admin">⬆ Admin</button>}
                            <button className={styles.deleteBtn} onClick={() => setDeleteModal(u)} title="Delete account">🗑 Delete</button>
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

        {activeTab === 'create-account' && <CreateAccountForm />}
      </div>

      {deleteModal && (
        <div className={styles.modalOverlay} onClick={() => setDeleteModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3>Delete Account?</h3>
            <p>Are you sure you want to permanently delete <strong>{deleteModal.username}</strong>'s account? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className={styles.modalConfirm} onClick={() => confirmDelete(deleteModal)}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
