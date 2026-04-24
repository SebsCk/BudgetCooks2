import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './Home.module.css'

/* ── MOCK DATA ─────────────────────────────────────────────── */
const RECIPES = [
  { id:1, emoji:'🍳', title:'Tortang Talong na ₱35 lang!',  author:'manang_rosa',   authorColor:'#C1502A', category:'Ulam',      cost:35, time:'20 mins', servings:2, likes:148, comments:34, challenge:true,  challengeLabel:'₱100 Meal', datePosted:'2025-04-10', dateLabel:'Apr 10, 2025' },
  { id:2, emoji:'🍚', title:'Garlic Fried Rice with Egg',    author:'kuya_berto',    authorColor:'#3D4A2D', category:'Breakfast',  cost:22, time:'15 mins', servings:1, likes:93,  comments:18, challenge:false, challengeLabel:'',          datePosted:'2025-04-09', dateLabel:'Apr 9, 2025' },
  { id:3, emoji:'🍲', title:'Monggo Soup na Masustansya',    author:'tita_grace',    authorColor:'#D4943A', category:'Soups',      cost:55, time:'40 mins', servings:4, likes:204, comments:51, challenge:true,  challengeLabel:'Gulay Lang', datePosted:'2025-04-08', dateLabel:'Apr 8, 2025' },
  { id:4, emoji:'🥚', title:'Daing na Bangus sa ₱60',        author:'rodel_luto',    authorColor:'#5C6E42', category:'Ulam',       cost:60, time:'30 mins', servings:3, likes:77,  comments:12, challenge:false, challengeLabel:'',          datePosted:'2025-04-07', dateLabel:'Apr 7, 2025' },
  { id:5, emoji:'🍜', title:'Instant Pancit Canton Upgrade', author:'student_paolo', authorColor:'#7A7060', category:'Merienda',   cost:18, time:'10 mins', servings:1, likes:310, comments:88, challenge:true,  challengeLabel:'₱100 Meal', datePosted:'2025-04-06', dateLabel:'Apr 6, 2025' },
  { id:6, emoji:'🥘', title:'Chicken Tinola sa Makulay',     author:'nanay_lita',    authorColor:'#8B3318', category:'Soups',      cost:75, time:'45 mins', servings:5, likes:156, comments:29, challenge:false, challengeLabel:'',          datePosted:'2025-04-05', dateLabel:'Apr 5, 2025' },
  { id:7, emoji:'🍡', title:'Biko de Leche Flan',            author:'aling_belen',   authorColor:'#C1502A', category:'Merienda',   cost:45, time:'60 mins', servings:8, likes:221, comments:43, challenge:false, challengeLabel:'',          datePosted:'2025-04-04', dateLabel:'Apr 4, 2025' },
]

const MOCK_COMMENTS = {
  1: [
    { id:1, author:'kuya_berto',    text:'Subok na ito sa amin! Masarap talaga.', likes:8, time:'2h ago', category:'Positive' },
    { id:2, author:'student_paolo', text:'Paano kung wala akong talong?',         likes:3, time:'3h ago', category:'Question' },
    { id:3, author:'tita_grace',    text:'Add mo kaya siyang bagoong sa taas.',   likes:5, time:'5h ago', category:'Suggestion' },
    { id:4, author:'rodel_luto',    text:'₱35 lang talaga? Grabe ang tipid!',     likes:12, time:'6h ago', category:'Positive' },
  ],
  3: [
    { id:5, author:'manang_rosa',   text:'Dagdag ng malunggay for extra nutrients!', likes:7, time:'1h ago', category:'Suggestion' },
    { id:6, author:'nanay_lita',    text:'Classic recipe ng lola ko ito!',           likes:15, time:'4h ago', category:'Positive' },
  ],
  5: [
    { id:7, author:'aling_belen',   text:'Game-changer! Add egg and spam.',          likes:22, time:'30m ago', category:'Suggestion' },
    { id:8, author:'tita_grace',    text:'Paborito ng mga estudyante!',              likes:9,  time:'2h ago', category:'Positive' },
    { id:9, author:'kuya_berto',    text:'Try mo ring gawing soup base yung sabaw.', likes:4,  time:'7h ago', category:'Question' },
  ],
}

const CHALLENGES = [
  { id:1, icon:'💵', name:'₱100 Budget Meal',    meta:'128 entries · 3 days left',  status:'live' },
  { id:2, icon:'🍚', name:'Sinangag Remix',       meta:'44 entries · 9 days left',   status:'live' },
  { id:3, icon:'🥬', name:'Gulay Lang Challenge', meta:'22 entries · 14 days left',  status:'open' },
  { id:4, icon:'🍜', name:'Merienda Masters',     meta:'Starts in 2 days',           status:'soon' },
]

