export type Product = {
  id: string
  name: string
  slug: string
  category: string
  price: number
  unit: string
  specs: Record<string, string>
  images: string[]
  visible: boolean
  description: string
  created_at: string
}

export type Post = {
  id: string
  slug: string
  title: string
  date: string
  content: string
  excerpt: string
  visible: boolean
  created_at: string
}
