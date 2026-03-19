import { supabase } from './supabase'
import type { Product, Post } from './types'

// ─── Products ───────────────────────────────────────────────────────────────

export async function getProducts(visibleOnly = true): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('created_at', { ascending: false })
  if (visibleOnly) query = query.eq('visible', true)
  const { data, error } = await query
  if (error) throw error
  return (data as Product[]) ?? []
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data as Product
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert([product]).select().single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ─── Posts ──────────────────────────────────────────────────────────────────

export async function getPosts(visibleOnly = true): Promise<Post[]> {
  let query = supabase.from('posts').select('*').order('date', { ascending: false })
  if (visibleOnly) query = query.eq('visible', true)
  const { data, error } = await query
  if (error) throw error
  return (data as Post[]) ?? []
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).single()
  if (error) return null
  return data as Post
}

export async function createPost(post: Omit<Post, 'id' | 'created_at'>): Promise<Post> {
  const { data, error } = await supabase.from('posts').insert([post]).select().single()
  if (error) throw error
  return data as Post
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<Post> {
  const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Post
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}
