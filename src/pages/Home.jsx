import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './Home.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const CATEGORIES = [
  { emoji:'🍳', label:'Breakfast' },{ emoji:'🍚', label:'Rice Dishes' },
  { emoji:'🍲', label:'Soups' },    { emoji:'🫙', label:'Ulam' },
  { emoji:'🍡', label:'Merienda' }, { emoji:'🥘', label:'One-Pan' },
  { emoji:'🍟', label:'Snacks' },
]

const COMMENT_FILTERS = ['All', 'Positive', 'Question', 'Suggestion']

function CommentSection({ recipeId, token }) {
  const [filter, setFilter]     = useState('All')
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch(`${API}/api/comments?recipe_id=${recipeId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [recipeId])

  const filtered = filter === 'All' ? comments : comments.filter(c => c.category === filter)

  const postComment = async () => {
    if (!newComment.trim() || !token) return
    try {
      const res = await fetch(`${API}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe_id: recipeId, body: newComment }),
      })
      if (res.ok) {
        const c = await res.json()
        setComments(prev => [...prev, { ...c, body: newComment, created_at: new Date().toISOString() }])
        setNewComment('')
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div className={styles.commentSection}>
      <div className={styles.commentHeader}>
        <span className={styles.commentTitle}>Comments ({comments.length})</span>
        <div className={styles.commentFilters}>
          {COMMENT_FILTERS.map(f => (
            <button key={f} className={`${styles.cfBtn} ${filter === f ? styles.cfActive : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>
      {loading ? <p className={styles.noComments}>Loading...</p>
        : filtered.length === 0 ? <p className={styles.noComments}>No {filter.toLowerCase()} comments yet.</p>
        : (
          <div className={styles.commentList}>
            {filtered.map((c, i) => (
              <div key={c.id || i} className={styles.commentItem}>
                <div className={styles.commentAvatar}>{(c.author || c.username || '?').slice(0,2).toUpperCase()}</div>
                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <strong>{c.author || c.username}</strong>
                    <span className={styles.commentTime}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p>{c.body || c.text || c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      <div className={styles.commentInputRow}>
        <input className={styles.commentInput} placeholder={token ? 'Add a comment...' : 'Log in to comment'}
          value={newComment} onChange={e => setNewComment(e.target.value)} disabled={!token}
          onKeyDown={e => e.key === 'Enter' && postComment()} />
        <button className={`btn btn-primary ${styles.commentPost}`} onClick={postComment} disabled={!token}>Post</button>
      </div>
    </div>
  )
}

function RecipeCard({ recipe, onLike, liked, onBookmark, bookmarked, token }) {
  const [expanded,      setExpanded]      = useState(false)
  const [detail,        setDetail]        = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [reportOpen,    setReportOpen]    = useState(false)
  const [reportReason,  setReportReason]  = useState('')
  const [reportSent,    setReportSent]    = useState(false)

  const openDetail = async () => {
    if (detail) { setDetail(null); return }
    setLoadingDetail(true)
    try {
      const res = await fetch(`${API}/api/recipes/${recipe.id}`)
      if (res.ok) setDetail(await res.json())
    } catch {}
    finally { setLoadingDetail(false) }
  }

  const submitReport = async () => {
    if (!reportReason.trim() || !token) return
    try {
      await fetch(`${API}/api/recipes/${recipe.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reportReason }),
      })
      setReportSent(true)
    } catch {}
  }

  const totalMins = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0)

  return (
    <article className={styles.recipeCard}>
      {recipe.image_url ? (
        <div className={styles.recipeImgPhoto}>
          <img src={recipe.image_url} alt={recipe.title} className={styles.recipePhoto} />
        </div>
      ) : (
        <div className={styles.recipeImg} style={{ background: recipe.id % 2 === 0 ? 'var(--cream)' : 'var(--cream2)' }}>
          <span>{recipe.emoji || '🍽'}</span>
        </div>
      )}
      <div className={styles.recipeBody}>
        <div className={styles.recipeTags}>
          {recipe.category && <span className="tag">{recipe.category}</span>}
        </div>
        <h3 className={styles.recipeTitle}>{recipe.title}</h3>
        <p className={styles.recipeMeta}>
          <span>⏱ {totalMins ? `${totalMins} mins` : '—'}</span>
          <span className={styles.dot}>·</span>
          <span>🍽 {recipe.servings || 1} serving{(recipe.servings || 1) > 1 ? 's' : ''}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.datePosted}>📅 {new Date(recipe.created_at).toLocaleDateString()}</span>
        </p>
        <div className={styles.recipeFooter}>
          <div className={styles.recipeCost}>₱{recipe.estimated_cost || '—'} <span>/ batch</span></div>
          <div className={styles.recipeActions}>
            <button className={`${styles.actionBtn} ${liked ? styles.liked : ''}`} onClick={() => onLike(recipe.id)}>
              {liked ? '❤️' : '🤍'} {parseInt(recipe.like_count) || 0}
            </button>
            <button className={styles.actionBtn} onClick={() => setExpanded(v => !v)}>
              💬 {recipe.comment_count || 0}
            </button>
            <button
              className={`${styles.actionBtn} ${bookmarked ? styles.bookmarked : ''}`}
              onClick={() => onBookmark && onBookmark(recipe.id)}
              title={bookmarked ? 'Remove bookmark' : 'Save recipe'}>
              {bookmarked ? '🔖' : '📌'}
            </button>
            <button className={styles.actionBtn} onClick={openDetail} title="View steps & ingredients">
              {loadingDetail ? '...' : detail ? '✕' : '📋'}
            </button>
            {token && (
              <button className={styles.actionBtn} onClick={() => setReportOpen(v => !v)} title="Report">🚩</button>
            )}
          </div>
          <div className={styles.recipeAuthor}>
            <span className={styles.avatar} style={{ background: '#C1502A' }}>
              {(recipe.author || recipe.username || '?').slice(0,2).toUpperCase()}
            </span>
            {recipe.author || recipe.username}
          </div>
        </div>

        {detail && (
          <div className={styles.detailPanel}>
            {detail.ingredients?.length > 0 && (
              <div className={styles.detailSection}>
                <h4>🛒 Ingredients</h4>
                <ul className={styles.ingredientList}>
                  {detail.ingredients.map((ing, i) => (
                    <li key={i}>{ing.quantity} {ing.unit} {ing.name}{ing.notes ? ` — ${ing.notes}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
            {detail.steps?.length > 0 && (
              <div className={styles.detailSection}>
                <h4>👨‍🍳 Steps</h4>
                <ol className={styles.stepList}>
                  {detail.steps.map(s => <li key={s.step_number}>{s.instruction}</li>)}
                </ol>
              </div>
            )}
            {!detail.ingredients?.length && !detail.steps?.length && (
              <p className={styles.noDetail}>No steps or ingredients added yet.</p>
            )}
          </div>
        )}

        {reportOpen && token && (
          <div className={styles.reportBox}>
            {reportSent ? (
              <p className={styles.reportSent}>Report submitted. Thank you!</p>
            ) : (
              <>
                <p className={styles.reportLabel}>🚩 Report this recipe</p>
                <select className={styles.reportSelect} value={reportReason} onChange={e => setReportReason(e.target.value)}>
                  <option value="">Select a reason...</option>
                  <option value="False or misleading information">False or misleading information</option>
                  <option value="Sexual or inappropriate content">Sexual or inappropriate content</option>
                  <option value="Spam or advertisement">Spam or advertisement</option>
                  <option value="Hate speech or harassment">Hate speech or harassment</option>
                  <option value="Other">Other</option>
                </select>
                <div className={styles.reportActions}>
                  <button className={styles.reportCancel} onClick={() => setReportOpen(false)}>Cancel</button>
                  <button className={styles.reportSubmit} onClick={submitReport} disabled={!reportReason}>Submit</button>
                </div>
              </>
            )}
          </div>
        )}

        {expanded && <CommentSection recipeId={recipe.id} token={token} />}
      </div>
    </article>
  )
}

const TABS = ['🔥 Hot', '✨ New', '👑 Top', '🏆 Challenges']

export default function Home() {
  const [activeTab,    setActiveTab]    = useState(0)
  const [likes,        setLikes]        = useState({})
  const [bookmarks,    setBookmarks]    = useState({})
  const [filterCat,    setFilterCat]    = useState('All')
  const [filterLatest, setFilterLatest] = useState(false)
  const [recipes,      setRecipes]      = useState([])
  const [challenges,   setChallenges]   = useState([])
  const [topCooks,     setTopCooks]     = useState([])
  const [stats,        setStats]        = useState(null)
  const [loadingFeed,  setLoadingFeed]  = useState(true)
  const [searchInput,  setSearchInput]  = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef(null)
  const location  = useLocation()
  const navigate  = useNavigate()

  const token = localStorage.getItem('token')

  const urlSearch = new URLSearchParams(location.search).get('search') || ''
  useEffect(() => {
    setSearchInput(urlSearch)
    setDebouncedSearch(urlSearch)
  }, [urlSearch])

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchInput(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 300)
  }

  useEffect(() => {
    async function fetchAll() {
      setLoadingFeed(true)
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const [recipesRes, challengesRes, topCooksRes, statsRes] = await Promise.all([
          fetch(`${API}/api/recipes`, { headers }),
          fetch(`${API}/api/challenges?status=active`),
          fetch(`${API}/api/users/top-cooks`),
          fetch(`${API}/api/users/stats`),
        ])
        if (recipesRes.ok) {
          const data = await recipesRes.json()
          setRecipes(Array.isArray(data) ? data : [])
          const initialLikes = {}, initialBookmarks = {}
          ;(Array.isArray(data) ? data : []).forEach(r => {
            if (r.user_liked) initialLikes[r.id] = true
            if (r.user_bookmarked) initialBookmarks[r.id] = true
          })
          setLikes(initialLikes)
          setBookmarks(initialBookmarks)
        }
        if (challengesRes.ok) setChallenges(await challengesRes.json())
        if (topCooksRes.ok)   setTopCooks(await topCooksRes.json())
        if (statsRes.ok)      setStats(await statsRes.json())
      } catch (err) { console.error('Failed to load home data', err) }
      finally { setLoadingFeed(false) }
    }
    fetchAll()
  }, [token])

  const toggleLike = async (id) => {
    if (!token) { navigate('/login'); return }
    try {
      const res = await fetch(`${API}/api/recipes/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const { liked } = await res.json()
        setLikes(prev => ({ ...prev, [id]: liked }))
        setRecipes(rs => rs.map(r =>
          r.id === id ? { ...r, like_count: (parseInt(r.like_count) || 0) + (liked ? 1 : -1) } : r
        ))
      }
    } catch {}
  }

  const toggleBookmark = async (id) => {
    if (!token) { navigate('/login'); return }
    try {
      const res = await fetch(`${API}/api/users/me/bookmarks/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const { bookmarked } = await res.json()
        setBookmarks(prev => ({ ...prev, [id]: bookmarked }))
      }
    } catch {}
  }

  const CAT_OPTS = ['All', ...CATEGORIES.map(c => c.label)]

  const displayed = useMemo(() => {
    let list = [...recipes]
    if (filterCat !== 'All') list = list.filter(r => r.category === filterCat)
    const q = debouncedSearch
    if (q) list = list.filter(r =>
      r.title?.toLowerCase().includes(q.toLowerCase()) ||
      (r.author || r.username)?.toLowerCase().includes(q.toLowerCase())
    )
    if (filterLatest || activeTab === 1)
      list = [...list].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    else if (activeTab === 2)
      list = [...list].sort((a,b) => (parseInt(b.like_count)||0) - (parseInt(a.like_count)||0))
    else if (activeTab === 0)
      list = [...list].sort((a,b) =>
        ((parseInt(b.like_count)||0) + (parseInt(b.comment_count)||0)*2) -
        ((parseInt(a.like_count)||0) + (parseInt(a.comment_count)||0)*2)
      )
    else if (activeTab === 3)
      list = list.filter(r => r.challenge_id)
    return list
  }, [recipes, filterCat, filterLatest, activeTab, debouncedSearch])

  const heroStats = [
    [stats?.totalRecipes      ?? '—', 'Recipes shared'],
    [stats?.totalUsers        ?? '—', 'Community cooks'],
    [stats?.avgMealCost ? `₱${stats.avgMealCost}` : '—', 'Avg. meal cost'],
    [stats?.totalChallenges   ?? '—', 'Active challenges'],
  ]

  const liveChallenge = challenges[0] || null

  const goToFeed  = (cat) => navigate(cat ? `/feed?category=${encodeURIComponent(cat)}` : '/feed')
  const goToShare = ()    => navigate('/share')
  const clearSearch = ()  => { setSearchInput(''); setDebouncedSearch(''); navigate('/') }

  return (
    <div className={styles.page}>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroEyebrow}>🇵🇭 Community Recipe Forum</span>
          <h1 className="fade-up">Real food.<br /><em>Real budget.</em><br />Real Panlasa.</h1>
          <p className={`${styles.heroSub} fade-up fade-up-1`}>
            Share your go-to budget meals, discover what your neighbors are cooking,
            and join challenges like the ₱100 Ulam Showdown.
          </p>
          <div className={`${styles.heroActions} fade-up fade-up-2`}>
            <button className="btn btn-primary" onClick={goToShare}>Share a Recipe</button>
            <button className="btn btn-outline" onClick={() => goToFeed()}>Browse Feed</button>
          </div>
          <div className={`${styles.heroStats} fade-up fade-up-3`}>
            {heroStats.map(([num, lbl]) => (
              <div key={lbl} className={styles.heroStat}>
                <div className={styles.heroStatNum}>{num}</div>
                <div className={styles.heroStatLabel}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHALLENGE BANNER */}
      {liveChallenge && (
        <div className={styles.challengeBanner}>
          <span className={styles.challengeBadge}>🔥 Active Now</span>
          <p><strong>{liveChallenge.title || liveChallenge.name}</strong>{liveChallenge.description ? ` — ${liveChallenge.description}` : ''}</p>
          <button className={styles.challengeJoin} onClick={() => navigate('/challenges')}>Join Challenge →</button>
        </div>
      )}

      {/* MAIN */}
      <div className="container">
        <div className={styles.mainGrid}>

          {/* FEED */}
          <main className={styles.feed}>
            <div className={styles.sortTabs}>
              {TABS.map((t, i) => (
                <button key={t} className={`${styles.sortTab} ${activeTab === i ? styles.active : ''}`} onClick={() => setActiveTab(i)}>{t}</button>
              ))}
            </div>

            <div className={styles.filterBar}>
              <div className={styles.filterLeft}>
                <span className={styles.filterLabel}>Filter:</span>
                {CAT_OPTS.map(c => (
                  <button key={c} className={`${styles.filterChip} ${filterCat === c ? styles.filterActive : ''}`} onClick={() => setFilterCat(c)}>{c}</button>
                ))}
              </div>
              <div className={styles.searchWrap}>
                <input
                  className={styles.searchInput}
                  placeholder="🔍 Search recipes..."
                  value={searchInput}
                  onChange={handleSearchChange}
                />
                {searchInput && (
                  <button className={styles.clearSearchBtn} onClick={clearSearch}>✕</button>
                )}
              </div>
            </div>

            {debouncedSearch && (
              <div className={styles.searchBanner}>
                🔍 Results for "<strong>{debouncedSearch}</strong>" — {displayed.length} found
              </div>
            )}

            <div className={styles.sectionHd}>
              <h2>Community Feed</h2>
              <button className={styles.seeAllBtn} onClick={() => goToFeed()}>See all →</button>
            </div>

            <div className={styles.recipeList}>
              {loadingFeed ? (
                <div className={styles.emptyState}><p>Loading recipes...</p></div>
              ) : displayed.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>😅 {debouncedSearch ? `No recipes found for "${debouncedSearch}".` : 'No recipes yet. Be the first to share one!'}</p>
                  {debouncedSearch && (
                    <button className="btn btn-outline" style={{color:'var(--terra)',borderColor:'var(--terra)',marginTop:'1rem'}} onClick={clearSearch}>
                      Clear search
                    </button>
                  )}
                </div>
              ) : displayed.map(r => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  liked={!!likes[r.id]}
                  bookmarked={!!bookmarks[r.id]}
                  onLike={toggleLike}
                  onBookmark={toggleBookmark}
                  token={token}
                />
              ))}
            </div>

            {displayed.length > 0 && (
              <button className={`btn btn-ghost ${styles.loadMore}`} onClick={() => goToFeed()}>Load more recipes</button>
            )}
          </main>

          {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            <button className={`btn btn-secondary ${styles.postBtn}`} onClick={goToShare}>+ Share Your Recipe</button>

            <div className={styles.sideCard}>
              <h3>🏆 Active Challenges</h3>
              {challenges.length === 0
                ? <p className={styles.noComments}>No active challenges yet.</p>
                : challenges.map(ch => (
                  <div key={ch.id} className={styles.challengeItem}>
                    <div className={styles.chIcon}>{ch.icon || '🏆'}</div>
                    <div className={styles.chInfo}>
                      <div className={styles.chName}>{ch.title || ch.name}</div>
                      <div className={styles.chMeta}>{ch.description || ch.meta}</div>
                    </div>
                    <span className={`${styles.chStatus} ${styles.hot}`}>Active</span>
                  </div>
                ))}
              {challenges.length > 0 && (
                <button className={styles.seeAll} onClick={() => navigate('/challenges')}>See all challenges →</button>
              )}
            </div>

            <div className={styles.sideCard}>
              <h3>👨‍🍳 Top Cooks This Month</h3>
              {topCooks.length === 0
                ? <p className={styles.noComments}>No cooks yet.</p>
                : topCooks.map((cook, i) => (
                  <div key={cook.id || i} className={styles.cookItem}>
                    <span className={`${styles.cookRank} ${i < 3 ? styles.topRank : ''}`}>{i + 1}</span>
                    <div className={styles.cookAv} style={{ background: cook.color || '#C1502A' }}>
                      {(cook.username || cook.name || '?').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.cookName}>{cook.username || cook.name}</div>
                      <div className={styles.cookRecipes}>{cook.recipe_count || 0} recipes</div>
                    </div>
                    <span className={styles.cookLikes}>❤ {cook.total_likes || 0}</span>
                  </div>
                ))}
            </div>

            <div className={styles.sideCard}>
              <h3>🗂 Browse Categories</h3>
              <div className={styles.catGrid}>
                {CATEGORIES.map(cat => (
                  <button key={cat.label} className={styles.catChip} onClick={() => goToFeed(cat.label)}>
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