const TOP_COOKS = [
  { rank:1, initials:'MR', name:'manang_rosa',   recipes:18, likes:412, color:'#C1502A' },
  { rank:2, initials:'KB', name:'kuya_berto',    recipes:14, likes:318, color:'#3D4A2D' },
  { rank:3, initials:'TG', name:'tita_grace',    recipes:11, likes:276, color:'#D4943A' },
  { rank:4, initials:'RL', name:'rodel_luto',    recipes:9,  likes:201, color:'#5C6E42' },
  { rank:5, initials:'SP', name:'student_paolo', recipes:7,  likes:144, color:'#7A7060' },
]

const CATEGORIES = [
  { emoji:'🍳', label:'Breakfast' },{ emoji:'🍚', label:'Rice Dishes' },
  { emoji:'🍲', label:'Soups' },    { emoji:'🫙', label:'Ulam' },
  { emoji:'🍡', label:'Merienda' }, { emoji:'🥘', label:'One-Pan' },
  { emoji:'🍟', label:'Snacks' },
]

const COMMENT_FILTERS = ['All', 'Positive', 'Question', 'Suggestion']

/* ── COMMENT SECTION ───────────────────────────────────────── */
function CommentSection({ recipeId }) {
  const [filter, setFilter] = useState('All')
  const raw = MOCK_COMMENTS[recipeId] || []
  const filtered = filter === 'All' ? raw : raw.filter(c => c.category === filter)

  return (
    <div className={styles.commentSection}>
      <div className={styles.commentHeader}>
        <span className={styles.commentTitle}>💬 Comments ({raw.length})</span>
        <div className={styles.commentFilters}>
          {COMMENT_FILTERS.map(f => (
            <button key={f}
              className={`${styles.cfBtn} ${filter === f ? styles.cfActive : ''}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className={styles.noComments}>No {filter.toLowerCase()} comments yet.</p>
      ) : (
        <div className={styles.commentList}>
          {filtered.map(c => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.commentAvatar}>{c.author.slice(0,2).toUpperCase()}</div>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <strong>{c.author}</strong>
                  <span className={styles.commentTime}>{c.time}</span>
                  <span className={`${styles.commentBadge} ${styles[`badge${c.category}`]}`}>{c.category}</span>
                </div>
                <p>{c.text}</p>
                <button className={styles.commentLike}>❤ {c.likes}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={styles.commentInputRow}>
        <input className={styles.commentInput} placeholder="Add a comment…" />
        <button className={`btn btn-primary ${styles.commentPost}`}>Post</button>
      </div>
    </div>
  )
}

/* ── RECIPE CARD ───────────────────────────────────────────── */
function RecipeCard({ recipe, onLike, liked }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className={styles.recipeCard}>
      <div className={styles.recipeImg} style={{ background: recipe.id % 2 === 0 ? 'var(--cream)' : 'var(--cream2)' }}>
        <span>{recipe.emoji}</span>
      </div>
      <div className={styles.recipeBody}>
        <div className={styles.recipeTags}>
          <span className="tag">{recipe.category}</span>
          {recipe.challenge && <span className="tag tag-challenge">🏆 {recipe.challengeLabel}</span>}
        </div>
        <h3 className={styles.recipeTitle}>{recipe.title}</h3>
        <p className={styles.recipeMeta}>
          <span>⏱ {recipe.time}</span>
          <span className={styles.dot}>·</span>
          <span>🍽 {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.datePosted}>📅 {recipe.dateLabel}</span>
        </p>
        <div className={styles.recipeFooter}>
          <div className={styles.recipeCost}>₱{recipe.cost} <span>/ batch</span></div>
          <div className={styles.recipeActions}>
            <button className={`${styles.actionBtn} ${liked ? styles.liked : ''}`} onClick={() => onLike(recipe.id)}>
              {liked ? '❤️' : '🤍'} {recipe.likes + (liked ? 1 : 0)}
            </button>
            <button className={styles.actionBtn} onClick={() => setExpanded(v => !v)}>
              💬 {recipe.comments}
            </button>
            <button className={styles.actionBtn}>🔗</button>
          </div>
          <div className={styles.recipeAuthor}>
            <span className={styles.avatar} style={{ background: recipe.authorColor }}>
              {recipe.author.slice(0,2).toUpperCase()}
            </span>
            {recipe.author}
          </div>
        </div>
        {expanded && <CommentSection recipeId={recipe.id} />}
      </div>
    </article>
  )
}

/* ── HOME PAGE ─────────────────────────────────────────────── */
const TABS      = ['🔥 Hot', '✨ New', '👑 Top', '🏆 Challenges']
const CAT_OPTS  = ['All', ...new Set(RECIPES.map(r => r.category))]

export default function Home() {
  const [activeTab, setActiveTab]   = useState(0)
  const [likes, setLikes]           = useState({})
  const [filterCat, setFilterCat]   = useState('All')
  const [filterLatest, setFilterLatest] = useState(false)
  const location = useLocation()

  // Read search query from URL
  const searchQuery = new URLSearchParams(location.search).get('search') || ''

  const toggleLike = id => setLikes(prev => ({ ...prev, [id]: !prev[id] }))

  const displayed = useMemo(() => {
    let list = [...RECIPES]
    if (filterCat !== 'All') list = list.filter(r => r.category === filterCat)
    if (searchQuery)         list = list.filter(r =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filterLatest || activeTab === 1) {
      list = [...list].sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted))
    } else if (activeTab === 2) {
      list = [...list].sort((a, b) => b.likes - a.likes)
    } else if (activeTab === 0) {
      list = [...list].sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2))
    } else if (activeTab === 3) {
      list = list.filter(r => r.challenge)
    }
    return list
  }, [filterCat, filterLatest, activeTab, searchQuery])

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
            <button className="btn btn-primary">Share a Recipe</button>
            <button className="btn btn-outline">Browse Feed</button>
          </div>
          <div className={`${styles.heroStats} fade-up fade-up-3`}>
            {[['2,481','Recipes shared'],['843','Community cooks'],['₱85','Avg. meal cost'],['14','Active challenges']].map(([num, lbl]) => (
              <div key={lbl} className={styles.heroStat}>
                <div className={styles.heroStatNum}>{num}</div>
                <div className={styles.heroStatLabel}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHALLENGE BANNER */}
      <div className={styles.challengeBanner}>
        <span className={styles.challengeBadge}>🔥 Live Now</span>
        <p><strong>₱100 Budget Meal Challenge</strong> — 3 days left · 128 entries so far</p>
        <button className={styles.challengeJoin}>Join Challenge →</button>
      </div>

      {/* MAIN */}
      <div className="container">
        <div className={styles.mainGrid}>

          {/* FEED */}
          <main className={styles.feed}>
            <div className={styles.sortTabs}>
              {TABS.map((t, i) => (
                <button key={t}
                  className={`${styles.sortTab} ${activeTab === i ? styles.active : ''}`}
                  onClick={() => setActiveTab(i)}>{t}</button>
              ))}
            </div>

            {/* FILTER BAR */}
            <div className={styles.filterBar}>
              <div className={styles.filterLeft}>
                <span className={styles.filterLabel}>Filter:</span>
                {CAT_OPTS.map(c => (
                  <button key={c}
                    className={`${styles.filterChip} ${filterCat === c ? styles.filterActive : ''}`}
                    onClick={() => setFilterCat(c)}>{c}</button>
                ))}
              </div>
              <button
                className={`${styles.latestBtn} ${filterLatest ? styles.latestActive : ''}`}
                onClick={() => setFilterLatest(v => !v)}>
                🕒 {filterLatest ? 'Latest ✓' : 'Latest'}
              </button>
            </div>

            {searchQuery && (
              <div className={styles.searchBanner}>
                🔍 Showing results for "<strong>{searchQuery}</strong>" — {displayed.length} found
              </div>
            )}

            <div className={styles.sectionHd}>
              <h2>Community Feed</h2>
              <a href="#feed">See all →</a>
            </div>

            <div className={styles.recipeList}>
              {displayed.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>😅 No recipes found. Try a different filter!</p>
                </div>
              ) : displayed.map(r => (
                <RecipeCard key={r.id} recipe={r} liked={!!likes[r.id]} onLike={toggleLike} />
              ))}
            </div>

            <button className={`btn btn-ghost ${styles.loadMore}`}>Load more recipes</button>
          </main>

          {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            <button className={`btn btn-secondary ${styles.postBtn}`}>＋ &nbsp;Share Your Recipe</button>

            <div className={styles.sideCard}>
              <h3>🏆 Active Challenges</h3>
              {CHALLENGES.map(ch => (
                <div key={ch.id} className={styles.challengeItem}>
                  <div className={styles.chIcon}>{ch.icon}</div>
                  <div className={styles.chInfo}>
                    <div className={styles.chName}>{ch.name}</div>
                    <div className={styles.chMeta}>{ch.meta}</div>
                  </div>
                  <span className={`${styles.chStatus} ${ch.status === 'live' ? styles.hot : ''}`}>
                    {ch.status === 'live' ? 'Live' : ch.status === 'soon' ? 'Soon' : 'Open'}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.sideCard}>
              <h3>👨‍🍳 Top Cooks This Month</h3>
              {TOP_COOKS.map(cook => (
                <div key={cook.rank} className={styles.cookItem}>
                  <span className={`${styles.cookRank} ${cook.rank <= 3 ? styles.topRank : ''}`}>{cook.rank}</span>
                  <div className={styles.cookAv} style={{ background: cook.color }}>{cook.initials}</div>
                  <div>
                    <div className={styles.cookName}>{cook.name}</div>
                    <div className={styles.cookRecipes}>{cook.recipes} recipes</div>
                  </div>
                  <span className={styles.cookLikes}>❤ {cook.likes}</span>
                </div>
              ))}
            </div>

            <div className={styles.sideCard}>
              <h3>🗂 Browse Categories</h3>
              <div className={styles.catGrid}>
                {CATEGORIES.map(cat => (
                  <button key={cat.label} className={styles.catChip}
                    onClick={() => setFilterCat(filterCat === cat.label ? 'All' : cat.label)}>
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
