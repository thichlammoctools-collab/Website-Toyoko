import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'
import styles from './ProductCard.module.css'

type Props = { product: Product }

export default function ProductCard({ product }: Props) {
  const img = product.images?.[0] || '/images/placeholder.jpg'

  return (
    <Link href={`/products/${product.slug}`} className={`card ${styles.card}`}>
      <div className={styles.imgWrap}>
        <Image src={img} alt={product.name} fill style={{ objectFit: 'contain' }} sizes="(max-width:600px) 100vw, 300px" />
        <span className={`badge badge-red ${styles.category}`}>{product.category}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.desc}>{product.description?.slice(0, 80)}...</p>
        <div className={styles.footer}>
          <span className="price price-sm">{product.price.toLocaleString('vi-VN')}₫/{product.unit}</span>
          <span className={styles.more}>Chi tiết →</span>
        </div>
      </div>
    </Link>
  )
}
