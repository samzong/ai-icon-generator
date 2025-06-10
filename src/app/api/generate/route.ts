import { NextResponse } from "next/server"
import { generateIcon } from "@/lib/openai"
import { imageConfig } from "@/config/site"

export const runtime = "edge"

// 添加 HEAD 请求处理，用于获取速率限制信息
export async function HEAD() {
  // 只返回头信息，不返回内容
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 验证请求体结构
    if (!body || typeof body !== 'object') {
      return new NextResponse("Invalid request body", { status: 400 })
    }

    const { prompt, style } = body

    // 严格的prompt验证
    if (!prompt || typeof prompt !== 'string') {
      return new NextResponse("Invalid prompt: must be a non-empty string", { status: 400 })
    }

    // 长度限制检查
    if (prompt.length > 1000) {
      return new NextResponse("Prompt too long: maximum 1000 characters allowed", { status: 400 })
    }

    // 内容验证 - 去除前后空格后检查
    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt.length === 0) {
      return new NextResponse("Empty prompt: please provide a valid description", { status: 400 })
    }

    // 检查是否包含潜在的恶意内容
    const maliciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /vbscript:/i
    ]
    
    if (maliciousPatterns.some(pattern => pattern.test(prompt))) {
      return new NextResponse("Invalid prompt: contains prohibited content", { status: 400 })
    }

    // Style验证
    if (!style || typeof style !== 'string') {
      return new NextResponse("Invalid style: must be a valid string", { status: 400 })
    }

    // 类型安全的style验证
    const validStyles = imageConfig.styles as readonly string[]
    if (!validStyles.includes(style)) {
      return new NextResponse(`Invalid style: must be one of ${imageConfig.styles.join(', ')}`, { status: 400 })
    }

    // 使用经过验证和清理的prompt
    const result = await generateIcon(trimmedPrompt, style)

    if (result.format === 'url' && result.url) {
      return NextResponse.json({ url: result.url })
    } else if (result.format === 'base64' && result.base64) {
      // Convert base64 to data URL
      const dataUrl = `data:image/png;base64,${result.base64}`
      return NextResponse.json({ url: dataUrl })
    } else {
      throw new Error("Invalid response format from generateIcon")
    }
  } catch (error) {
    // 安全的错误日志记录 - 只记录错误类型，不记录详细信息
    const errorType = error instanceof Error ? error.constructor.name : "UnknownError"
    console.error(`Generate API error: ${errorType}`)
    
    // 安全的错误分类处理 - 避免泄露内部实现细节
    if (error instanceof SyntaxError) {
      return new NextResponse("Invalid request format", { status: 400 })
    }
    
    // 检查已知的业务错误类型，但不暴露原始错误消息
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      // API配置相关错误
      if (errorMsg.includes("api key") || errorMsg.includes("unauthorized") || errorMsg.includes("invalid api")) {
        return new NextResponse("Service configuration error", { status: 503 })
      }
      
      // 速率限制错误
      if (errorMsg.includes("rate limit") || errorMsg.includes("too many requests")) {
        return new NextResponse("Request limit exceeded", { status: 429 })
      }
      
      // 网络或连接错误
      if (errorMsg.includes("network") || errorMsg.includes("timeout") || errorMsg.includes("connection")) {
        return new NextResponse("Service temporarily unavailable", { status: 503 })
      }
      
      // API提供商相关错误
      if (errorMsg.includes("model") || errorMsg.includes("invalid") || errorMsg.includes("bad request")) {
        return new NextResponse("Request could not be processed", { status: 400 })
      }
    }
    
    // 默认的安全错误响应 - 不暴露任何内部信息
    return new NextResponse("Service temporarily unavailable", { status: 503 })
  }
} 