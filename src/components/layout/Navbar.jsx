import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate }           from 'react-router-dom'
import { useAuth }                     from '../../context/AuthContext'
import styles                          from './Navbar.module.css'

const links = [
  { label: 'Feed',       href: '#feed'       },
  { label: 'Challenges', href: '#challenges' },
  { label: 'Categories', href: '#categories' },
  { label: 'About',      href: '#about'      },
]

export default function Navbar() {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [dropOpen,    setDropOpen]    = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, logout }              = useAuth()
  const navigate                      = useNavigate()
  const dropRef                       = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); setDropOpen(false); navigate('/') }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) { navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`); setSearchQuery('') }
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>Budget<span>Cooks</span></Link>

        <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          {links.map(l => (
            <li key={l.label}><a href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a></li>
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
            <button type="button" className={styles.searchClear} onClick={() => setSearchQuery('')}>×</button>
          )}
        </form>

        <div className={styles.actions}>
          {user ? (
            <div className={styles.profileWrap} ref={dropRef}>
              <button className={styles.avatarBtn} onClick={() => setDropOpen(o => !o)} aria-label="Profile menu">
                <span className={styles.avatarCircle}>{user.username.slice(0,2).toUpperCase()}</span>
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
