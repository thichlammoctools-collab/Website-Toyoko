import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProducts, getProductBySlug } from '@/lib/db'
import styles from './page.module.css'

export async function generateStaticParams() {
  const products = await getProducts(true).catch(() => [])
  return products.map(p => ({ slug: p.slug }))
}

export const revalidate = 60

type Props = { params: { slug: string } }

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug)
  if (!product || !product.visible) return notFound()

  const specEntries = Object.entries(product.specs || {})

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <div className="container">
          <Link href="/">Trang chủ</Link> / <Link href="/products">Sản phẩm</Link> / <span>{product.name}</span>
        </div>
      </div>

      <div className="container">
        <div className={styles.grid}>
          {/* Image Gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImg}>
              <Image
                src={product.images?.[0] || '/images/placeholder.jpg'}
                alt={product.name}
                fill style={{ objectFit: 'contain' }}
                sizes="600px"
                priority
              />
            </div>
            {product.images?.length > 1 && (
              <div className={styles.thumbs}>
                {product.images.slice(0, 4).map((img, i) => (
                  <div key={i} className={styles.thumb}>
                    <Image src={img} alt={`${product.name} ${i+1}`} fill style={{ objectFit: 'cover' }} sizes="100px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <span className="badge badge-red">{product.category}</span>
            <h1 className={styles.name}>{product.name}</h1>
            <div className={styles.priceRow}>
              <span className="price">{product.price.toLocaleString('vi-VN')}₫</span>
              <span style={{ color: 'var(--gray)', fontSize: 14 }}>/{product.unit}</span>
            </div>
            <p className={styles.desc}>{product.description}</p>

            {/* CTA */}
            <div className={styles.ctas}>
              <a href="tel:0901234567" className="btn btn-primary">📞 Gọi đặt hàng: 0901 234 567</a>
              <a href={`https://zalo.me/${process.env.NEXT_PUBLIC_ZALO_OA_ID || ''}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                💬 Zalo tư vấn
              </a>
            </div>

            {/* Highlights */}
            <ul className={styles.highlights}>
              <li>✅ Hàng chính hãng Toyoko</li>
              <li>✅ Bảo hành 12 tháng tại trung tâm</li>
              <li>✅ Giao hàng toàn quốc</li>
            </ul>
          </div>
        </div>

        {/* Specs */}
        {specEntries.length > 0 && (
          <div className={styles.specs}>
            <h2 className={styles.specsTitle}>Thông số kỹ thuật</h2>
            <div className="table-wrapper">
              <table>
                <tbody>
                  {specEntries.map(([k, v]) => (
                    <tr key={k}>
                      <td className={styles.specKey}>{k}</td>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
