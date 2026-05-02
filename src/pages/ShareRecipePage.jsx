import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './ShareRecipePage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const CATEGORIES = ['Breakfast','Rice Dishes','Soups','Ulam','Merienda','One-Pan','Snacks']

const EMPTY = {
  title: '', description: '', category: '', estimated_cost: '',
  servings: '', prep_time_mins: '', cook_time_mins: '',
  image_url: '',
  ingredients: [{ name: '', quantity: '', unit: '' }],
  steps: [{ instruction: '' }],
}

export default function ShareRecipePage() {
  const { user }   = useAuth()
  const token      = localStorage.getItem('token')
  const navigate   = useNavigate()
  const [form,     setForm]     = useState(EMPTY)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [challenges, setChallenges] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch(`${API}/api/challenges`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setChallenges(Array.isArray(data) ? data.filter(c => c.status === 'active') : []))
      .catch(() => {})
  }, [user])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleImageFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file (JPG, PNG, WEBP, etc.)'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return }
    setImageLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setImagePreview(dataUrl)
      setForm(f => ({ ...f, image_url: dataUrl }))
      setImageLoading(false)
      setError('')
    }
    reader.onerror = () => { setError('Failed to read image'); setImageLoading(false) }
    reader.readAsDataURL(file)
  }

  const handleImageDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageFile(file)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleImageFile(file)
  }

  const clearImage = () => {
    setImagePreview(null)
    setForm(f => ({ ...f, image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const setIngredient = (i, k, v) => setForm(f => {
    const ing = [...f.ingredients]; ing[i] = { ...ing[i], [k]: v }; return { ...f, ingredients: ing }
  })
  const addIngredient    = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name:'', quantity:'', unit:'' }] }))
  const removeIngredient = i  => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))

  const setStep    = (i, v) => setForm(f => { const s = [...f.steps]; s[i] = { instruction: v }; return { ...f, steps: s } })
  const addStep    = ()     => setForm(f => ({ ...f, steps: [...f.steps, { instruction: '' }] }))
  const removeStep = i      => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = {
        ...form,
        estimated_cost:  Number(form.estimated_cost)  || 0,
        servings:        Number(form.servings)         || 1,
        prep_time_mins:  Number(form.prep_time_mins)   || 0,
        cook_time_mins:  Number(form.cook_time_mins)   || 0,
        ingredients: form.ingredients.filter(i => i.name.trim()),
        steps:       form.steps.map((s, idx) => ({ ...s, step_number: idx + 1 })).filter(s => s.instruction.trim()),
      }
      const res = await fetch(`${API}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to submit recipe'); return }
      setSuccess(true)
      setTimeout(() => navigate('/feed'), 2000)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className={styles.page}>
      <div className={styles.successBox}>
        <div className={styles.successIcon}>🎉</div>
        <h2>Recipe Shared!</h2>
        <p>Your recipe has been submitted. Redirecting to the feed…</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>🍳 Share a Recipe</h1>
        <p>Share your budget-friendly Filipino recipe with the community</p>
      </div>

      <div className={styles.formWrap}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>⚠ {error}</div>}

          {/* BASIC INFO */}
          <section className={styles.section}>
            <h2>Basic Info</h2>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Recipe Title *</label>
                <input required value={form.title} onChange={e => setField('title', e.target.value)}
                  placeholder="e.g. Garlic Fried Rice na Masarap" />
              </div>
              <div className={styles.field}>
                <label>Category *</label>
                <select required value={form.category} onChange={e => setField('category', e.target.value)}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={e => setField('description', e.target.value)}
                placeholder="Tell us about this recipe — what makes it special or budget-friendly?" />
            </div>
            <div className={styles.row3}>
              <div className={styles.field}>
                <label>Estimated Cost (₱) *</label>
                <input required type="number" min="1" value={form.estimated_cost}
                  onChange={e => setField('estimated_cost', e.target.value)} placeholder="e.g. 85" />
              </div>
              <div className={styles.field}>
                <label>Servings *</label>
                <input required type="number" min="1" value={form.servings}
                  onChange={e => setField('servings', e.target.value)} placeholder="e.g. 4" />
              </div>
              <div className={styles.field}>
                <label>Prep Time (mins)</label>
                <input type="number" min="0" value={form.prep_time_mins}
                  onChange={e => setField('prep_time_mins', e.target.value)} placeholder="e.g. 10" />
              </div>
              <div className={styles.field}>
                <label>Cook Time (mins)</label>
                <input type="number" min="0" value={form.cook_time_mins}
                  onChange={e => setField('cook_time_mins', e.target.value)} placeholder="e.g. 20" />
              </div>
            </div>
            {challenges.length > 0 && (
              <div className={styles.field}>
                <label>Enter a Challenge (optional)</label>
                <select value={form.challenge_id || ''} onChange={e => setField('challenge_id', e.target.value || null)}>
                  <option value="">No challenge</option>
                  {challenges.map(c => <option key={c.id} value={c.id}>🏆 {c.title}</option>)}
                </select>
              </div>
            )}
          </section>

          {/* PHOTO UPLOAD */}
          <section className={styles.section}>
            <h2>📸 Recipe Photo <span style={{fontWeight:400,fontSize:'0.82rem',color:'var(--warm-gray)'}}>(optional)</span></h2>
            {imagePreview ? (
              <div className={styles.imagePreviewWrap}>
                <img src={imagePreview} alt="Recipe preview" className={styles.imagePreview} />
                <button type="button" className={styles.removeImageBtn} onClick={clearImage}>
                  ✕ Remove photo
                </button>
              </div>
            ) : (
              <div
                className={styles.dropZone}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleImageDrop}
              >
                {imageLoading ? (
                  <span>Loading image…</span>
                ) : (
                  <>
                    <span className={styles.dropZoneIcon}>📷</span>
                    <span className={styles.dropZoneText}>Click to upload or drag & drop</span>
                    <span className={styles.dropZoneHint}>JPG, PNG, WEBP — max 5 MB</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </section>

          {/* INGREDIENTS */}
          <section className={styles.section}>
            <h2>Ingredients</h2>
            <div className={styles.ingredientList}>
              {form.ingredients.map((ing, i) => (
                <div key={i} className={styles.ingredientRow}>
                  <input placeholder="Ingredient name *" value={ing.name}
                    onChange={e => setIngredient(i, 'name', e.target.value)} className={styles.ingName} />
                  <input placeholder="Qty" type="number" min="0" step="0.1" value={ing.quantity}
                    onChange={e => setIngredient(i, 'quantity', e.target.value)} className={styles.ingQty} />
                  <input placeholder="Unit (e.g. cups)" value={ing.unit}
                    onChange={e => setIngredient(i, 'unit', e.target.value)} className={styles.ingUnit} />
                  {form.ingredients.length > 1 && (
                    <button type="button" className={styles.removeBtn} onClick={() => removeIngredient(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className={styles.addBtn} onClick={addIngredient}>＋ Add Ingredient</button>
          </section>

          {/* STEPS */}
          <section className={styles.section}>
            <h2>Cooking Steps</h2>
            <div className={styles.stepList}>
              {form.steps.map((step, i) => (
                <div key={i} className={styles.stepRow}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <textarea placeholder={`Step ${i + 1} instruction…`} rows={2}
                    value={step.instruction} onChange={e => setStep(i, e.target.value)} />
                  {form.steps.length > 1 && (
                    <button type="button" className={styles.removeBtn} onClick={() => removeStep(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className={styles.addBtn} onClick={addStep}>＋ Add Step</button>
          </section>

          <div className={styles.submitRow}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/feed')}
              style={{color:'var(--terra)',borderColor:'var(--terra)'}}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : '🍳 Share Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
