import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug, getPosts } from '@/lib/db'
import styles from './page.module.css'

export async function generateStaticParams() {
  const posts = await getPosts(true).catch(() => [])
  return posts.map(p => ({ slug: p.slug }))
}
export const revalidate = 60

type Props = { params: { slug: string } }

export default async function PostDetailPage({ params }: Props) {
  const post = await getPostBySlug(params.slug)
  if (!post || !post.visible) return notFound()

  // Convert basic markdown-like content to HTML
  const lines = post.content.split('\n')
  const htmlLines = lines.map(line => {
    if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
    if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`
    if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`
    if (line.trim() === '') return '<br/>'
    return `<p>${line}</p>`
  })
  const bodyHtml = htmlLines.join('')

  return (
    <div style={{ paddingBottom: 80 }}>
      <div className={styles.header}>
        <div className="container">
          <Link href="/blog" className={styles.back}>← Tuyển dụng</Link>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.date}>
            Ngày đăng: {new Date(post.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="container">
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        <div className={styles.cta}>
          <p>Quan tâm đến vị trí này? Gửi CV ngay!</p>
          <a href="mailto:info@quangphu.vn" className="btn btn-primary">✉ Gửi CV</a>
          <a href="tel:0901234567" className="btn btn-outline">📞 0901 234 567</a>
        </div>
      </div>
    </div>
  )
}
