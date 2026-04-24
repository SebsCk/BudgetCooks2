import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AdminDashboard.module.css'

/* ── MOCK DATA ── */
const USERS = [
  { id:1, username:'manang_rosa',   email:'rosa@email.com',    role:'member', recipes:18, joined:'2024-11-01', lastActive:'2025-04-10', status:'active',   accountTimer:'5 months' },
  { id:2, username:'kuya_berto',    email:'berto@email.com',   role:'member', recipes:14, joined:'2024-12-15', lastActive:'2025-04-09', status:'active',   accountTimer:'4 months' },
  { id:3, username:'tita_grace',    email:'grace@email.com',   role:'member', recipes:11, joined:'2025-01-03', lastActive:'2025-04-07', status:'active',   accountTimer:'3 months' },
  { id:4, username:'rodel_luto',    email:'rodel@email.com',   role:'member', recipes:9,  joined:'2025-01-20', lastActive:'2025-03-28', status:'inactive', accountTimer:'2 months' },
  { id:5, username:'student_paolo', email:'paolo@email.com',   role:'member', recipes:7,  joined:'2025-02-10', lastActive:'2025-04-11', status:'active',   accountTimer:'2 months' },
  { id:6, username:'nanay_lita',    email:'lita@email.com',    role:'member', recipes:3,  joined:'2025-03-01', lastActive:'2025-04-08', status:'active',   accountTimer:'1 month' },
  { id:7, username:'aling_belen',   email:'belen@email.com',   role:'member', recipes:6,  joined:'2025-03-15', lastActive:'2025-03-30', status:'inactive', accountTimer:'3 weeks' },
  { id:8, username:'pinoy_chef',    email:'pchef@email.com',   role:'member', recipes:0,  joined:'2025-04-11', lastActive:'2025-04-11', status:'new',      accountTimer:'1 day' },
]

const NOTIFS = [
  { id:1,  type:'favorite', icon:'❤️',  text:'manang_rosa favorited "Garlic Fried Rice"',        time:'5m ago',  read:false },
  { id:2,  type:'forum',    icon:'💬',  text:'New forum post: "Substitute for patis?"',           time:'12m ago', read:false },
  { id:3,  type:'user_add', icon:'👤',  text:'pinoy_chef was added to the platform',              time:'1h ago',  read:false },
  { id:4,  type:'delete',   icon:'🗑',  text:'User "old_user_99" deleted their account',          time:'2h ago',  read:true  },
  { id:5,  type:'favorite', icon:'❤️',  text:'kuya_berto favorited "Monggo Soup na Masustansya"', time:'3h ago',  read:true  },
  { id:6,  type:'admin_add',icon:'⚙️',  text:'tita_grace was granted admin privileges',           time:'4h ago',  read:true  },
  { id:7,  type:'forum',    icon:'💬',  text:'New forum post: "Best budget ulam for 6 pax?"',     time:'5h ago',  read:true  },
  { id:8,  type:'delete',   icon:'🗑',  text:'User "spammer_123" deleted by admin',               time:'1d ago',  read:true  },
  { id:9,  type:'user_add', icon:'👤',  text:'aling_belen registered a new account',              time:'1d ago',  read:true  },
  { id:10, type:'favorite', icon:'❤️',  text:'student_paolo favorited "Tortang Talong"',          time:'2d ago',  read:true  },
]

const FORUM_POSTS = [
  { id:1, author:'kuya_berto',    title:'Substitute for patis?',            replies:8,  time:'12m ago', flagged:false },
  { id:2, author:'manang_rosa',   title:'Best budget ulam for 6 pax?',      replies:14, time:'5h ago',  flagged:false },
  { id:3, author:'student_paolo', title:'Cheap ingredients near Divisoria', replies:22, time:'1d ago',  flagged:false },
  { id:4, author:'unknown_user',  title:'Buy followers for cheap!!!',       replies:1,  time:'2d ago',  flagged:true  },
  { id:5, author:'nanay_lita',    title:'Monggo alternatives?',             replies:6,  time:'3d ago',  flagged:false },
]

