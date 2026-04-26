import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './ForumPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const CATEGORIES = ['General','Recipes','Tips & Tricks','Budget Tips','Challenges','Questions']

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function ForumCard({ post, onDelete, isAdmin }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cat}>{post.category}</span>
        {post.author_role === 'admin' && <span className={styles.adminTag}>Admin</span>}
      </div>
      <h3 className={styles.cardTitle}>{post.title}</h3>
      <p className={styles.cardBody}>{post.body.slice(0,180)}{post.body.length > 180 ? '…' : ''}</p>
      <div className={styles.cardFooter}>
        <span className={styles.author}>👤 {post.author}</span>
        <span className={styles.time}>{timeAgo(post.created_at)}</span>
        <span className={styles.replies}>💬 {post.reply_count} replies</span>
        {isAdmin && (
          <button className={styles.deleteBtn} onClick={() => onDelete(post)}>🗑 Delete</button>
        )}
      </div>
    </div>
  )
}

function NewForumModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ title:'', body:'', category:'General' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch(`${API}/api/forums`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      onCreated(); onClose()
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>📝 New Forum Post</h3>
        {error && <p className={styles.error}>⚠ {error}</p>}
        <form onSubmit={submit} className={styles.form}>
          <label>Title *</label>
          <input required value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="What do you want to discuss?" />
          <label>Category</label>
          <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <label>Post *</label>
          <textarea required rows={5} value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} placeholder="Share your thoughts, questions, or tips…" />
          <div className={styles.modalActions}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Posting…':'Post'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ForumPage() {
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [filterCat,  setFilterCat]  = useState('All')
  const [search,     setSearch]     = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const isAdmin = user?.role === 'admin'

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/forums`)
      if (res.ok) setPosts(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchPosts() }, [])

  const handleDelete = async (post) => {
    try {
      await fetch(`${API}/api/forums/${post.id}`, {
        method:'DELETE', headers:{Authorization:`Bearer ${token}`}
      })
      setPosts(p => p.filter(f => f.id !== post.id))
    } catch {}
    setDeleteTarget(null)
  }

  const allCats = ['All', ...CATEGORIES]
  const displayed = posts.filter(p => {
    if (filterCat !== 'All' && p.category !== filterCat) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.body.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>💬 Community Forum</h1>
        <p>Discuss recipes, share tips, and ask questions with the community</p>
      </div>

      <div className="container">
        <div className={styles.toolbar}>
          <input className={styles.search} placeholder="🔍 Search posts…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {user && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ✍ New Post
            </button>
          )}
        </div>

        <div className={styles.catBar}>
          {allCats.map(c => (
            <button key={c}
              className={`${styles.catChip} ${filterCat===c ? styles.catActive : ''}`}
              onClick={() => setFilterCat(c)}>{c}</button>
          ))}
        </div>

        {loading ? <p className={styles.empty}>Loading…</p>
          : displayed.length === 0 ? (
            <div className={styles.emptyState}>
              <p>😅 No forum posts yet.{user ? ' Be the first to post!' : ' Log in to create a post!'}</p>
            </div>
          ) : (
            <div className={styles.list}>
              {displayed.map(p => (
                <ForumCard key={p.id} post={p} isAdmin={isAdmin}
                  onDelete={setDeleteTarget} />
              ))}
            </div>
          )}
      </div>

      {showModal && <NewForumModal token={token} onClose={() => setShowModal(false)} onCreated={fetchPosts} />}

      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>🗑 Delete Post?</h3>
            <p>Are you sure you want to delete "<strong>{deleteTarget.title}</strong>"?</p>
            <div className={styles.modalActions}>
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-primary" style={{background:'var(--terra)'}}
                onClick={() => handleDelete(deleteTarget)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
