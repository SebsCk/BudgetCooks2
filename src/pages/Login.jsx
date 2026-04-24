import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(form.email, form.password); navigate('/') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>Budget<span>Cooks</span></Link>
          <h1>Welcome back</h1>
          <p>Log in to share recipes and join challenges</p>
        </div>

        {error && <div className={styles.error}>⚠ {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email"
              placeholder="you@example.com"
              value={form.email} onChange={handleChange}
              required autoComplete="email" />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <div className={styles.passWrap}>
              <input id="password" name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password} onChange={handleChange}
                required autoComplete="current-password" />
              <button type="button" className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className={styles.switch}>
          Don&apos;t have an account?{' '}
          <Link to="/signup">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