const STAT_CARDS = [
  { icon:'👥', label:'Total Users',    value:'843',   delta:'+12 this week',  color:'#3D4A2D' },
  { icon:'🍳', label:'Total Recipes',  value:'2,481', delta:'+48 this week',  color:'#C1502A' },
  { icon:'💬', label:'Comments',       value:'9,204', delta:'+156 this week', color:'#D4943A' },
  { icon:'🏆', label:'Challenges',     value:'14',    delta:'4 active',       color:'#5C6E42' },
  { icon:'❤️', label:'Total Likes',    value:'41.2k', delta:'+890 this week', color:'#8B3318' },
  { icon:'🚩', label:'Open Reports',   value:'7',     delta:'2 new today',    color:'#C1502A' },
]

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
            <input id="email" name="email" type="email"
              placeholder="user@example.com" value={form.email}
              onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text"
              placeholder="e.g. new_user" value={form.username}
              onChange={handleChange} required minLength={3} maxLength={40}
              pattern="[a-zA-Z0-9_]+" />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password"
              placeholder="Min. 8 characters" value={form.password}
              onChange={handleChange} required minLength={8} />
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
  const [users,        setUsers]      = useState(USERS)
  const [notifs,       setNotifs]     = useState(NOTIFS)
  const [notifFilter,  setNotifFilter] = useState('All')
  const [activeTab,    setActiveTab]  = useState('overview')
  const [deleteModal,  setDeleteModal] = useState(null)
  const [promotedUser, setPromotedUser] = useState(null)
  const [userSearch,   setUserSearch] = useState('')

  // Notification filtering
  const filteredNotifs = notifFilter === 'All'
    ? notifs
    : notifs.filter(n => NOTIF_TYPE_MAP[n.type] === notifFilter)

  const unreadCount = notifs.filter(n => !n.read).length

  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })))
  const markRead    = id => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))

  const confirmDelete = (user) => {
    setUsers(us => us.filter(u => u.id !== user.id))
    setNotifs(ns => [{
      id: Date.now(), type:'delete', icon:'🗑',
      text: `User "${user.username}" was deleted by admin`,
      time:'just now', read:false
    }, ...ns])
    setDeleteModal(null)
  }

  const promoteUser = (user) => {
    setUsers(us => us.map(u => u.id === user.id ? { ...u, role: 'admin' } : u))
    setNotifs(ns => [{
      id: Date.now(), type:'admin_add', icon:'⚙️',
      text: `${user.username} was granted admin privileges`,
      time:'just now', read:false
    }, ...ns])
    setPromotedUser(user.username)
    setTimeout(() => setPromotedUser(null), 3000)
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const TABS = [
    { id:'overview',     label:'📊 Overview'     },
    { id:'notifications',label:'🔔 Notifications' },
    { id:'users',        label:'👥 Users'         },
    { id:'create-account', label:'➕ Create Account' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.backLink}>← Back to site</Link>
          <h1>⚙️ Admin Dashboard</h1>
          <span className={styles.adminBadge}>Admin Panel</span>
        </div>
        <div className={styles.headerRight}>
          {unreadCount > 0 && (
            <div className={styles.notifPill}>
              🔔 {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {promotedUser && (
        <div className={styles.successToast}>
          ✅ {promotedUser} has been granted admin privileges!
        </div>
      )}

      {/* TAB NAV */}
      <div className={styles.tabNav}>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.id === 'notifications' && unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.content}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            <div className={styles.statGrid}>
              {STAT_CARDS.map(s => (
                <div key={s.label} className={styles.statCard} style={{ borderTopColor: s.color }}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div className={styles.statValue}>{s.value}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                  <div className={styles.statDelta}>{s.delta}</div>
                </div>
              ))}
            </div>

            <div className={styles.overviewGrid}>
              {/* Recent Notifications */}
              <div className={styles.overCard}>
                <h3>🔔 Recent Activity</h3>
                {NOTIFS.slice(0,5).map(n => (
                  <div key={n.id} className={`${styles.notifRow} ${!n.read ? styles.notifUnread : ''}`}>
                    <span className={styles.notifIcon}>{n.icon}</span>
                    <div className={styles.notifText}>{n.text}</div>
                    <span className={styles.notifTime}>{n.time}</span>
                  </div>
                ))}
                <button className={styles.seeAll} onClick={() => setActiveTab('notifications')}>
                  See all notifications →
                </button>
              </div>

              {/* User Status */}
              <div className={styles.overCard}>
                <h3>👥 User Account Timers</h3>
                {USERS.slice(0,6).map(u => (
                  <div key={u.id} className={styles.timerRow}>
                    <div className={styles.timerAvatar}>{u.username.slice(0,2).toUpperCase()}</div>
                    <div className={styles.timerInfo}>
                      <span className={styles.timerName}>{u.username}</span>
                      <span className={styles.timerJoined}>Joined {u.accountTimer} ago</span>
                    </div>
                    <span className={`${styles.timerStatus} ${styles[`status_${u.status}`]}`}>
                      {u.status}
                    </span>
                  </div>
                ))}
                <button className={styles.seeAll} onClick={() => setActiveTab('users')}>
                  Manage all users →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === 'notifications' && (
          <div>
            <div className={styles.notifHeader}>
              <div className={styles.notifFilterRow}>
                {NOTIF_FILTERS.map(f => (
                  <button key={f}
                    className={`${styles.filterBtn} ${notifFilter === f ? styles.filterBtnActive : ''}`}
                    onClick={() => setNotifFilter(f)}>{f}</button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button className={styles.markAll} onClick={markAllRead}>
                  ✓ Mark all read
                </button>
              )}
            </div>

            <div className={styles.notifList}>
              {filteredNotifs.length === 0
                ? <p className={styles.empty}>No notifications in this category.</p>
                : filteredNotifs.map(n => (
                <div key={n.id}
                  className={`${styles.notifCard} ${!n.read ? styles.notifCardUnread : ''}`}
                  onClick={() => markRead(n.id)}>
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

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div>
            <div className={styles.usersToolbar}>
              <input
                className={styles.userSearch}
                placeholder="🔍 Search users…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <span className={styles.userCount}>{filteredUsers.length} users</span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Recipes</th>
                    <th>Date Joined</th>
                    <th>Last Active</th>
                    <th>Timer Status</th>
                    <th>Account Status</th>
                    <th>Actions</th>
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
                      <td>
                        <span className={`${styles.rolePill} ${u.role === 'admin' ? styles.roleAdmin : ''}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className={styles.centerCell}>{u.recipes}</td>
                      <td className={styles.dateCell}>{u.joined}</td>
                      <td className={styles.dateCell}>{u.lastActive}</td>
                      <td className={styles.dateCell}>{u.accountTimer} ago</td>
                      <td>
                        <span className={`${styles.statusPill} ${styles[`status_${u.status}`]}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          {u.role !== 'admin' && (
                            <button className={styles.promoteBtn} onClick={() => promoteUser(u)}
                              title="Promote to Admin">⬆ Admin</button>
                          )}
                          <button className={styles.deleteBtn} onClick={() => setDeleteModal(u)}
                            title="Delete account">🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CREATE ACCOUNT TAB ── */}
        {activeTab === 'create-account' && (
          <CreateAccountForm />
        )}

        {/* ── FORUM TAB ── */}
        {activeTab === 'forum' && (
          <div>
            <div className={styles.forumHeader}>
              <h3>💬 User Forum Posts</h3>
              <span className={styles.forumSub}>Flagged posts require immediate review</span>
            </div>
            <div className={styles.forumList}>
              {FORUM_POSTS.map(p => (
                <div key={p.id} className={`${styles.forumCard} ${p.flagged ? styles.forumFlagged : ''}`}>
                  <div className={styles.forumMeta}>
                    <div className={styles.forumAvatar}>{p.author.slice(0,2).toUpperCase()}</div>
                    <div>
                      <div className={styles.forumAuthor}>{p.author}</div>
                      <div className={styles.forumTime}>{p.time}</div>
                    </div>
                    {p.flagged && <span className={styles.flaggedBadge}>🚩 Flagged</span>}
                  </div>
                  <p className={styles.forumTitle}>{p.title}</p>
                  <div className={styles.forumFooter}>
                    <span>{p.replies} replies</span>
                    <div className={styles.forumActions}>
                      <button className={styles.forumApprove}>✓ Approve</button>
                      {p.flagged && <button className={styles.forumRemove}>🗑 Remove</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === 'reports' && (
          <div>
            <h3 className={styles.reportsTitle}>📈 Statistical Report</h3>
            <div className={styles.reportGrid}>
              <div className={styles.reportCard}>
                <h4>Weekly Growth</h4>
                <div className={styles.barChart}>
                  {[
                    { day:'Mon', users:12, recipes:8  },
                    { day:'Tue', users:18, recipes:14 },
                    { day:'Wed', users:9,  recipes:6  },
                    { day:'Thu', users:22, recipes:19 },
                    { day:'Fri', users:28, recipes:24 },
                    { day:'Sat', users:35, recipes:31 },
                    { day:'Sun', users:15, recipes:11 },
                  ].map(d => (
                    <div key={d.day} className={styles.barGroup}>
                      <div className={styles.barWrap}>
                        <div className={styles.barUsers} style={{ height:`${(d.users/35)*80}px` }} title={`${d.users} users`} />
                        <div className={styles.barRecipes} style={{ height:`${(d.recipes/35)*80}px` }} title={`${d.recipes} recipes`} />
                      </div>
                      <span className={styles.barDay}>{d.day}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.chartLegend}>
                  <span><span className={styles.legendDotBlue} /> New Users</span>
                  <span><span className={styles.legendDotTerra} /> New Recipes</span>
                </div>
              </div>

              <div className={styles.reportCard}>
                <h4>Category Breakdown</h4>
                {[
                  { name:'Ulam',      count:842, pct:34 },
                  { name:'Breakfast', count:521, pct:21 },
                  { name:'Soups',     count:398, pct:16 },
                  { name:'Merienda',  count:341, pct:14 },
                  { name:'Rice Dishes',count:248, pct:10 },
                  { name:'Other',     count:131, pct:5  },
                ].map(c => (
                  <div key={c.name} className={styles.catRow}>
                    <span className={styles.catRowName}>{c.name}</span>
                    <div className={styles.catRowBar}>
                      <div className={styles.catRowFill} style={{ width:`${c.pct}%` }} />
                    </div>
                    <span className={styles.catRowCount}>{c.count}</span>
                    <span className={styles.catRowPct}>{c.pct}%</span>
                  </div>
                ))}
              </div>

              <div className={styles.reportCard}>
                <h4>Top Engagement</h4>
                {[
                  { label:'Avg. likes/recipe',   value:'16.6' },
                  { label:'Avg. comments/recipe', value:'3.7'  },
                  { label:'Challenge entry rate', value:'28%'  },
                  { label:'Return user rate',     value:'64%'  },
                  { label:'Mobile users',         value:'72%'  },
                  { label:'Avg. session time',    value:'4m 12s'},
                ].map(s => (
                  <div key={s.label} className={styles.engRow}>
                    <span>{s.label}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.reportCard}>
                <h4>User Status Summary</h4>
                {[
                  { label:'Active',   count: users.filter(u => u.status === 'active').length,   color:'#4caf50' },
                  { label:'Inactive', count: users.filter(u => u.status === 'inactive').length, color:'#ff9800' },
                  { label:'New',      count: users.filter(u => u.status === 'new').length,      color:'#2196f3' },
                  { label:'Admin',    count: users.filter(u => u.role === 'admin').length,      color:'#9c27b0' },
                ].map(s => (
                  <div key={s.label} className={styles.statusRow}>
                    <span className={styles.statusDot} style={{ background: s.color }} />
                    <span>{s.label}</span>
                    <strong className={styles.statusCount}>{s.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className={styles.modalOverlay} onClick={() => setDeleteModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3>Delete Account?</h3>
            <p>Are you sure you want to permanently delete <strong>{deleteModal.username}</strong>'s account?
               This action cannot be undone. An admin notification will be logged.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className={styles.modalConfirm} onClick={() => confirmDelete(deleteModal)}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
