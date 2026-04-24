import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import styles from './ShoppingList.module.css'

const INITIAL_ITEMS = [
  { id:1,  name:'Talong (Eggplant)',      qty:'3 pcs',   category:'Vegetables', checked:false, price:15,  store:'Palengke' },
  { id:2,  name:'Itlog (Eggs)',           qty:'12 pcs',  category:'Protein',    checked:false, price:90,  store:'Supermarket' },
  { id:3,  name:'Bawang (Garlic)',        qty:'1 head',  category:'Condiments', checked:true,  price:10,  store:'Palengke' },
  { id:4,  name:'Sibuyas (Onion)',        qty:'3 pcs',   category:'Vegetables', checked:false, price:18,  store:'Palengke' },
  { id:5,  name:'Bigas (Rice) 2kg',       qty:'1 bag',   category:'Grains',     checked:false, price:125, store:'Supermarket' },
  { id:6,  name:'Monggo (Mung Beans)',    qty:'250g',    category:'Legumes',    checked:false, price:35,  store:'Palengke' },
  { id:7,  name:'Toyo (Soy Sauce)',       qty:'1 bottle',category:'Condiments', checked:true,  price:28,  store:'Sari-sari' },
  { id:8,  name:'Mantikilya (Butter)',    qty:'200g',    category:'Dairy',      checked:false, price:65,  store:'Supermarket' },
  { id:9,  name:'Bangus (Milkfish)',      qty:'2 pcs',   category:'Seafood',    checked:false, price:120, store:'Palengke' },
  { id:10, name:'Pancit Canton',          qty:'4 packs', category:'Pantry',     checked:false, price:40,  store:'Sari-sari' },
  { id:11, name:'Mantika (Cooking Oil)', qty:'500ml',   category:'Pantry',     checked:true,  price:55,  store:'Supermarket' },
  { id:12, name:'Asin (Salt)',            qty:'1 pack',  category:'Condiments', checked:true,  price:8,   store:'Sari-sari' },
  { id:13, name:'Dahon ng Laurel',        qty:'1 pack',  category:'Condiments', checked:false, price:12,  store:'Palengke' },
  { id:14, name:'Chicken Breast',         qty:'500g',    category:'Protein',    checked:false, price:135, store:'Supermarket' },
  { id:15, name:'Petchay (Bok Choy)',     qty:'1 bundle',category:'Vegetables', checked:false, price:22,  store:'Palengke' },
]

const PAGE_SIZE  = 5
const CATEGORIES = ['All', ...new Set(INITIAL_ITEMS.map(i => i.category))]
const STORES     = ['All', ...new Set(INITIAL_ITEMS.map(i => i.store))]
const SHOW_OPTS  = ['All', 'Unchecked', 'Checked']

