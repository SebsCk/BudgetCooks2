import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './RecipeCommentsPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

function CommentNode({ comment, token, currentUser, recipeId, onReply, onDelete, depth = 0, highlightId }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [flash, setFlash] = useState(false)
  const nodeRef = useRef(null)

  const isHighlighted = String(comment.id) === String(highlightId)

  useEffect(() => {
    if (isHighlighted && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 2500)
      return () => clearTimeout(t)
    }
  }, [isHighlighted])

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe_id: recipeId, body: replyText.trim(), parent_id: comment.id }),
      })
      if (res.ok) {
        const data = await res.json()
        const effectiveParentId = data.parent_id ?? comment.id
        onReply({
          id: data.id, body: replyText.trim(), parent_id: effectiveParentId,
          author: currentUser?.username || '?', replies: [],
          created_at: new Date().toISOString(),
        })
        setReplyText(''); setShowReply(false)
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div
      ref={nodeRef}
      className={`${styles.commentNode} ${depth > 0 ? styles.nested : ''} ${flash ? styles.highlighted : ''}`}
    >
      <div className={styles.avatar} style={{ width: depth > 0 ? 28 : 36, height: depth > 0 ? 28 : 36 }}>
        {(comment.author || '?').slice(0, 2).toUpperCase()}
      </div>
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <strong>{comment.author}</strong>
          <span className={styles.time}>{timeAgo(comment.created_at)}</span>
        </div>
        <p className={styles.commentBody}>{comment.body}</p>

        <div className={styles.commentActions}>
          {token && (
            <button className={styles.replyBtn} onClick={() => setShowReply(v => !v)}>
              {showReply ? 'Cancel' : '↩ Reply'}
            </button>
          )}
          {(comment.author === currentUser?.username || currentUser?.role === 'admin') && (
            <button className={styles.deleteCommentBtn} onClick={() => onDelete(comment.id)}>
              🗑 Delete
            </button>
          )}
        </div>

        {showReply && (
          <div className={styles.replyRow}>
            <div className={styles.avatar} style={{ width: 26, height: 26, fontSize: '0.65rem', flexShrink: 0 }}>
              {(currentUser?.username || '?').slice(0, 2).toUpperCase()}
            </div>
            <input
              className={styles.replyInput}
              placeholder={`Reply to ${comment.author}…`}
              value={replyText}
              autoFocus
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
            />
            <button className={styles.postBtn} onClick={submitReply} disabled={submitting || !replyText.trim()}>
              {submitting ? '…' : 'Post'}
            </button>
          </div>
        )}

        {comment.replies?.map(r => (
          <CommentNode key={r.id} comment={r} token={token} currentUser={currentUser}
            recipeId={recipeId} onReply={onReply} onDelete={onDelete} depth={depth + 1}
            highlightId={highlightId} />
        ))}
      </div>
    </div>
  )
}

