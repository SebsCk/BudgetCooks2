import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './ProfilePage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

function RecipeMini({ recipe }) {
  return (
    <Link to={`/recipe/${recipe.id}/comments`} className={styles.recipeCard}>
      <div className={styles.recipeThumb}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} loading="lazy" />
          : <span>🍽</span>
        }
      </div>
      <div className={styles.recipeInfo}>
        <p className={styles.recipeTitle}>{recipe.title}</p>
        <p className={styles.recipeMeta}>
          ❤️ {recipe.like_count || 0}
          {recipe.estimated_cost ? ` · ₱${recipe.estimated_cost}` : ''}
        </p>
      </div>
    </Link>
  )
}

export default function ProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [profile,   setProfile]   = useState(null)
  const [tab,       setTab]       = useState('recipes')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [bookmarks, setBookmarks] = useState([])

  const isMe = user?.username === username
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError,     setAvatarError]     = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setAvatarError('Image must be under 2 MB'); return }
    setAvatarUploading(true); setAvatarError('')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const res = await fetch(`${API}/api/users/me/avatar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatar_url: ev.target.result }),
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(p => ({ ...p, user: { ...p.user, avatar_url: data.avatar_url } }))
          setAvatarError('')
        } else {
          setAvatarError('Failed to update photo.')
        }
      } catch { setAvatarError('Network error.') }
      finally { setAvatarUploading(false) }
    }
    reader.readAsDataURL(file)
  }
  const [deletePassword,    setDeletePassword]    = useState('')
  const [deleteError,       setDeleteError]       = useState('')
  const [deleting,          setDeleting]          = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`${API}/api/users/${username}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => setProfile(data))
      .catch(() => setError('User not found.'))
      .finally(() => setLoading(false))
  }, [username])

  useEffect(() => {
    if (!isMe || !token) return
    fetch(`${API}/api/users/me/bookmarks`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setBookmarks(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [isMe, token])

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.skeletonHero} />
      <div className={styles.skeletonContent} />
    </div>
  )

  if (error || !profile) return (
    <div className={styles.page}>
      <p className={styles.empty}>{error || 'User not found.'} <Link to="/feed">← Feed</Link></p>
    </div>
  )

  const totalLikes = (profile.recipes || []).reduce((n, r) => n + (r.like_count || 0), 0)

  const TABS = [
    { id: 'recipes',    label: `🍳 Recipes (${profile.recipes?.length || 0})` },
    ...(isMe ? [{ id: 'liked', label: `❤️ Liked (${profile.liked?.length || 0})` }] : []),
    { id: 'challenges', label: `🏆 Challenges (${profile.challenges?.length || 0})` },
    ...(isMe ? [{ id: 'saved', label: `🔖 Saved (${bookmarks.length})` }] : []),
  ]

  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Please enter your password to confirm.'); return }
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      })
      if (res.ok) {
        localStorage.removeItem('token')
        window.location.href = '/'
      } else {
        const d = await res.json()
        setDeleteError(d.error || 'Failed to delete account.')
      }
    } catch { setDeleteError('Network error.') }
    finally { setDeleting(false) }
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.avatarWrap}>
          {profile.user?.avatar_url
            ? <img src={profile.user.avatar_url} alt={username} className={styles.avatarImg} />
            : <div className={styles.avatar}>{username.slice(0, 2).toUpperCase()}</div>
          }
          {isMe && (
            <label className={styles.avatarOverlay} title="Change profile photo">
              {avatarUploading ? '⏳' : '📷'}
              <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload} />
            </label>
          )}
          {avatarError && <p className={styles.avatarError}>{avatarError}</p>}
        </div>
        <div className={styles.heroInfo}>
          <h1 className={styles.username}>{username}</h1>
          <p className={styles.joined}>Joined {new Date(profile.user?.created_at).toLocaleDateString()}</p>
          <div className={styles.statRow}>
            <div className={styles.stat}><strong>{profile.recipes?.length || 0}</strong><span>Recipes</span></div>
            <div className={styles.stat}><strong>{totalLikes}</strong><span>Total Likes</span></div>
            <div className={styles.stat}><strong>{profile.liked?.length || 0}</strong><span>Liked</span></div>
          </div>
        </div>
        <div className={styles.heroActions}>
          {isMe ? (
            <>
              <button className={styles.editBtn} onClick={() => navigate('/share')}>+ Add Recipe</button>
              <button className={styles.dangerBtn} onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
            </>
          ) : (
            <button className={styles.editBtn} onClick={() => navigate('/feed')}>Browse Recipes</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.content}>
        {tab === 'recipes' && (
          profile.recipes?.length === 0
            ? <p className={styles.empty}>No recipes shared yet.</p>
            : <div className={styles.grid}>{profile.recipes.map(r => <RecipeMini key={r.id} recipe={r} />)}</div>
        )}
        {tab === 'liked' && (
          profile.liked?.length === 0
            ? <p className={styles.empty}>No liked recipes yet.</p>
            : <div className={styles.grid}>{profile.liked.map(r => <RecipeMini key={r.id} recipe={{...r, like_count: undefined}} />)}</div>
        )}
        {tab === 'challenges' && (
          profile.challenges?.length === 0
            ? <p className={styles.empty}>No challenge entries yet.</p>
            : <div className={styles.challengeList}>
                {profile.challenges.map(c => (
                  <div key={c.id} className={styles.challengeRow}>
                    <div>
                      <p className={styles.challengeTitle}>{c.title}</p>
                      <p className={styles.challengeMeta}>Submitted: {c.recipe_title}</p>
                    </div>
                    <span className={`${styles.statusPill} ${styles[`status_${c.status}`]}`}>{c.status}</span>
                  </div>
                ))}
              </div>
        )}
        {tab === 'saved' && isMe && (
          bookmarks.length === 0
            ? <p className={styles.empty}>No saved recipes yet.</p>
            : <div className={styles.grid}>{bookmarks.map(r => <RecipeMini key={r.id} recipe={r} />)}</div>
        )}
      </div>

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>⚠️</div>
            <h3>Delete Your Account?</h3>
            <p>Your account will be permanently deleted. Your recipes and forum posts will remain but show as <strong>Deleted User</strong> — only admins can remove them.</p>
            <p style={{fontSize:'0.85rem',color:'#888',marginTop:'0.5rem'}}>Tip: delete your posts first if you want them removed.</p>
            {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
            <input
              type="password" placeholder="Enter your password to confirm"
              value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
              className={styles.deleteInput}
            />
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError('') }}>Cancel</button>
              <button className={styles.modalConfirm} onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