export default function ShoppingList() {
  const [items,     setItems]     = useState(INITIAL_ITEMS)
  const [filterCat, setFilterCat] = useState('All')
  const [filterStore, setFilterStore] = useState('All')
  const [filterShow,  setFilterShow]  = useState('All')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [newItem,   setNewItem]   = useState({ name:'', qty:'', category:'Vegetables', store:'Palengke', price:'' })
  const [addOpen,   setAddOpen]   = useState(false)

  const toggle = id => setItems(its => its.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  const remove = id => setItems(its => its.filter(i => i.id !== id))

  const addItem = () => {
    if (!newItem.name.trim()) return
    setItems(its => [...its, {
      id: Date.now(), ...newItem,
      price: Number(newItem.price) || 0, checked: false
    }])
    setNewItem({ name:'', qty:'', category:'Vegetables', store:'Palengke', price:'' })
    setAddOpen(false)
  }

  const filtered = useMemo(() => {
    let list = items
    if (filterCat   !== 'All') list = list.filter(i => i.category === filterCat)
    if (filterStore !== 'All') list = list.filter(i => i.store === filterStore)
    if (filterShow  === 'Checked')   list = list.filter(i => i.checked)
    if (filterShow  === 'Unchecked') list = list.filter(i => !i.checked)
    if (search.trim()) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [items, filterCat, filterStore, filterShow, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalCost       = items.reduce((s, i) => s + (i.checked ? 0 : i.price), 0)
  const checkedCost     = items.reduce((s, i) => s + (i.checked ? i.price : 0), 0)
  const uncheckedCount  = items.filter(i => !i.checked).length

  const handlePageChange = (p) => { setPage(Math.max(1, Math.min(p, totalPages))) }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* HEADER */}
        <div className={styles.pageHeader}>
          <div>
            <Link to="/" className={styles.back}>← Back to Feed</Link>
            <h1>🛒 Shopping List</h1>
            <p>Plan your grocery run · {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} remaining</p>
          </div>
          <div className={styles.costSummary}>
            <div className={styles.costCard}>
              <div className={styles.costLabel}>Remaining</div>
              <div className={styles.costValue}>₱{totalCost}</div>
            </div>
            <div className={`${styles.costCard} ${styles.costDone}`}>
              <div className={styles.costLabel}>Got ✓</div>
              <div className={styles.costValue}>₱{checkedCost}</div>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className={styles.filterBlock}>
          <div className={styles.filterRow}>
            <input className={styles.searchInput}
              placeholder="🔍 Search items…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Category</span>
              <select className={styles.filterSelect} value={filterCat}
                onChange={e => { setFilterCat(e.target.value); setPage(1) }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Store</span>
              <select className={styles.filterSelect} value={filterStore}
                onChange={e => { setFilterStore(e.target.value); setPage(1) }}>
                {STORES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Show</span>
              <div className={styles.showChips}>
                {SHOW_OPTS.map(o => (
                  <button key={o}
                    className={`${styles.showChip} ${filterShow === o ? styles.showActive : ''}`}
                    onClick={() => { setFilterShow(o); setPage(1) }}>{o}</button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.filterInfo}>
            Showing {paged.length} of {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            {(filterCat !== 'All' || filterStore !== 'All' || filterShow !== 'All' || search) && (
              <button className={styles.clearFilters}
                onClick={() => { setFilterCat('All'); setFilterStore('All'); setFilterShow('All'); setSearch(''); setPage(1) }}>
                × Clear filters
              </button>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className={styles.listCard}>
          {paged.length === 0 ? (
            <div className={styles.empty}>
              <p>😅 No items match your filters.</p>
            </div>
          ) : (
            paged.map(item => (
              <div key={item.id} className={`${styles.listItem} ${item.checked ? styles.itemChecked : ''}`}>
                <button className={styles.checkBtn} onClick={() => toggle(item.id)}
                  aria-label={item.checked ? 'Uncheck' : 'Check'}>
                  {item.checked ? '✅' : '⬜'}
                </button>
                <div className={styles.itemMain}>
                  <span className={styles.itemName}>{item.name}</span>
                  <div className={styles.itemTags}>
                    <span className={styles.itemQty}>{item.qty}</span>
                    <span className={styles.itemCat}>{item.category}</span>
                    <span className={styles.itemStore}>🏪 {item.store}</span>
                  </div>
                </div>
                <div className={styles.itemRight}>
                  <span className={styles.itemPrice}>₱{item.price}</span>
                  <button className={styles.removeBtn} onClick={() => remove(item.id)} aria-label="Remove item">×</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION: NEXT & PREVIOUS */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={`${styles.pageBtn} ${styles.pagePrev}`}
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage === 1}>
              ← Previous
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p}
                  className={`${styles.pageNum} ${p === safePage ? styles.pageNumActive : ''}`}
                  onClick={() => handlePageChange(p)}>{p}</button>
              ))}
            </div>

            <button
              className={`${styles.pageBtn} ${styles.pageNext}`}
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage === totalPages}>
              Next →
            </button>
          </div>
        )}

        {/* ADD ITEM */}
        <div className={styles.addSection}>
          {!addOpen ? (
            <button className={`btn btn-secondary ${styles.addToggle}`}
              onClick={() => setAddOpen(true)}>＋ Add Item</button>
          ) : (
            <div className={styles.addForm}>
              <h4>Add New Item</h4>
              <div className={styles.addRow}>
                <input placeholder="Item name *" value={newItem.name}
                  onChange={e => setNewItem(v => ({ ...v, name: e.target.value }))} />
                <input placeholder="Qty (e.g. 3 pcs)" value={newItem.qty}
                  onChange={e => setNewItem(v => ({ ...v, qty: e.target.value }))} />
                <input placeholder="₱ Price" type="number" value={newItem.price}
                  onChange={e => setNewItem(v => ({ ...v, price: e.target.value }))} />
              </div>
              <div className={styles.addRow}>
                <select value={newItem.category}
                  onChange={e => setNewItem(v => ({ ...v, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={newItem.store}
                  onChange={e => setNewItem(v => ({ ...v, store: e.target.value }))}>
                  {STORES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.addActions}>
                <button className="btn btn-primary" onClick={addItem}>Add to List</button>
                <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