export default function RecipeCommentsPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('comment')
  const { user } = useAuth()
  const token = localStorage.getItem('token')

  const [recipe,     setRecipe]     = useState(null)
  const [comments,   setComments]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [newComment, setNewComment] = useState('')
  const [posting,    setPosting]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [rRes, cRes] = await Promise.all([
          fetch(`${API}/api/recipes/${id}`),
          fetch(`${API}/api/comments?recipe_id=${id}`),
        ])
        if (rRes.ok) setRecipe(await rRes.json())
        else setError('Recipe not found.')
        if (cRes.ok) setComments(await cRes.json())
      } catch { setError('Failed to load. Check your connection.') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const postComment = async () => {
    if (!newComment.trim() || !token) return
    setPosting(true)
    try {
      const res = await fetch(`${API}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe_id: id, body: newComment.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments(cs => [...cs, {
          id: data.id, body: newComment.trim(), parent_id: null,
          author: user?.username || '?', replies: [],
          created_at: new Date().toISOString(),
        }])
        setNewComment('')
      }
    } finally { setPosting(false) }
  }

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      const res = await fetch(`${API}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setComments(cs => cs
          .filter(c => c.id !== commentId)
          .map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }))
        )
      }
    } catch (err) { console.error(err) }
  }

  const handleReply = (reply) => {
    setComments(cs => cs.map(c =>
      c.id === reply.parent_id ? { ...c, replies: [...(c.replies || []), reply] } : c
    ))
  }

  const totalCount = comments.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0)

  if (loading) return (
    <div className={styles.page}><p className={styles.empty}>Loading comments…</p></div>
  )
  if (error || !recipe) return (
    <div className={styles.page}>
      <p className={styles.empty}>{error || 'Recipe not found.'} <Link to="/feed">← Feed</Link></p>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.recipeHeader}>
        <Link to="/feed" className={styles.backLink}>← Back to Feed</Link>
        <div className={styles.recipeCard}>
          {recipe.image_url
            ? <img src={recipe.image_url} alt={recipe.title} className={styles.recipeImg} />
            : <div className={styles.recipePlaceholder}>🍽</div>
          }
          <div className={styles.recipeInfo}>
            {recipe.category && <span className={styles.tag}>{recipe.category}</span>}
            <h1 className={styles.recipeTitle}>{recipe.title}</h1>
            <div className={styles.recipeMeta}>
              <span>₱{recipe.estimated_cost || '—'} / batch</span>
              {recipe.servings && <span>· 🍽 {recipe.servings} servings</span>}
              {(recipe.prep_time_mins || recipe.cook_time_mins) && (
                <span>· ⏱ {(recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0)} mins</span>
              )}
            </div>
            <div className={styles.recipeAuthor}>
              <div className={styles.authorAvatar}>{(recipe.author || '?').slice(0, 2).toUpperCase()}</div>
              <span>{recipe.author || 'Anonymous'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients + Steps */}
      {(recipe.ingredients?.length > 0 || recipe.steps?.length > 0) && (
        <div className={styles.detailWrap}>
          {recipe.ingredients?.length > 0 && (
            <div className={styles.detailSection}>
              <h3 className={styles.detailHeading}>🛒 Ingredients</h3>
              <ul className={styles.ingredientList}>
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing.quantity} {ing.unit} {ing.name}{ing.notes ? ` — ${ing.notes}` : ''}</li>
                ))}
              </ul>
            </div>
          )}
          {recipe.steps?.length > 0 && (
            <div className={styles.detailSection}>
              <h3 className={styles.detailHeading}>👨‍🍳 Steps</h3>
              <ol className={styles.stepList}>
                {recipe.steps.map(s => <li key={s.step_number}>{s.instruction}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}

      <div className={styles.commentsWrap}>
        <h2 className={styles.commentsHeading}>💬 {totalCount} Comment{totalCount !== 1 ? 's' : ''}</h2>

        {comments.length === 0
          ? <p className={styles.empty}>No comments yet — be the first!</p>
          : <div className={styles.commentList}>
              {comments.map(c => (
                <CommentNode key={c.id} comment={c} token={token} currentUser={user}
                  recipeId={id} onReply={handleReply} onDelete={deleteComment} depth={0}
                  highlightId={highlightId} />
              ))}
            </div>
        }

        {token ? (
          <div className={styles.newCommentBox}>
            <div className={styles.avatar} style={{ width: 36, height: 36, flexShrink: 0 }}>
              {(user?.username || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className={styles.newCommentRight}>
              <textarea
                className={styles.newCommentInput}
                placeholder="Write a comment…"
                rows={3}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && postComment()}
              />
              <div className={styles.newCommentFooter}>
                <span className={styles.hint}>Ctrl+Enter to post</span>
                <button className={styles.postBtn} onClick={postComment} disabled={posting || !newComment.trim()}>
                  {posting ? 'Posting…' : '🍳 Post Comment'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.loginBox}>
            <Link to="/login" className={styles.loginLink}>Log in</Link> to join the conversation.
          </div>
        )}
      </div>
    </div>
  )
}
