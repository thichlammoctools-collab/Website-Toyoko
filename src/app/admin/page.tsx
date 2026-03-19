'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.css'

export default function AdminLoginPage() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      setError('Mật khẩu không đúng. Thử lại.')
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="Toyoko" width={120} height={48} />
          <p className={styles.logoSub}>Quản trị viên</p>
        </div>
        <h1 className={styles.title}>Đăng nhập Admin</h1>
        <form onSubmit={login} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Nhập mật khẩu admin"
              required
              autoFocus
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : '🔐 Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
