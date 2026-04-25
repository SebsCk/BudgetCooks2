import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './CategoriesPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const CATEGORIES = [
  { emoji:'🍳', label:'Breakfast',   desc:'Morning favorites under budget' },
  { emoji:'🍚', label:'Rice Dishes', desc:'From garlic rice to arroz caldo' },
  { emoji:'🍲', label:'Soups',       desc:'Hearty sabaw for the whole family' },
  { emoji:'🫙', label:'Ulam',        desc:'Classic Filipino main dishes' },
  { emoji:'🍡', label:'Merienda',    desc:'Affordable afternoon snacks' },
  { emoji:'🥘', label:'One-Pan',     desc:'Easy meals, less cleanup' },
  { emoji:'🍟', label:'Snacks',      desc:'Quick bites and street food' },
]

export default function CategoriesPage() {
  const [counts,  setCounts]  = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API}/api/recipes`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return
        const c = {}
        data.forEach(r => { c[r.category] = (c[r.category] || 0) + 1 })
        setCounts(c)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>🗂 Browse Categories</h1>
        <p>Find recipes by category — from breakfast to merienda</p>
      </div>

      <div className="container">
        <div className={styles.grid}>
          {CATEGORIES.map(cat => (
            <button key={cat.label} className={styles.card}
              onClick={() => navigate(`/feed?category=${encodeURIComponent(cat.label)}`)}>
              <div className={styles.cardEmoji}>{cat.emoji}</div>
              <h3 className={styles.cardLabel}>{cat.label}</h3>
              <p className={styles.cardDesc}>{cat.desc}</p>
              <span className={styles.cardCount}>
                {loading ? '…' : `${counts[cat.label] || 0} recipes`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
