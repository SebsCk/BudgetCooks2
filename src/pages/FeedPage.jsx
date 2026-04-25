import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './FeedPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const CATEGORIES = ['All','Breakfast','Rice Dishes','Soups','Ulam','Merienda','One-Pan','Snacks']
const TABS = ['🔥 Hot','✨ New','👑 Top','🏆 Challenges']

function RecipeCard({ recipe, liked, onLike }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardImg}><span>{recipe.emoji || '🍽'}</span></div>
      <div className={styles.cardBody}>
        <div className={styles.tags}>
          <span className="tag">{recipe.category}</span>
          {recipe.challenge && <span className="tag tag-challenge">🏆 {recipe.challengeLabel}</span>}
        </div>
        <h3 className={styles.title}>{recipe.title}</h3>
        <p className={styles.meta}>
          <span>⏱ {recipe.time || recipe.cook_time || '—'}</span>
          <span> · </span>
          <span>🍽 {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
          <span> · </span>
          <span>📅 {new Date(recipe.created_at || recipe.datePosted).toLocaleDateString()}</span>
        </p>
        <div className={styles.footer}>
          <div className={styles.cost}>₱{recipe.cost || recipe.price} <span>/ batch</span></div>
          <div className={styles.actions}>
            <button className={`${styles.actionBtn} ${liked ? styles.liked : ''}`} onClick={() => onLike(recipe.id)}>
              {liked ? '❤️' : '🤍'} {recipe.likes + (liked ? 1 : 0)}
            </button>
            <button className={styles.actionBtn}>💬 {recipe.comments || recipe.comment_count || 0}</button>
            <button className={styles.actionBtn}>🔗</button>
          </div>
          <div className={styles.author}>
            <span className={styles.avatar}>{(recipe.author || recipe.username || '?').slice(0,2).toUpperCase()}</span>
            {recipe.author || recipe.username}
          </div>
        </div>
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
  const navigate = useNavigate()
  const location = useLocation()

  // Read category and search from URL params
  const params      = new URLSearchParams(location.search)
  const urlCategory = params.get('category') || 'All'
  const urlSearch   = params.get('search')   || ''

  const [filterCat, setFilterCat] = useState(urlCategory)

  // Sync filterCat when URL changes (e.g. from category page)
  useEffect(() => { setFilterCat(urlCategory) }, [urlCategory])
  useEffect(() => { setSearch(urlSearch) }, [urlSearch])

  useEffect(() => {
    fetch(`${API}/api/recipes`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setRecipes(Array.isArray(data) ? data : []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }, [])

  const clearSearch = () => {
    setSearch('')
    navigate('/feed')
  }

  const displayed = useMemo(() => {
    let list = [...recipes]
    if (filterCat !== 'All') list = list.filter(r => r.category === filterCat)
    if (search) list = list.filter(r =>
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      (r.author || r.username)?.toLowerCase().includes(search.toLowerCase())
    )
    if (activeTab === 1) list = [...list].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    else if (activeTab === 2) list = [...list].sort((a,b) => b.likes - a.likes)
    else if (activeTab === 0) list = [...list].sort((a,b) => (b.likes+(b.comments||0)*2) - (a.likes+(a.comments||0)*2))
    else if (activeTab === 3) list = list.filter(r => r.challenge)
    return list
  }, [recipes, filterCat, search, activeTab])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Community Feed</h1>
        <p>Discover budget-friendly Filipino recipes shared by the community</p>
      </div>

      <div className="container">
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <input className={styles.search} placeholder="🔍 Search recipes or cooks…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {(search || urlSearch) && (
              <button className={styles.clearBtn} onClick={clearSearch}>✕ Clear</button>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/feed')}>＋ Share a Recipe</button>
        </div>

        <div className={styles.tabs}>
          {TABS.map((t,i) => (
            <button key={t} className={`${styles.tab} ${activeTab===i ? styles.tabActive : ''}`} onClick={() => setActiveTab(i)}>{t}</button>
          ))}
        </div>

        <div className={styles.catBar}>
          {CATEGORIES.map(c => (
            <button key={c} className={`${styles.catChip} ${filterCat===c ? styles.catActive : ''}`}
              onClick={() => { setFilterCat(c); navigate(c === 'All' ? '/feed' : `/feed?category=${encodeURIComponent(c)}`) }}>
              {c}
            </button>
          ))}
        </div>

        {(search || urlSearch) && (
          <div className={styles.searchBanner || ''} style={{padding:'0.5rem 0',color:'var(--moss)',fontWeight:500}}>
            🔍 Results for "<strong>{search || urlSearch}</strong>" — {displayed.length} found
          </div>
        )}

        {loading ? (
          <p className={styles.empty}>Loading recipes…</p>
        ) : displayed.length === 0 ? (
          <div className={styles.emptyState}>
            <p>😅 No recipes found{search ? ` for "${search}"` : filterCat !== 'All' ? ` in "${filterCat}"` : ''}.</p>
            {(search || filterCat !== 'All') && (
              <button className="btn btn-outline" style={{color:'var(--terra)',borderColor:'var(--terra)',marginTop:'1rem'}}
                onClick={clearSearch}>
                ✕ Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {displayed.map(r => <RecipeCard key={r.id} recipe={r} liked={!!likes[r.id]} onLike={id => setLikes(p => ({...p,[id]:!p[id]}))} />)}
          </div>
        )}
      </div>
    </div>
  )
}
