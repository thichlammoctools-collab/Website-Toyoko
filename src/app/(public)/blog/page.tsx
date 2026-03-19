import Link from 'next/link'
import { getPosts } from '@/lib/db'
import styles from './page.module.css'

export const revalidate = 60

export default async function BlogPage() {
  const posts = await getPosts(true).catch(() => [])

  return (
    <div>
      <div className={styles.header}>
        <div className="container">
          <span className="section-label">Thông tin</span>
          <h1 className="section-title" style={{ color: 'white' }}>Tuyển dụng</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Cơ hội việc làm tại Công ty Quang Phú</p>
        </div>
      </div>

      <div className="container section">
        {posts.length === 0 ? (
          <div className="empty-state">
            <h3>Hiện chưa có thông báo tuyển dụng</h3>
            <p>Vui lòng quay lại sau hoặc liên hệ trực tiếp công ty.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {posts.map(p => (
              <Link key={p.id} href={`/blog/${p.slug}`} className={`card ${styles.postCard}`}>
                <div className={styles.postDate}>
                  {new Date(p.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className={styles.postContent}>
                  <h2 className={styles.postTitle}>{p.title}</h2>
                  <p className={styles.postExcerpt}>{p.excerpt}</p>
                  <span className={styles.readMore}>Xem chi tiết →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
