import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './MealPlanner.module.css'

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const SLOTS = ['Breakfast','Lunch','Dinner','Merienda']

const SAMPLE_RECIPES = [
  { id:1,  emoji:'🍳', title:'Tortang Talong',        cost:35,  time:'20m' },
  { id:2,  emoji:'🍚', title:'Garlic Fried Rice',     cost:22,  time:'15m' },
  { id:3,  emoji:'🍲', title:'Monggo Soup',           cost:55,  time:'40m' },
  { id:4,  emoji:'🥚', title:'Daing na Bangus',       cost:60,  time:'30m' },
  { id:5,  emoji:'🍜', title:'Pancit Canton Upgrade', cost:18,  time:'10m' },
  { id:6,  emoji:'🥘', title:'Chicken Tinola',        cost:75,  time:'45m' },
  { id:7,  emoji:'🍡', title:'Biko de Leche Flan',    cost:45,  time:'60m' },
  { id:8,  emoji:'🍛', title:'Pork Adobo',            cost:85,  time:'50m' },
  { id:9,  emoji:'🫕', title:'Bulalo Soup',           cost:180, time:'90m' },
  { id:10, emoji:'🍖', title:'Lechon Kawali',         cost:120, time:'35m' },
]

const buildInitialPlan = () => {
  const plan = {}
  DAYS.forEach(d => { plan[d] = {}; SLOTS.forEach(s => { plan[d][s] = null }) })
  plan['Monday']['Breakfast']   = SAMPLE_RECIPES[1]
  plan['Monday']['Lunch']       = SAMPLE_RECIPES[2]
  plan['Tuesday']['Breakfast']  = SAMPLE_RECIPES[0]
  plan['Wednesday']['Lunch']    = SAMPLE_RECIPES[7]
  plan['Wednesday']['Dinner']   = SAMPLE_RECIPES[5]
  plan['Thursday']['Merienda']  = SAMPLE_RECIPES[4]
  plan['Friday']['Lunch']       = SAMPLE_RECIPES[3]
  plan['Saturday']['Breakfast'] = SAMPLE_RECIPES[1]
  plan['Saturday']['Dinner']    = SAMPLE_RECIPES[9]
  plan['Sunday']['Lunch']       = SAMPLE_RECIPES[6]
  return plan
}

export default function MealPlanner() {
  const [plan,      setPlan]     = useState(buildInitialPlan)
  const [modal,     setModal]    = useState(null)   // { day, slot }
  const [search,    setSearch]   = useState('')
  const [viewMode,  setViewMode] = useState('week') // 'week' | 'day'
  const [activeDay, setActiveDay] = useState('Monday')

  const assign = (recipe) => {
    if (!modal) return
    setPlan(p => ({ ...p, [modal.day]: { ...p[modal.day], [modal.slot]: recipe } }))
    setModal(null)
  }

  const clear = (day, slot) => {
    setPlan(p => ({ ...p, [day]: { ...p[day], [slot]: null } }))
  }

  const totalCost = Object.values(plan).reduce((total, day) =>
    total + Object.values(day).reduce((s, r) => s + (r ? r.cost : 0), 0), 0)

  const weekMeals = Object.values(plan).reduce((total, day) =>
    total + Object.values(day).filter(Boolean).length, 0)

  const filteredRecipes = SAMPLE_RECIPES.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()))

  const displayDays = viewMode === 'day' ? [activeDay] : DAYS

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* HEADER */}
        <div className={styles.pageHeader}>
          <div>
            <Link to="/" className={styles.back}>← Back to Feed</Link>
            <h1>📅 Meal Planner</h1>
            <p>Plan your weekly meals and stay on budget</p>
          </div>
          <div className={styles.summaryCards}>
            <div className={styles.summCard}>
              <div className={styles.summLabel}>Weekly Budget</div>
              <div className={styles.summValue}>₱{totalCost}</div>
            </div>
            <div className={styles.summCard}>
              <div className={styles.summLabel}>Meals Planned</div>
              <div className={styles.summValue}>{weekMeals} / {DAYS.length * SLOTS.length}</div>
            </div>
          </div>
        </div>

        {/* VIEW TOGGLE + DAY PICKER */}
        <div className={styles.toolbar}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${viewMode === 'week' ? styles.viewActive : ''}`}
              onClick={() => setViewMode('week')}>📆 Week</button>
            <button className={`${styles.viewBtn} ${viewMode === 'day' ? styles.viewActive : ''}`}
              onClick={() => setViewMode('day')}>📋 Day</button>
          </div>
          {viewMode === 'day' && (
            <div className={styles.dayPicker}>
              {DAYS.map(d => (
                <button key={d}
                  className={`${styles.dayChip} ${activeDay === d ? styles.dayActive : ''}`}
                  onClick={() => setActiveDay(d)}>{d.slice(0,3)}</button>
              ))}
            </div>
          )}
        </div>

        {/* PLANNER GRID */}
        <div className={`${styles.plannerWrap} ${viewMode === 'week' ? styles.weekView : styles.dayView}`}>
          {displayDays.map(day => (
            <div key={day} className={styles.dayCol}>
              <div className={styles.dayHeader}>{day}</div>
              {SLOTS.map(slot => {
                const meal = plan[day][slot]
                return (
                  <div key={slot} className={styles.slotCell}>
                    <div className={styles.slotLabel}>{slot}</div>
                    {meal ? (
                      <div className={styles.mealCard}>
                        <span className={styles.mealEmoji}>{meal.emoji}</span>
                        <div className={styles.mealInfo}>
                          <span className={styles.mealTitle}>{meal.title}</span>
                          <span className={styles.mealMeta}>₱{meal.cost} · {meal.time}</span>
                        </div>
                        <button className={styles.clearBtn} onClick={() => clear(day, slot)}
                          title="Remove">×</button>
                      </div>
                    ) : (
                      <button className={styles.emptySlot}
                        onClick={() => setModal({ day, slot })}>
                        ＋ Add
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* WEEKLY COST BREAKDOWN */}
        <div className={styles.costBreakdown}>
          <h3>Weekly Cost Breakdown</h3>
          <div className={styles.costGrid}>
            {DAYS.map(day => {
              const dayCost = Object.values(plan[day]).reduce((s, r) => s + (r ? r.cost : 0), 0)
              const meals   = Object.values(plan[day]).filter(Boolean).length
              return (
                <div key={day} className={styles.dayCostCard}>
                  <div className={styles.dayCostDay}>{day.slice(0,3)}</div>
                  <div className={styles.dayCostVal}>₱{dayCost}</div>
                  <div className={styles.dayCostMeals}>{meals} meal{meals !== 1 ? 's' : ''}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* RECIPE PICKER MODAL */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Choose a Recipe</h3>
                <p className={styles.modalSub}>{modal.day} · {modal.slot}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setModal(null)}>×</button>
            </div>
            <input className={styles.modalSearch}
              placeholder="🔍 Search recipes…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className={styles.recipeList}>
              {filteredRecipes.map(r => (
                <button key={r.id} className={styles.recipeRow} onClick={() => assign(r)}>
                  <span className={styles.rEmoji}>{r.emoji}</span>
                  <div className={styles.rInfo}>
                    <span className={styles.rTitle}>{r.title}</span>
                    <span className={styles.rMeta}>₱{r.cost} · ⏱ {r.time}</span>
                  </div>
                  <span className={styles.rAdd}>＋</span>
                </button>
              ))}
              {filteredRecipes.length === 0 && (
                <p className={styles.modalEmpty}>No recipes found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
