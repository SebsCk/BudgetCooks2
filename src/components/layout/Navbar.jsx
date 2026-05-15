import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import styles       from './Navbar.module.css'

const links = [
  { label: 'Feed',       to: '/feed'       },
  { label: 'Challenges', to: '/challenges' },
  { label: 'Categories', to: '/categories' },
  { label: 'About',      to: '/about'      },
  { label: 'Forum',      to: '/forum'      },
]

export default function Navbar() {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [dropOpen,    setDropOpen]    = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifs,      setNotifs]      = useState([])
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [notifSeenAt, setNotifSeenAt] = useState(() => {
    return parseInt(localStorage.getItem('notifSeenAt') || '0', 10)
  })
  const { user, logout }              = useAuth()
  const navigate                      = useNavigate()
  const location                      = useLocation()
  const dropRef                       = useRef(null)
  const notifRef                      = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!location.search.includes('search=')) setSearchQuery('')
  }, [location])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token')

    const fetchNotifs = () => {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/users/me/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : []).then(data => {
        if (Array.isArray(data)) setNotifs(data)
      }).catch(() => {})
    }

    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); setDropOpen(false); navigate('/') }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/feed?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    if (location.search.includes('search=')) navigate('/feed')
  }

  const unreadCount = notifs.filter(n => new Date(n.created_at).getTime() > notifSeenAt).length

  const handleNotifToggle = () => {
    setNotifOpen(o => {
      if (!o) {
        const now = Date.now()
        localStorage.setItem('notifSeenAt', now)
        setNotifSeenAt(now)
      }
      return !o
    })
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>Budget<span>Cooks</span></Link>

        <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          {links.filter(l => !(l.label === 'About' && user)).map(l => (
            <li key={l.label}>
              <Link to={l.to} onClick={() => setMenuOpen(false)}
                className={location.pathname === l.to ? styles.activeLink : ''}>
                {l.label}
              </Link>
            </li>
          ))}
          {user?.role === 'admin' && (
            <li><Link to="/admin" onClick={() => setMenuOpen(false)} className={styles.adminLink}>⚙ Admin</Link></li>
          )}
        </ul>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <span className={styles.searchIcon}>🔍</span>
          <input className={styles.searchInput} type="text" placeholder="Search recipes…"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} aria-label="Search recipes" />
          {searchQuery && (
            <button type="button" className={styles.searchClear} onClick={clearSearch}>×</button>
          )}
        </form>

        <div className={styles.actions}>
          {user ? (
            <>
            <div className={styles.notifWrap} ref={notifRef}>
              <button className={styles.notifBtn} onClick={handleNotifToggle} aria-label="Notifications">
                🔔
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>{unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>Notifications</div>
                  {notifs.length === 0 ? (
                    <p className={styles.notifEmpty}>No notifications yet</p>
                  ) : (
                    <>
                      {notifs.slice(0, 5).map((n, i) => (
                        <div key={i} className={styles.notifItem} onClick={() => { navigate(`/recipe/${n.recipe_id}/comments`); setNotifOpen(false) }}>
                          <span className={styles.notifIcon}>{n.type === 'like' ? '❤️' : '💬'}</span>
                          <span className={styles.notifText}>
                            <strong>{n.actor}</strong> {n.type === 'like' ? 'liked' : 'commented on'} <em>{n.recipe_title}</em>
                          </span>
                        </div>
                      ))}
                      <Link
                        to="/notifications"
                        className={styles.notifViewAll}
                        onClick={() => setNotifOpen(false)}
                      >
                        View all {notifs.length} notifications →
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className={styles.profileWrap} ref={dropRef}>
              <button className={styles.avatarBtn} onClick={() => setDropOpen(o => !o)} aria-label="Profile menu">
                <Link to={`/profile/${user.username}`} className={styles.avatarCircleLink} onClick={e => e.stopPropagation()} title={`View ${user.username}'s profile`}>
                    {user.avatar_url
    ? <img src={user.avatar_url} alt="" className={styles.avatarCircle} style={{objectFit:'cover'}} />
    : <span className={styles.avatarCircle}>{user.username.slice(0,2).toUpperCase()}</span>}
                </Link>
                <span className={styles.greeting}>{user.username}</span>
                <span className={styles.chevron}>{dropOpen ? '▲' : '▼'}</span>
              </button>

              {dropOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropHeader}>
                    <div className={styles.dropAvatar}>{user.username.slice(0,2).toUpperCase()}</div>
                    <div>
                      <div className={styles.dropName}>{user.username}</div>
                      <div className={styles.dropRole}>{user.role}</div>
                    </div>
                  </div>
                  <hr className={styles.dropDivider} />
                  <Link to={`/profile/${user?.username}`} className={styles.dropItem} onClick={() => setDropOpen(false)}>👤 My Profile</Link>
                  <Link to="/shopping-list" className={styles.dropItem} onClick={() => setDropOpen(false)}>🛒 Shopping List</Link>
                  <Link to="/meal-planner"  className={styles.dropItem} onClick={() => setDropOpen(false)}>📅 Meal Planner</Link>
                  <hr className={styles.dropDivider} />
                  {user.role === 'admin' && (
                    <Link to="/admin" className={styles.dropItem} onClick={() => setDropOpen(false)}>⚙ Admin Dashboard</Link>
                  )}
                  <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>🚪 Log out</button>
                </div>
              )}
            </div>
            </>
          ) : (
            <>
              <Link to="/login"  className="btn btn-outline">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>

        <button className={styles.burger} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
