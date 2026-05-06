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

// ── Post detail modal ────────────────────────────────────────────────────────
function PostModal({ postId, token, user, onClose, onPostUpdated }) {
  const [post,        setPost]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [replyText,   setReplyText]   = useState('')
  const [posting,     setPosting]     = useState(false)
  const [editReplyId, setEditReplyId] = useState(null)
  const [editBody,    setEditBody]    = useState('')
  const [editingPost, setEditingPost] = useState(false)
  const [editPostBody,setEditPostBody]= useState('')
  const isAdmin = user?.role === 'admin'

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/forums/${postId}`)
      if (res.ok) { const data = await res.json(); setPost(data); setEditPostBody(data.body) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [postId])

  const postReply = async () => {
    if (!replyText.trim() || !token) return
    setPosting(true)
    try {
      const res = await fetch(`${API}/api/forums/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: replyText.trim() }),
      })
      if (res.ok) { setReplyText(''); load() }
    } finally { setPosting(false) }
  }

  const saveEditReply = async (replyId) => {
    if (!editBody.trim()) return
    try {
      await fetch(`${API}/api/forums/${postId}/replies/${replyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: editBody.trim() }),
      })
      setEditReplyId(null); load()
    } catch {}
  }

  const deleteReply = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return
    await fetch(`${API}/api/forums/${postId}/replies/${replyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    load()
  }

  const saveEditPost = async () => {
    if (!editPostBody.trim()) return
    await fetch(`${API}/api/forums/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: editPostBody.trim() }),
    })
    setEditingPost(false); load(); onPostUpdated?.()
  }

  const deletePost = async () => {
    if (!window.confirm('Delete this post? Your name will be removed but the thread will remain.')) return
    await fetch(`${API}/api/forums/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    onPostUpdated?.(); onClose()
  }

  if (loading || !post) return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <p style={{padding:'2rem',color:'var(--warm-gray)'}}>Loading…</p>
      </div>
    </div>
  )

  const canEditPost   = user && (user.username === post.author || isAdmin)
  const canDeletePost = user && (user.username === post.author || isAdmin)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{maxWidth:680,maxHeight:'88vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
        {/* Post header */}
        <div className={styles.postHeader}>
          <span className={styles.cat}>{post.category}</span>
          {post.author_role === 'admin' && <span className={styles.adminTag}>Admin</span>}
          {post.edited_at && <span className={styles.editedTag}>✏️ edited {timeAgo(post.edited_at)}</span>}
        </div>
        <h3 className={styles.modalTitle}>{post.title}</h3>

        {editingPost ? (
          <div className={styles.editBox}>
            <textarea className={styles.editInput} rows={5} value={editPostBody}
              onChange={e => setEditPostBody(e.target.value)} autoFocus />
            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={() => setEditingPost(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={saveEditPost}>Save</button>
            </div>
          </div>
        ) : (
          <p className={styles.postBodyFull}>{post.body}</p>
        )}

        <div className={styles.postMeta}>
          <span>👤 {post.author}</span>
          <span>{timeAgo(post.created_at)}</span>
          {canEditPost && !editingPost && (
            <button className={styles.metaBtn} onClick={() => setEditingPost(true)}>✏️ Edit</button>
          )}
          {canDeletePost && (
            <button className={styles.metaBtn} style={{color:'var(--terra)'}} onClick={deletePost}>🗑 Delete</button>
          )}
        </div>

        <hr style={{border:'none',borderTop:'1px solid var(--cream2)',margin:'1rem 0'}} />

        {/* Replies */}
        <h4 className={styles.repliesHeading}>💬 {post.replies?.length || 0} Replies</h4>
        <div className={styles.replyList}>
          {post.replies?.length === 0 && (
            <p className={styles.emptyReplies}>No replies yet — start the conversation!</p>
          )}
          {post.replies?.map(r => {
            const canEditReply   = user && (user.username === r.author || isAdmin)
            const canDeleteReply = user && (user.username === r.author || isAdmin)
            const isEditing = editReplyId === r.id
            return (
              <div key={r.id} className={styles.replyItem}>
                <div className={styles.replyAvatar}>{(r.author||'?').slice(0,2).toUpperCase()}</div>
                <div className={styles.replyContent}>
                  <div className={styles.replyMeta}>
                    <strong>{r.author}</strong>
                    {r.author_role === 'admin' && <span className={styles.adminTag}>Admin</span>}
                    <span className={styles.time}>{timeAgo(r.created_at)}</span>
                    {r.edited_at && <span className={styles.editedTag}>✏️ edited</span>}
                  </div>
                  {isEditing ? (
                    <div className={styles.editBox}>
                      <textarea className={styles.editInput} rows={3} value={editBody}
                        onChange={e => setEditBody(e.target.value)} autoFocus />
                      <div className={styles.editActions}>
                        <button className={styles.cancelBtn} onClick={() => setEditReplyId(null)}>Cancel</button>
                        <button className={styles.saveBtn} onClick={() => saveEditReply(r.id)}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.replyBody}>{r.body}</p>
                  )}
                  {!isEditing && (
                    <div className={styles.replyActions}>
                      {canEditReply && (
                        <button className={styles.metaBtn} onClick={() => { setEditReplyId(r.id); setEditBody(r.body) }}>✏️ Edit</button>
                      )}
                      {canDeleteReply && (
                        <button className={styles.metaBtn} style={{color:'var(--terra)'}} onClick={() => deleteReply(r.id)}>🗑 Delete</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Reply input */}
        {token ? (
          <div className={styles.replyInputWrap}>
            <div className={styles.replyAvatar}>{(user?.username||'?').slice(0,2).toUpperCase()}</div>
            <div style={{flex:1}}>
              <textarea
                className={styles.replyTextarea}
                placeholder="Write a reply…"
                rows={3}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && postReply()}
              />
              <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem',marginTop:'0.4rem'}}>
                <span style={{fontSize:'0.75rem',color:'var(--warm-gray)',alignSelf:'center'}}>Ctrl+Enter to post</span>
                <button className={styles.saveBtn} onClick={postReply} disabled={posting || !replyText.trim()}>
                  {posting ? 'Posting…' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p style={{fontSize:'0.85rem',color:'var(--warm-gray)',textAlign:'center',margin:'1rem 0'}}>
            <a href="/login" style={{color:'var(--terra)'}}>Log in</a> to reply.
          </p>
        )}

        <button className={styles.closeBtn} onClick={onClose}>✕ Close</button>
      </div>
    </div>
  )
}

// ── Forum card ───────────────────────────────────────────────────────────────
function ForumCard({ post, onClick }) {
  return (
    <div className={styles.card} onClick={onClick} style={{cursor:'pointer'}}>
      <div className={styles.cardHeader}>
        <span className={styles.cat}>{post.category}</span>
        {post.author_role === 'admin' && <span className={styles.adminTag}>Admin</span>}
        {post.edited_at && <span className={styles.editedTag}>✏️ edited</span>}
      </div>
      <h3 className={styles.cardTitle}>{post.title}</h3>
      <p className={styles.cardBody}>{post.body.slice(0,180)}{post.body.length > 180 ? '…' : ''}</p>
      <div className={styles.cardFooter}>
        <span className={styles.author}>👤 {post.author}</span>
        <span className={styles.time}>{timeAgo(post.created_at)}</span>
        <span className={styles.replies}>💬 {post.reply_count} replies</span>
      </div>
    </div>
  )
}

// ── New post modal ────────────────────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ForumPage() {
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [filterCat,  setFilterCat]  = useState('All')
  const [search,     setSearch]     = useState('')
  const [openPostId, setOpenPostId] = useState(null)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/forums`)
      if (res.ok) setPosts(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchPosts() }, [])

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
                <ForumCard key={p.id} post={p} onClick={() => setOpenPostId(p.id)} />
              ))}
            </div>
          )}
      </div>

      {showModal && <NewForumModal token={token} onClose={() => setShowModal(false)} onCreated={fetchPosts} />}

      {openPostId && (
        <PostModal
          postId={openPostId}
          token={token}
          user={user}
          onClose={() => setOpenPostId(null)}
          onPostUpdated={fetchPosts}
        />
      )}
    </div>
  )
}
