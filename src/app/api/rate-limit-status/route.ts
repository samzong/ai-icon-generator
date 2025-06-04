import { NextResponse } from 'next/server'

export async function GET() {
  // 尝试从响应头中获取速率限制信息
  // 这些信息是由中间件添加的
  const rateLimitInfo = {
    hourLimit: process.env.MAX_REQUESTS_PER_HOUR || '10',
    minuteLimit: process.env.MAX_REQUESTS_PER_MINUTE || '2',
    hourRemaining: null as string | null,
    minuteRemaining: null as string | null,
  }

  // 发送一个测试请求到 /api/generate 来获取当前的限制状态
  try {
    const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate`, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // 从响应头中获取速率限制信息
    rateLimitInfo.hourRemaining = testResponse.headers.get('X-RateLimit-Remaining-Hour')
    rateLimitInfo.minuteRemaining = testResponse.headers.get('X-RateLimit-Remaining-Minute')
  } catch (error) {
    console.error('Failed to get rate limit information:', error)
  }

  return NextResponse.json(rateLimitInfo)
} 