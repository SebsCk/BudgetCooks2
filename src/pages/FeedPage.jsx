import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './FeedPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const CATEGORIES = ['All','Breakfast','Rice Dishes','Soups','Ulam','Merienda','One-Pan','Snacks']

const CATEGORY_LIST = ['Breakfast','Rice Dishes','Soups','Ulam','Merienda','One-Pan','Snacks']

function EditRecipeModal({ recipe, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:          recipe.title || '',
    description:    recipe.description || '',
    estimated_cost: recipe.estimated_cost || '',
    servings:       recipe.servings || 1,
    prep_time_mins: recipe.prep_time_mins || 0,
    cook_time_mins: recipe.cook_time_mins || 0,
    category:       recipe.category || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      // Look up category_id from name
      let category_id = null
      try {
        const cats = await fetch(`${API}/api/categories`).then(r => r.json())
        const match = cats.find(c => c.name === form.category)
        if (match) category_id = match.id
      } catch {}
      const res = await fetch(`${API}/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          category_id,
          estimated_cost: Number(form.estimated_cost) || 0,
          servings:       Number(form.servings) || 1,
          prep_time_mins: Number(form.prep_time_mins) || 0,
          cook_time_mins: Number(form.cook_time_mins) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to update'); return }
      onSaved({ ...recipe, ...form })
      onClose()
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
      <div style={{background:'#fff',borderRadius:'12px',padding:'2rem',width:'100%',maxWidth:'500px',maxHeight:'90vh',overflowY:'auto'}}>
        <h3 style={{marginBottom:'1rem',fontSize:'1.1rem'}}>✏️ Edit Recipe</h3>
        {error && <p style={{color:'#b91c1c',background:'#fef2f2',padding:'0.5rem 0.75rem',borderRadius:'6px',marginBottom:'0.75rem',fontSize:'0.85rem'}}>⚠ {error}</p>}
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
            <label style={{fontSize:'0.82rem',fontWeight:600}}>Title *</label>
            <input required value={form.title} onChange={e=>sf('title',e.target.value)}
              style={{padding:'0.55rem 0.8rem',border:'1.5px solid #e2e8f0',borderRadius:'7px',fontSize:'0.9rem'}} />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
            <label style={{fontSize:'0.82rem',fontWeight:600}}>Category</label>
            <select value={form.category} onChange={e=>sf('category',e.target.value)}
              style={{padding:'0.55rem 0.8rem',border:'1.5px solid #e2e8f0',borderRadius:'7px',fontSize:'0.9rem'}}>
              <option value="">Select…</option>
              {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
            <label style={{fontSize:'0.82rem',fontWeight:600}}>Description</label>
            <textarea rows={3} value={form.description} onChange={e=>sf('description',e.target.value)}
              style={{padding:'0.55rem 0.8rem',border:'1.5px solid #e2e8f0',borderRadius:'7px',fontSize:'0.9rem',fontFamily:'inherit',resize:'vertical'}} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
              <label style={{fontSize:'0.82rem',fontWeight:600}}>Cost (₱)</label>
              <input type="number" value={form.estimated_cost} onChange={e=>sf('estimated_cost',e.target.value)}
                style={{padding:'0.55rem 0.8rem',border:'1.5px solid #e2e8f0',borderRadius:'7px',fontSize:'0.9rem'}} />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
              <label style={{fontSize:'0.82rem',fontWeight:600}}>Servings</label>
              <input type="number" min="1" value={form.servings} onChange={e=>sf('servings',e.target.value)}
                style={{padding:'0.55rem 0.8rem',border:'1.5px solid #e2e8f0',borderRadius:'7px',fontSize:'0.9rem'}} />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
              <label style={{fontSize:'0.82rem',fontWeight:600}}>Prep (mins)</label>
              <input type="number" min="0" value={form.prep_time_mins} onChange={e=>sf('prep_time_mins',e.target.value)}
                style={{padding:'0.55rem 0.8rem',border:'1.5px solid #e2e8f0',borderRadius:'7px',fontSize:'0.9rem'}} />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
              <label style={{fontSize:'0.82rem',fontWeight:600}}>Cook (mins)</label>
              <input type="number" min="0" value={form.cook_time_mins} onChange={e=>sf('cook_time_mins',e.target.value)}
                style={{padding:'0.55rem 0.8rem',border:'1.5px solid #e2e8f0',borderRadius:'7px',fontSize:'0.9rem'}} />
            </div>
          </div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'0.5rem'}}>
            <button type="button" onClick={onClose}
              style={{padding:'0.55rem 1.25rem',border:'1.5px solid #e2e8f0',borderRadius:'8px',background:'#fff',cursor:'pointer'}}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{padding:'0.55rem 1.25rem',border:'none',borderRadius:'8px',background:'var(--terra,#C1502A)',color:'#fff',fontWeight:600,cursor:'pointer'}}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TABS = ['🔥 Hot','✨ New','👑 Top','🏆 Challenges']

<<<<<<< HEAD
function CommentThread({ comment, token, onReply, currentUser }) {
=======
function CommentThread({ comment, token, onReply, currentUser, recipeId, depth = 0 }) {
>>>>>>> b5b503a (Comments fix)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
<<<<<<< HEAD
        body: JSON.stringify({ recipe_id: comment.recipe_id || comment.id, body: replyText.trim(), parent_id: comment.id }),
      })
      if (res.ok) {
        const data = await res.json()
        onReply({ id: data.id, body: replyText.trim(), parent_id: comment.id, author: currentUser?.username || '?', replies: [], created_at: new Date().toISOString() })
=======
        body: JSON.stringify({ recipe_id: recipeId, body: replyText.trim(), parent_id: comment.id }),
      })
      if (res.ok) {
        const data = await res.json()
        // backend may redirect deep replies to grandparent
        const effectiveParentId = data.parent_id ?? comment.id
        onReply({ id: data.id, body: replyText.trim(), parent_id: effectiveParentId, author: currentUser?.username || '?', replies: [], created_at: new Date().toISOString() })
>>>>>>> b5b503a (Comments fix)
        setReplyText('')
        setShowReply(false)
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className={styles.comment}>
      <div className={styles.commentAvatar}>{(comment.author||'?').slice(0,2).toUpperCase()}</div>
      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <strong>{comment.author}</strong>
          <span className={styles.commentTime}>{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <p className={styles.commentText}>{comment.body}</p>
<<<<<<< HEAD
        {token && !comment.parent_id && (
=======
        {token && (
>>>>>>> b5b503a (Comments fix)
          <button className={styles.replyBtn} onClick={() => setShowReply(v => !v)}>
            {showReply ? 'Cancel' : '↩ Reply'}
          </button>
        )}
        {showReply && (
          <div className={styles.replyBox}>
<<<<<<< HEAD
            <input placeholder="Write a reply…" value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
              className={styles.replyInput} />
=======
            <input placeholder={`Reply to ${comment.author}…`} value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
              className={styles.replyInput} autoFocus />
>>>>>>> b5b503a (Comments fix)
            <button className={styles.replySubmit} onClick={submitReply} disabled={submitting || !replyText.trim()}>
              {submitting ? '…' : 'Post'}
            </button>
          </div>
        )}
        {comment.replies?.map(r => (
          <div key={r.id} className={styles.nestedComment}>
<<<<<<< HEAD
            <div className={styles.commentAvatar} style={{width:26,height:26,fontSize:'0.68rem'}}>{(r.author||'?').slice(0,2).toUpperCase()}</div>
            <div className={styles.commentBody}>
              <div className={styles.commentMeta}>
                <strong>{r.author}</strong>
                <span className={styles.commentTime}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className={styles.commentText}>{r.body}</p>
            </div>
=======
            <CommentThread
              comment={r}
              token={token}
              onReply={onReply}
              currentUser={currentUser}
              recipeId={recipeId}
              depth={depth + 1}
            />
>>>>>>> b5b503a (Comments fix)
          </div>
        ))}
      </div>
    </div>
  )
}

function RecipeCard({ recipe, liked, onLike, currentUser, onDelete, onEdit }) {
  const totalMins = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0)
  const timeStr   = totalMins ? `${totalMins} mins` : '—'
  const token     = localStorage.getItem('token')

  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText,  setCommentText]  = useState('')
  const [posting,      setPosting]      = useState(false)
  const [commentCount, setCommentCount] = useState(recipe.comment_count || 0)

  const loadComments = async () => {
    if (commentsLoaded) return
    try {
      const res = await fetch(`${API}/api/comments?recipe_id=${recipe.id}`)
      if (res.ok) { setComments(await res.json()); setCommentsLoaded(true) }
    } catch {}
  }

  const toggleComments = () => {
    if (!showComments) loadComments()
    setShowComments(v => !v)
  }

  const postComment = async () => {
    if (!commentText.trim() || !token) return
    setPosting(true)
    try {
      const res = await fetch(`${API}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe_id: recipe.id, body: commentText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        const newComment = { id: data.id, body: commentText.trim(), parent_id: null, author: currentUser?.username || '?', replies: [], created_at: new Date().toISOString() }
        setComments(cs => [...cs, newComment])
        setCommentCount(n => n + 1)
        setCommentText('')
      }
    } finally { setPosting(false) }
  }

  const handleReply = (reply) => {
    setComments(cs => cs.map(c => c.id === reply.parent_id ? { ...c, replies: [...(c.replies||[]), reply] } : c))
    setCommentCount(n => n + 1)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/feed?recipe=${recipe.id}`).catch(() => {})
  }

  return (
    <article className={styles.card}>
      {recipe.image_url && (
        <div className={styles.cardImgPhoto}>
          <img src={recipe.image_url} alt={recipe.title} className={styles.recipePhoto} />
        </div>
      )}
      {!recipe.image_url && (
        <div className={styles.cardImg}>
          <span>{recipe.emoji || '🍽'}</span>
        </div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.tags}>
          {recipe.category && <span className="tag">{recipe.category}</span>}
        </div>
        <h3 className={styles.title}>{recipe.title}</h3>
        <p className={styles.meta}>
          <span>⏱ {timeStr}</span>
          <span> · </span>
          <span>🍽 {recipe.servings || 1} serving{recipe.servings !== 1 ? 's' : ''}</span>
          <span> · </span>
          <span>📅 {new Date(recipe.created_at).toLocaleDateString()}</span>
        </p>
        <div className={styles.footer}>
          <div className={styles.cost}>₱{recipe.estimated_cost || '—'} <span>/ batch</span></div>
          <div className={styles.actions}>
            <button className={`${styles.actionBtn} ${liked ? styles.liked : ''}`} onClick={() => onLike(recipe.id)}>
              {liked ? '❤️' : '🤍'} {(parseInt(recipe.like_count) || 0) + (liked ? 1 : 0)}
            </button>
            <button className={`${styles.actionBtn} ${showComments ? styles.commentActive : ''}`} onClick={toggleComments}>
              💬 {commentCount}
            </button>
            <button className={styles.actionBtn} onClick={handleCopyLink} title="Copy link">🔗</button>
            {(currentUser?.username === recipe.author || currentUser?.role === 'admin') && (<>
              <button className={styles.editRecipeBtn}
                onClick={() => onEdit && onEdit(recipe)}>✏️</button>
              <button className={styles.deleteRecipeBtn}
                onClick={() => onDelete && onDelete(recipe)}>🗑</button>
            </>)}
          </div>
          <div className={styles.author}>
            <span className={styles.avatar}>{(recipe.author || '?').slice(0,2).toUpperCase()}</span>
            {recipe.author || 'Anonymous'}
          </div>
        </div>

        {/* ── Comment Panel ── */}
        {showComments && (
          <div className={styles.commentPanel}>
            {comments.length === 0 && commentsLoaded && (
              <p className={styles.noComments}>No comments yet. Be the first!</p>
            )}
<<<<<<< HEAD
            {comments.map(c => (
              <CommentThread key={c.id} comment={{...c, recipe_id: recipe.id}} token={token} onReply={handleReply} currentUser={currentUser} />
            ))}
=======
            {(commentCount >= 3 ? comments.slice(0, 2) : comments).map(c => (
              <CommentThread key={c.id} comment={c} token={token} onReply={handleReply} currentUser={currentUser} recipeId={recipe.id} />
            ))}
            {commentCount >= 3 && (
              <a href={`/recipe/${recipe.id}/comments`} className={styles.viewAllLink}>
                💬 View all {commentCount} comments →
              </a>
            )}
>>>>>>> b5b503a (Comments fix)
            {token ? (
              <div className={styles.commentInputRow}>
                <div className={styles.commentAvatar} style={{flexShrink:0}}>{(currentUser?.username||'?').slice(0,2).toUpperCase()}</div>
                <input
                  className={styles.commentInput}
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                />
                <button className={styles.commentSubmit} onClick={postComment} disabled={posting || !commentText.trim()}>
                  {posting ? '…' : 'Post'}
                </button>
              </div>
            ) : (
              <p className={styles.loginPrompt}>
                <a href="/login">Log in</a> to leave a comment.
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default function FeedPage() {
  const [recipes,   setRecipes]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [likes,     setLikes]     = useState({})
  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [editRecipe, setEditRecipe] = useState(null)
  const navigate = useNavigate()
  const currentUser = (() => { try { return JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '')) } catch { return null } })()
  const location = useLocation()

  const params      = new URLSearchParams(location.search)
  const urlCategory = params.get('category') || 'All'
  const urlSearch   = params.get('search')   || ''

  useEffect(() => { setFilterCat(urlCategory) }, [urlCategory])
  useEffect(() => { setSearch(urlSearch) },      [urlSearch])

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/recipes`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setRecipes(Array.isArray(data) ? data : []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }, [])

  const clearAll = () => { setSearch(''); setFilterCat('All'); navigate('/feed') }

  const displayed = useMemo(() => {
    let list = [...recipes]
    if (filterCat !== 'All') list = list.filter(r => r.category === filterCat)
    const q = search || urlSearch
    if (q) list = list.filter(r =>
      r.title?.toLowerCase().includes(q.toLowerCase()) ||
      r.author?.toLowerCase().includes(q.toLowerCase())
    )
    if (activeTab === 1) list = [...list].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    else if (activeTab === 2) list = [...list].sort((a,b) => (b.like_count||0) - (a.like_count||0))
    else if (activeTab === 0) list = [...list].sort((a,b) => ((b.like_count||0)+(b.comment_count||0)*2) - ((a.like_count||0)+(a.comment_count||0)*2))
    else if (activeTab === 3) list = list.filter(r => r.challenge_id)
    return list
  }, [recipes, filterCat, search, urlSearch, activeTab])

  const hasFilter = search || urlSearch || filterCat !== 'All'

  const handleDeleteRecipe = async (recipe) => {
    if (!window.confirm(`Delete "${recipe.title}"?`)) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/api/recipes/${recipe.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setRecipes(rs => rs.filter(r => r.id !== recipe.id))
      else alert('Failed to delete recipe')
    } catch { alert('Network error') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>🍳 Community Feed</h1>
        <p>Discover budget-friendly Filipino recipes shared by the community</p>
      </div>

      <div className="container">
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <input className={styles.search} placeholder="🔍 Search recipes or cooks…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {(search || urlSearch) && (
              <button className={styles.clearBtn} onClick={clearAll}>✕ Clear</button>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/share')}>＋ Add Recipe</button>
        </div>

        <div className={styles.tabs}>
          {TABS.map((t,i) => (
            <button key={t} className={`${styles.tab} ${activeTab===i ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(i)}>{t}</button>
          ))}
        </div>

        <div className={styles.catBar}>
          {CATEGORIES.map(c => (
            <button key={c}
              className={`${styles.catChip} ${filterCat===c ? styles.catActive : ''}`}
              onClick={() => { setFilterCat(c); navigate(c==='All' ? '/feed' : `/feed?category=${encodeURIComponent(c)}`) }}>
              {c}
            </button>
          ))}
        </div>

        {(search || urlSearch) && (
          <p style={{padding:'0.25rem 0 0.75rem',color:'var(--moss)',fontWeight:500}}>
            🔍 Results for "<strong>{search || urlSearch}</strong>" — {displayed.length} found
          </p>
        )}

        {loading ? (
          <p className={styles.empty}>Loading recipes…</p>
        ) : displayed.length === 0 ? (
          <div className={styles.emptyState}>
            <p>😅 {hasFilter ? 'No recipes match your filters.' : 'No recipes yet. Be the first to share one!'}</p>
            {hasFilter && (
              <button className="btn btn-outline"
                style={{color:'var(--terra)',borderColor:'var(--terra)',marginTop:'0.75rem'}}
                onClick={clearAll}>✕ Clear filters</button>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {displayed.map(r => (
              <RecipeCard key={r.id} recipe={r}
                liked={!!likes[r.id]}
                onLike={async (id) => {
                  const token = localStorage.getItem('token')
                  if (!token) { navigate('/login'); return }
                  // optimistic toggle
                  setLikes(p => ({...p,[id]:!p[id]}))
                  try {
                    await fetch(`${API}/api/recipes/${id}/like`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` }
                    })
                  } catch {
                    // revert on failure
                    setLikes(p => ({...p,[id]:!p[id]}))
                  }
                }}
                currentUser={currentUser}
                onDelete={handleDeleteRecipe}
                onEdit={setEditRecipe} />
            ))}
          </div>
        )}
      </div>
      {editRecipe && (
        <EditRecipeModal
          recipe={editRecipe}
          token={localStorage.getItem('token')}
          onClose={() => setEditRecipe(null)}
          onSaved={updated => {
            setRecipes(rs => rs.map(r => r.id === updated.id ? { ...r, ...updated } : r))
            setEditRecipe(null)
          }}
        />
      )}
    </div>
  )
}