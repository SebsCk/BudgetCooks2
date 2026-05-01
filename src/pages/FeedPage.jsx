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
                onLike={id => setLikes(p => ({...p,[id]:!p[id]}))}
                currentUser={currentUser}
                onDelete={handleDeleteRecipe}
                onEdit={setEditRecipe} />
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL - moved to the end of the return statement */}
      {editRecipe && (
        <EditRecipeModal
          recipe={editRecipe}
          token={localStorage.getItem('token')}
          onClose={() => setEditRecipe(null)}
          onSaved={updated => {
            setRecipes(rs => rs.map(r => r.id === updated.id ? {...r, ...updated, category: updated.category} : r))
            setEditRecipe(null)
          }}
        />
      )}
    </div>
  )
}