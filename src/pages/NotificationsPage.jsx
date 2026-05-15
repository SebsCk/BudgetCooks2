import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './NotificationsPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(ts).toLocaleDateString()
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const token     = localStorage.getItem('token')
  const seenAt    = parseInt(localStorage.getItem('notifSeenAt') || '0', 10)

  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch(`${API}/api/users/me/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setNotifs(data) })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Mark all as seen when the page is opened
    const now = Date.now()
    localStorage.setItem('notifSeenAt', now)
  }, [user])

  const handleClick = (n) => {
    if (n.type === 'follow') { navigate(`/profile/${n.actor}`); return }
    const dest = n.comment_id
      ? `/recipe/${n.recipe_id}/comments?comment=${n.comment_id}`
      : `/recipe/${n.recipe_id}/comments`
    navigate(dest)
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Link to="/feed" className={styles.backLink}>← Back to Feed</Link>
          <h1 className={styles.title}>🔔 Notifications</h1>
          <p className={styles.subtitle}>{notifs.length} total notification{notifs.length !== 1 ? 's' : ''}</p>
        </div>

        <div className={styles.list}>
          {loading && <p className={styles.empty}>Loading…</p>}

          {!loading && notifs.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔕</span>
              <p>No notifications yet.</p>
              <p className={styles.emptyHint}>When someone likes, comments on your recipes, or follows you, you'll see it here.</p>
            </div>
          )}

          {!loading && notifs.map((n, i) => {
            const isUnread = new Date(n.created_at).getTime() > seenAt
            return (
              <div
                key={i}
                className={`${styles.item} ${isUnread ? styles.unread : ''}`}
                onClick={() => handleClick(n)}
              >
                <div className={styles.iconWrap}>
                  {n.type === 'like' ? '❤️' : n.type === 'follow' ? '👤' : '💬'}
                </div>
                <div className={styles.itemBody}>
                  <p className={styles.itemText}>
                    <strong>{n.actor}</strong>{' '}
                    {n.type === 'follow' ? 'started following you' : n.type === 'like' ? 'liked' : 'commented on'}{' '}
                    {n.type !== 'follow' && <em>{n.recipe_title}</em>}
                  </p>
                  {n.type === 'comment' && n.preview && (
                    <p className={styles.preview}>"{n.preview}"</p>
                  )}
                  <span className={styles.itemTime}>{timeAgo(n.created_at)}</span>
                </div>
                {isUnread && <span className={styles.dot} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
