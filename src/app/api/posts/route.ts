import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const posts = await getPosts(false)
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const post = await createPost(body)
    return NextResponse.json(post, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
