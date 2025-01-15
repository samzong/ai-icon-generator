import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 })
    }

    const response = await fetch(url)
    const blob = await response.blob()

    // 设置适当的 Content-Type
    const headers = new Headers()
    headers.set('Content-Type', blob.type)
    headers.set('Content-Length', blob.size.toString())

    return new NextResponse(blob, { 
      headers,
      status: 200 
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new NextResponse('Failed to fetch image', { status: 500 })
  }
} 