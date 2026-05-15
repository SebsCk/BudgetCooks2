import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './ProfilePage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function resizeImage(file, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width  = img.width  * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const token    = localStorage.getItem('token')
  const navigate = useNavigate()
  const { username } = useParams()
  const fileRef  = useRef(null)
  const isOwnProfile = user?.username === username

  const [profile,   setProfile]   = useState(null)
  const [recipes,   setRecipes]   = useState([])
  const [preview,   setPreview]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message,   setMessage]   = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!username) return
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    Promise.all([
      // If viewing own profile, use /me for full data; otherwise fetch by username
      isOwnProfile
        ? fetch(`${API}/api/users/me`, { headers }).then(r => r.ok ? r.json() : null)
        : fetch(`${API}/api/users/by-username/${username}`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/recipes?author=${username}`).then(r => r.ok ? r.json() : []),
    ]).then(([prof, recs]) => {
      if (prof) setProfile(prof)
      if (Array.isArray(recs)) setRecipes(recs)
    }).finally(() => setLoading(false))
  }, [username, isOwnProfile])

  const handleFileChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError('')
    try {
      const resized = await resizeImage(file, 200)
      setPreview(resized)
    } catch { setError('Could not process image.') }
  }

  const handleUpload = async () => {
    if (!preview) return
    setUploading(true); setMessage(''); setError('')
    try {
      const res = await fetch(`${API}/api/users/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar_url: preview }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Upload failed'); return }
      setProfile(p => ({ ...p, avatar_url: preview }))
      if (setUser) setUser(u => ({ ...u, avatar_url: preview }))
      setPreview(null)
      setMessage('Profile picture updated! ✅')
    } catch { setError('Network error') }
    finally { setUploading(false) }
  }

  const handleRemove = async () => {
    setUploading(true); setMessage(''); setError('')
    try {
      const res = await fetch(`${API}/api/users/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar_url: null }),
      })
      if (res.ok) {
        setProfile(p => ({ ...p, avatar_url: null }))
        if (setUser) setUser(u => ({ ...u, avatar_url: null }))
        setMessage('Profile picture removed.')
      }
    } catch { setError('Network error') }
    finally { setUploading(false) }
  }

  if (loading) return <div className={styles.page}><p style={{padding:'2rem'}}>Loading…</p></div>
  if (!profile) return <div className={styles.page}><p style={{padding:'2rem'}}>Could not load profile.</p></div>

  const avatarSrc = preview || profile.avatar_url
  const initials  = profile.username.slice(0, 2).toUpperCase()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>👤 My Profile</h1>
      </div>

      <div className={styles.inner}>
        {/* AVATAR CARD */}
        <div className={styles.card}>
          <h2>Profile Picture</h2>

          <div className={styles.avatarArea}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarPlaceholder}>{initials}</div>
            )}
            {isOwnProfile && <div className={styles.avatarActions}>
              <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                📷 Choose Photo
              </button>
              {profile.avatar_url && !preview && (
                <button className={styles.removeBtn} onClick={handleRemove} disabled={uploading}>
                  🗑 Remove
                </button>
              )}
            </div>
} </div>                         

          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
            onChange={handleFileChange} />

          {isOwnProfile && preview && (
            <div className={styles.previewActions}>
              <p className={styles.previewHint}>Preview — looks good?</p>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button className={styles.cancelBtn} onClick={() => setPreview(null)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading…' : '✅ Save Photo'}
                </button>
              </div>
            </div>
          )}

          {message && <p className={styles.success}>{message}</p>}
          {error   && <p className={styles.error}>⚠ {error}</p>}

          {isOwnProfile && <div className={styles.hints}>
            <p>• Accepted: JPG, PNG, GIF, WebP</p>
            <p>• Max display size: 200×200px (auto-resized)</p>
            <p>• Keep file under 500KB for best performance</p>
          </div>}
        </div>

        {/* PROFILE INFO */}
        <div className={styles.card}>
          <h2>Account Info</h2>
          <div className={styles.infoRow}><span>Username</span><strong>{profile.username}</strong></div>
          <div className={styles.infoRow}><span>Email</span><strong>{profile.email}</strong></div>
          <div className={styles.infoRow}><span>Role</span>
            <span className={`${styles.rolePill} ${profile.role === 'admin' ? styles.roleAdmin : ''}`}>{profile.role}</span>
          </div>
          <div className={styles.infoRow}><span>Member since</span>
            <strong>{new Date(profile.created_at).toLocaleDateString()}</strong>
          </div>
        </div>

        {/* MY RECIPES */}
        <div className={styles.card}>
          <h2>My Recipes ({recipes.length})</h2>
          {recipes.length === 0
            ? <p className={styles.empty}>You haven't shared any recipes yet.</p>
            : (
            <div className={styles.recipeList}>
              {recipes.map(r => (
                <div key={r.id} className={styles.recipeRow}>
                  <div className={styles.recipeInfo}>
                    <span className={styles.recipeTitle}>{r.title}</span>
                    <span className={styles.recipeMeta}>
                      {r.category && <span className={styles.tag}>{r.category}</span>}
                      ₱{r.estimated_cost} · ❤️ {r.like_count || 0}
                    </span>
                  </div>
                  <span className={styles.recipeDate}>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
