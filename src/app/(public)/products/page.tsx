'use client'
import { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/types'
import styles from './page.module.css'

const CATEGORIES = ['Tất cả', 'Máy khoan', 'Máy mài', 'Máy cưa', 'Khác']

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data.filter((p: Product) => p.visible))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchCat = category === 'Tất cả' || p.category === category
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <span className="section-label">Danh mục</span>
          <h1 className="section-title" style={{ color: 'white' }}>Sản phẩm Toyoko</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Toàn bộ dòng máy cầm tay điện chính hãng</p>
        </div>
      </div>

      <div className="container">
        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.categories}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`${styles.catBtn} ${category === c ? styles.catActive : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            className="form-input"
            style={{ maxWidth: 280 }}
            placeholder="🔍 Tìm kiếm sản phẩm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="empty-state"><p>Đang tải sản phẩm...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>Không tìm thấy sản phẩm</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="grid-4" style={{ marginBottom: 60 }}>
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
