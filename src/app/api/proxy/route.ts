import { NextResponse } from 'next/server'

async function handleProxyRequest(url: string): Promise<NextResponse> {
  // Validate URL format
  let targetUrl: URL
  try {
    targetUrl = new URL(url)
  } catch {
    return new NextResponse('Invalid URL format', { status: 400 })
  }

  // Security check: only allow HTTP/HTTPS protocols
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return new NextResponse('Only HTTP/HTTPS URLs are allowed', { status: 400 })
  }

  // Fetch with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AI-Icon-Generator/1.0',
        'Accept': 'image/*,*/*',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return new NextResponse(
        `Upstream server error: ${response.status}`, 
        { status: response.status }
      )
    }

    const blob = await response.blob()

    // Validate image type
    if (!blob.type.startsWith('image/')) {
      return new NextResponse('Response is not an image', { status: 400 })
    }

    // Set response headers
    const headers = new Headers()
    headers.set('Content-Type', blob.type)
    headers.set('Content-Length', blob.size.toString())
    headers.set('Cache-Control', 'public, max-age=3600')
    headers.set('Access-Control-Allow-Origin', '*')

    return new NextResponse(blob, { headers, status: 200 })
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 })
    }

    return await handleProxyRequest(url)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new NextResponse('Request timeout', { status: 408 })
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return new NextResponse('Missing URL in request body', { status: 400 })
    }

    return await handleProxyRequest(url)
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new NextResponse('Request timeout', { status: 408 })
      }
      if (error.message.includes('JSON')) {
        return new NextResponse('Invalid JSON in request body', { status: 400 })
      }
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Add OPTIONS method support for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 