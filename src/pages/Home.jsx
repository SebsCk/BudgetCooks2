import { useState, useMemo, useEffect } from 'react'
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
    fetch(`${API}/api/comments/${recipeId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [recipeId])

  const filtered = filter === 'All' ? comments : comments.filter(c => c.category === filter)

  const postComment = async () => {
    if (!newComment.trim() || !token) return
    try {
      const res = await fetch(`${API}/api/comments/${recipeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newComment }),
      })
      if (res.ok) { const c = await res.json(); setComments(prev => [c, ...prev]); setNewComment('') }
    } catch (err) { console.error(err) }
  }

  return (
    <div className={styles.commentSection}>
      <div className={styles.commentHeader}>
        <span className={styles.commentTitle}>💬 Comments ({comments.length})</span>
        <div className={styles.commentFilters}>
          {COMMENT_FILTERS.map(f => (
            <button key={f} className={`${styles.cfBtn} ${filter === f ? styles.cfActive : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>
      {loading ? <p className={styles.noComments}>Loading…</p>
        : filtered.length === 0 ? <p className={styles.noComments}>No {filter.toLowerCase()} comments yet.</p>
        : (
          <div className={styles.commentList}>
            {filtered.map(c => (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentAvatar}>{(c.author || c.username || '?').slice(0,2).toUpperCase()}</div>
                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <strong>{c.author || c.username}</strong>
                    <span className={styles.commentTime}>{c.time || new Date(c.created_at).toLocaleDateString()}</span>
                    {c.category && <span className={`${styles.commentBadge} ${styles[`badge${c.category}`]}`}>{c.category}</span>}
                  </div>
                  <p>{c.text || c.content}</p>
                  <button className={styles.commentLike}>❤ {c.likes || 0}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      <div className={styles.commentInputRow}>
        <input className={styles.commentInput} placeholder={token ? 'Add a comment…' : 'Log in to comment'}
          value={newComment} onChange={e => setNewComment(e.target.value)} disabled={!token}
          onKeyDown={e => e.key === 'Enter' && postComment()} />
        <button className={`btn btn-primary ${styles.commentPost}`} onClick={postComment} disabled={!token}>Post</button>
      </div>
    </div>
  )
}

function RecipeCard({ recipe, onLike, liked, token }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <article className={styles.recipeCard}>
      <div className={styles.recipeImg} style={{ background: recipe.id % 2 === 0 ? 'var(--cream)' : 'var(--cream2)' }}>
        <span>{recipe.emoji || '🍽'}</span>
      </div>
      <div className={styles.recipeBody}>
        <div className={styles.recipeTags}>
          <span className="tag">{recipe.category}</span>
          {recipe.challenge && <span className="tag tag-challenge">🏆 {recipe.challengeLabel}</span>}
        </div>
        <h3 className={styles.recipeTitle}>{recipe.title}</h3>
        <p className={styles.recipeMeta}>
          <span>⏱ {recipe.time || recipe.cook_time}</span>
          <span className={styles.dot}>·</span>
          <span>🍽 {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.datePosted}>📅 {recipe.dateLabel || new Date(recipe.created_at).toLocaleDateString()}</span>
        </p>
        <div className={styles.recipeFooter}>
          <div className={styles.recipeCost}>₱{recipe.cost || recipe.price} <span>/ batch</span></div>
          <div className={styles.recipeActions}>
            <button className={`${styles.actionBtn} ${liked ? styles.liked : ''}`} onClick={() => onLike(recipe.id)}>
              {liked ? '❤️' : '🤍'} {recipe.likes + (liked ? 1 : 0)}
            </button>
            <button className={styles.actionBtn} onClick={() => setExpanded(v => !v)}>
              💬 {recipe.comments || recipe.comment_count || 0}
            </button>
            <button className={styles.actionBtn}>🔗</button>
          </div>
          <div className={styles.recipeAuthor}>
            <span className={styles.avatar} style={{ background: recipe.authorColor || '#C1502A' }}>
              {(recipe.author || recipe.username || '?').slice(0,2).toUpperCase()}
            </span>
            {recipe.author || recipe.username}
          </div>
        </div>
        {expanded && <CommentSection recipeId={recipe.id} token={token} />}
      </div>
    </article>
  )
}

const TABS = ['🔥 Hot', '✨ New', '👑 Top', '🏆 Challenges']

export default function Home() {
  const [activeTab,    setActiveTab]    = useState(0)
  const [likes,        setLikes]        = useState({})
  const [filterCat,    setFilterCat]    = useState('All')
  const [filterLatest, setFilterLatest] = useState(false)
  const [recipes,      setRecipes]      = useState([])
  const [challenges,   setChallenges]   = useState([])
  const [topCooks,     setTopCooks]     = useState([])
  const [stats,        setStats]        = useState(null)
  const [loadingFeed,  setLoadingFeed]  = useState(true)
  const location  = useLocation()
  const navigate  = useNavigate()

  const token = localStorage.getItem('token')
  const searchQuery = new URLSearchParams(location.search).get('search') || ''

  useEffect(() => {
    async function fetchAll() {
      setLoadingFeed(true)
      try {
        const [recipesRes, challengesRes, topCooksRes, statsRes] = await Promise.all([
          fetch(`${API}/api/recipes`),
          fetch(`${API}/api/challenges`),
          fetch(`${API}/api/users/top-cooks`),
          fetch(`${API}/api/users/stats`),
        ])
        if (recipesRes.ok)    setRecipes(await recipesRes.json())
        if (challengesRes.ok) setChallenges(await challengesRes.json())
        if (topCooksRes.ok)   setTopCooks(await topCooksRes.json())
        if (statsRes.ok)      setStats(await statsRes.json())
      } catch (err) { console.error('Failed to load home data', err) }
      finally { setLoadingFeed(false) }
    }
    fetchAll()
  }, [])

  const toggleLike = id => setLikes(prev => ({ ...prev, [id]: !prev[id] }))
  const CAT_OPTS = ['All', ...new Set(recipes.map(r => r.category).filter(Boolean))]

  const displayed = useMemo(() => {
    let list = [...recipes]
    if (filterCat !== 'All') list = list.filter(r => r.category === filterCat)
    if (searchQuery) list = list.filter(r =>
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.author || r.username)?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filterLatest || activeTab === 1) list = [...list].sort((a,b) => new Date(b.created_at||b.datePosted) - new Date(a.created_at||a.datePosted))
    else if (activeTab === 2) list = [...list].sort((a,b) => b.likes - a.likes)
    else if (activeTab === 0) list = [...list].sort((a,b) => (b.likes+(b.comments||0)*2) - (a.likes+(a.comments||0)*2))
    else if (activeTab === 3) list = list.filter(r => r.challenge)
    return list
  }, [recipes, filterCat, filterLatest, activeTab, searchQuery])

  const heroStats = [
    [stats?.totalRecipes      ?? '—', 'Recipes shared'],
    [stats?.totalUsers        ?? '—', 'Community cooks'],
    [stats?.avgMealCost ? `₱${stats.avgMealCost}` : '—', 'Avg. meal cost'],
    [stats?.totalChallenges   ?? '—', 'Active challenges'],
  ]

  const liveChallenge = challenges.find(c => c.status === 'live')

  const goToFeed    = (cat) => navigate(cat ? `/feed?category=${encodeURIComponent(cat)}` : '/feed')
  const goToShare   = ()    => navigate('/share')
  const clearSearch = ()    => navigate('/')

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
            <button className="btn btn-primary"  onClick={goToShare}>Share a Recipe</button>
            <button className="btn btn-outline"  onClick={() => goToFeed()}>Browse Feed</button>
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
          <span className={styles.challengeBadge}>🔥 Live Now</span>
          <p><strong>{liveChallenge.name}</strong> — {liveChallenge.meta}</p>
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
              <button className={`${styles.latestBtn} ${filterLatest ? styles.latestActive : ''}`} onClick={() => setFilterLatest(v => !v)}>
                🕒 {filterLatest ? 'Latest ✓' : 'Latest'}
              </button>
            </div>

            {searchQuery && (
              <div className={styles.searchBanner}>
                🔍 Showing results for "<strong>{searchQuery}</strong>" — {displayed.length} found
                <button className={styles.clearSearchBtn} onClick={clearSearch}>✕ Clear search</button>
              </div>
            )}

            <div className={styles.sectionHd}>
              <h2>Community Feed</h2>
              <button className={styles.seeAllBtn} onClick={() => goToFeed()}>See all →</button>
            </div>

            <div className={styles.recipeList}>
              {loadingFeed ? (
                <div className={styles.emptyState}><p>Loading recipes…</p></div>
              ) : displayed.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>😅 {searchQuery ? `No recipes found for "${searchQuery}".` : 'No recipes yet. Be the first to share one!'}</p>
                  {searchQuery && (
                    <button className="btn btn-outline" style={{color:'var(--terra)',borderColor:'var(--terra)',marginTop:'1rem'}} onClick={clearSearch}>
                      ✕ Clear search
                    </button>
                  )}
                </div>
              ) : displayed.map(r => (
                <RecipeCard key={r.id} recipe={r} liked={!!likes[r.id]} onLike={toggleLike} token={token} />
              ))}
            </div>

            {displayed.length > 0 && (
              <button className={`btn btn-ghost ${styles.loadMore}`} onClick={() => goToFeed()}>Load more recipes</button>
            )}
          </main>

          {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            <button className={`btn btn-secondary ${styles.postBtn}`} onClick={goToShare}>＋ &nbsp;Share Your Recipe</button>

            <div className={styles.sideCard}>
              <h3>🏆 Active Challenges</h3>
              {challenges.length === 0
                ? <p className={styles.noComments}>No active challenges yet.</p>
                : challenges.map(ch => (
                  <div key={ch.id} className={styles.challengeItem}>
                    <div className={styles.chIcon}>{ch.icon || '🏆'}</div>
                    <div className={styles.chInfo}>
                      <div className={styles.chName}>{ch.name}</div>
                      <div className={styles.chMeta}>{ch.meta}</div>
                    </div>
                    <span className={`${styles.chStatus} ${ch.status === 'live' ? styles.hot : ''}`}>
                      {ch.status === 'live' ? 'Live' : ch.status === 'soon' ? 'Soon' : 'Open'}
                    </span>
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
                      <div className={styles.cookRecipes}>{cook.recipes || cook.recipe_count || 0} recipes</div>
                    </div>
                    <span className={styles.cookLikes}>❤ {cook.likes || cook.total_likes || 0}</span>
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
