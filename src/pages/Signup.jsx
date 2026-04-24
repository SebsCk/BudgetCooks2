import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Signup.module.css'

export default function Signup() {
  const { signup }  = useAuth()
  const navigate    = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try { await signup(form.email, form.username, form.password); navigate('/') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>Budget<span>Cooks</span></Link>
          <h1>Join the community</h1>
          <p>Share budget meals and discover what your neighbors are cooking</p>
        </div>

        {error && <div className={styles.error}>⚠ {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} required autoComplete="email" />
            </div>
            <div className={styles.field}>
              <label htmlFor="username">Username</label>
              <input id="username" name="username" type="text"
                placeholder="e.g. manang_rosa" value={form.username}
                onChange={handleChange} required minLength={3} maxLength={40}
                pattern="[a-zA-Z0-9_]+" title="Letters, numbers, and underscores only"
                autoComplete="username" />
              <span className={styles.hint}>Letters, numbers, underscores</span>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.passWrap}>
                <input id="password" name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters" value={form.password}
                  onChange={handleChange} required minLength={8} autoComplete="new-password" />
                <button type="button" className={styles.eyeBtn}
                  onClick={() => setShowPass(v => !v)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="confirm">Confirm Password</label>
              <div className={styles.passWrap}>
                <input id="confirm" name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••" value={form.confirm}
                  onChange={handleChange} required autoComplete="new-password" />
                <button type="button" className={styles.eyeBtn}
                  onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account…' : '🍳 Create account'}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account?{' '}<Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
