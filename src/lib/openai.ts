import OpenAI from "openai"
import { APIError } from "openai/error"
import { getCustomApiKey } from "./storage"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable")
}

let openaiInstance: OpenAI | null = null

export function getOpenAIClient() {
  const customApiKey = getCustomApiKey()
  
  // 如果已经有实例且使用的是自定义 key，检查 key 是否变化
  if (openaiInstance?.apiKey === customApiKey) {
    return openaiInstance
  }

  // 创建新的 OpenAI 客户端实例
  openaiInstance = new OpenAI({
    apiKey: customApiKey || process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
    maxRetries: 3,
  })

  return openaiInstance
}

// 添加延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function generateIcon(prompt: string, style: string) {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const enhancedPrompt = `Create a professional icon with ${style} style. ${prompt}. Make it simple, memorable, and suitable as an app icon or logo. Use appropriate colors and ensure it's visually balanced.`

      const client = getOpenAIClient()
      const response = await client.images.generate({
        model: process.env.MODEL_NAME,
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      })

      if (!response.data?.[0]?.url) {
        throw new Error("无效的 API 响应")
      }

      return response.data[0].url
    } catch (error) {
      attempt++
      console.error(`尝试 ${attempt}/${maxRetries} 失败:`, error)

      if (error instanceof APIError) {
        // 处理特定的 API 错误
        switch (error.status) {
          case 401:
            throw new Error("API 密钥无效，请检查配置")
          case 429:
            if (attempt < maxRetries) {
              // 如果是速率限制错误，等待后重试
              const retryAfter = error.headers?.['retry-after'] 
                ? parseInt(error.headers['retry-after']) * 1000 
                : attempt * 2000
              await delay(retryAfter)
              continue
            }
            throw new Error("已超过 API 调用限制，请稍后重试")
          case 500:
          case 502:
          case 503:
          case 504:
            if (attempt < maxRetries) {
              // 服务器错误，等待后重试
              await delay(attempt * 2000)
              continue
            }
            throw new Error("OpenAI 服务暂时不可用，请稍后重试")
          default:
            throw new Error(`OpenAI API 错误: ${error.message}`)
        }
      }

      // 处理网络错误
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (errorMessage.includes('econnreset') || 
            errorMessage.includes('etimedout') || 
            errorMessage.includes('network') ||
            errorMessage.includes('connection')) {
          if (attempt < maxRetries) {
            await delay(attempt * 2000)
            continue
          }
          throw new Error("网络连接不稳定，请检查网络后重试")
        }
      }

      // 其他错误直接抛出
      throw new Error("生成图标失败，请稍后重试")
    }
  }

  throw new Error("多次尝试后仍然失败，请稍后重试")
} 