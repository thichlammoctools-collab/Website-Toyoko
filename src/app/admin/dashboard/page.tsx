'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Product, Post } from '@/lib/types'
import styles from './page.module.css'

const CATEGORIES = ['Máy khoan', 'Máy mài', 'Máy cưa', 'Khác']

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

type Tab = 'products' | 'posts'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  // Product form state
  const [editProd, setEditProd] = useState<Partial<Product> | null>(null)
  const [showProdForm, setShowProdForm] = useState(false)

  // Post form state
  const [editPost, setEditPost] = useState<Partial<Post> | null>(null)
  const [showPostForm, setShowPostForm] = useState(false)

  const loadData = useCallback(async () => {
    const [pr, po] = await Promise.all([
      fetch('/api/products').then(r => r.json()).catch(() => []),
      fetch('/api/posts').then(r => r.json()).catch(() => []),
    ])
    setProducts(pr)
    setPosts(po)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/admin')
  }

  // ─── Products CRUD ───────────────────────────────────── //
  const saveProd = async () => {
    if (!editProd) return
    const method = editProd.id ? 'PUT' : 'POST'
    const url = editProd.id ? `/api/products/${editProd.id}` : '/api/products'
    const body = { ...editProd, slug: editProd.slug || slugify(editProd.name || ''), visible: editProd.visible ?? true }
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowProdForm(false); setEditProd(null); loadData()
  }

  const toggleProdVisible = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible: !p.visible }) })
    loadData()
  }

  const deleteProd = async (id: string) => {
    if (!confirm('Xóa sản phẩm này?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    loadData()
  }

  // ─── Posts CRUD ──────────────────────────────────────── //
  const savePost = async () => {
    if (!editPost) return
    const method = editPost.id ? 'PUT' : 'POST'
    const url = editPost.id ? `/api/posts/${editPost.id}` : '/api/posts'
    const body = { ...editPost, slug: editPost.slug || slugify(editPost.title || ''), visible: editPost.visible ?? true }
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowPostForm(false); setEditPost(null); loadData()
  }

  const togglePostVisible = async (p: Post) => {
    await fetch(`/api/posts/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible: !p.visible }) })
    loadData()
  }

  const deletePost = async (id: string) => {
    if (!confirm('Xóa bài đăng này?')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    loadData()
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Image src="/logo.png" alt="Toyoko" width={100} height={40} />
          <span className={styles.adminLabel}>Admin</span>
        </div>
        <nav className={styles.sideNav}>
          <button className={`${styles.navItem} ${tab === 'products' ? styles.navActive : ''}`} onClick={() => setTab('products')}>📦 Sản phẩm</button>
          <button className={`${styles.navItem} ${tab === 'posts' ? styles.navActive : ''}`} onClick={() => setTab('posts')}>📝 Tuyển dụng</button>
          <a href="/" target="_blank" className={styles.navItem} style={{ marginTop: 'auto' }}>🌐 Xem web</a>
          <button className={`${styles.navItem} ${styles.logout}`} onClick={logout}>🚪 Đăng xuất</button>
        </nav>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {loading ? <p>Đang tải...</p> : (

          tab === 'products' ? (
            <>
              <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Quản lý Sản phẩm <span className="badge badge-gray">{products.length}</span></h1>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditProd({ visible: true, specs: {}, images: [], unit: 'cái', category: 'Máy khoan' }); setShowProdForm(true) }}>+ Thêm sản phẩm</button>
              </div>

              {/* Product form modal */}
              {showProdForm && editProd && (
                <div className={styles.modal}>
                  <div className={styles.modalBox}>
                    <h2 className={styles.modalTitle}>{editProd.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                    <div className="grid-3" style={{ gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Tên sản phẩm *</label>
                        <input className="form-input" value={editProd.name || ''} onChange={e => setEditProd({ ...editProd, name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Danh mục</label>
                        <select className="form-select" value={editProd.category || ''} onChange={e => setEditProd({ ...editProd, category: e.target.value })}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Giá (VNĐ)</label>
                        <input type="number" className="form-input" value={editProd.price || ''} onChange={e => setEditProd({ ...editProd, price: Number(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Đơn vị</label>
                        <input className="form-input" value={editProd.unit || 'cái'} onChange={e => setEditProd({ ...editProd, unit: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">URL ảnh (mỗi dòng 1 URL)</label>
                        <textarea className="form-textarea" style={{ minHeight: 80 }} value={(editProd.images || []).join('\n')} onChange={e => setEditProd({ ...editProd, images: e.target.value.split('\n').filter(Boolean) })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Thông số kỹ thuật (JSON)</label>
                        <textarea className="form-textarea" style={{ minHeight: 80 }} value={JSON.stringify(editProd.specs || {}, null, 2)} onChange={e => { try { setEditProd({ ...editProd, specs: JSON.parse(e.target.value) }) } catch {} }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mô tả sản phẩm</label>
                      <textarea className="form-textarea" style={{ minHeight: 100 }} value={editProd.description || ''} onChange={e => setEditProd({ ...editProd, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={editProd.visible ?? true} onChange={e => setEditProd({ ...editProd, visible: e.target.checked })} />
                        <span className="form-label" style={{ margin: 0 }}>Hiển thị trên website</span>
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { setShowProdForm(false); setEditProd(null) }}>Hủy</button>
                      <button className="btn btn-primary btn-sm" onClick={saveProd}>💾 Lưu</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="table-wrapper">
                <table>
                  <thead><tr>
                    <th>Ảnh</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Hiển thị</th><th>Thao tác</th>
                  </tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} /> : '–'}
                        </td>
                        <td>{p.name}</td>
                        <td><span className="badge badge-red">{p.category}</span></td>
                        <td className="price price-sm">{p.price.toLocaleString('vi-VN')}₫</td>
                        <td>
                          <button onClick={() => toggleProdVisible(p)} className={`badge ${p.visible ? 'badge-red' : 'badge-gray'}`} style={{ cursor: 'pointer', border: 'none' }}>
                            {p.visible ? '👁 Hiện' : '🙈 Ẩn'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => { setEditProd(p); setShowProdForm(true) }}>✏️ Sửa</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteProd(p.id)}>🗑 Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className={styles.topBar}>
                <h1 className={styles.pageTitle}>Quản lý Tuyển dụng <span className="badge badge-gray">{posts.length}</span></h1>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditPost({ visible: true, date: new Date().toISOString().split('T')[0] }); setShowPostForm(true) }}>+ Thêm bài đăng</button>
              </div>

              {showPostForm && editPost && (
                <div className={styles.modal}>
                  <div className={styles.modalBox}>
                    <h2 className={styles.modalTitle}>{editPost.id ? 'Sửa bài đăng' : 'Thêm bài đăng mới'}</h2>
                    <div className="form-group">
                      <label className="form-label">Tiêu đề *</label>
                      <input className="form-input" value={editPost.title || ''} onChange={e => setEditPost({ ...editPost, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ngày đăng</label>
                      <input type="date" className="form-input" value={editPost.date || ''} onChange={e => setEditPost({ ...editPost, date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tóm tắt</label>
                      <input className="form-input" value={editPost.excerpt || ''} onChange={e => setEditPost({ ...editPost, excerpt: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nội dung (hỗ trợ Markdown: ## Tiêu đề, - Danh sách)</label>
                      <textarea className="form-textarea" style={{ minHeight: 200 }} value={editPost.content || ''} onChange={e => setEditPost({ ...editPost, content: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={editPost.visible ?? true} onChange={e => setEditPost({ ...editPost, visible: e.target.checked })} />
                        <span className="form-label" style={{ margin: 0 }}>Hiển thị trên website</span>
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { setShowPostForm(false); setEditPost(null) }}>Hủy</button>
                      <button className="btn btn-primary btn-sm" onClick={savePost}>💾 Lưu</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Tiêu đề</th><th>Ngày đăng</th><th>Hiển thị</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {posts.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.title}</td>
                        <td>{new Date(p.date).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <button onClick={() => togglePostVisible(p)} className={`badge ${p.visible ? 'badge-red' : 'badge-gray'}`} style={{ cursor: 'pointer', border: 'none' }}>
                            {p.visible ? '👁 Hiện' : '🙈 Ẩn'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => { setEditPost(p); setShowPostForm(true) }}>✏️ Sửa</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deletePost(p.id)}>🗑 Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </main>
    </div>
  )
}
