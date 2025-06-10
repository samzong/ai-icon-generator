import OpenAI from "openai"
import { APIError } from "openai/error"
import { getApiConfig, getSelectedProviderConfig, type ApiProviderConfig } from "./storage"
import {
  type GenerateIconResult,
  type GenerateIconOptions,
  createEnhancedPrompt,
  prepareServerRequest,
  parseApiResponse
} from "./icon-generation-core"

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable")
  process.exit(1)
}

// 客户端缓存管理（避免全局状态污染）
class OpenAIClientManager {
  private clientCache: Map<string, { client: OpenAI; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 1000 * 60 * 5 // 5分钟缓存有效期

  private getConfigHash(config: ApiProviderConfig): string {
    return JSON.stringify(config)
  }

  private cleanExpiredClients(): void {
    const now = Date.now()
    for (const [hash, cached] of this.clientCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.clientCache.delete(hash)
      }
    }
  }

  public getClient(): OpenAI {
    this.cleanExpiredClients()
    
    const config = getApiConfig()
    const providerConfig = getSelectedProviderConfig()
    const configHash = this.getConfigHash(providerConfig)
    
    // 检查缓存中是否有有效的客户端实例
    const cached = this.clientCache.get(configHash)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.client
    }

    // 创建新的客户端实例
    let apiKey: string
    let baseURL: string | undefined

    if (config.selectedProvider === 'default') {
      apiKey = process.env.OPENAI_API_KEY!
      baseURL = process.env.OPENAI_API_BASE_URL
    } else {
      apiKey = providerConfig.apiKey
      baseURL = providerConfig.baseUrl || process.env.OPENAI_API_BASE_URL
    }

    const client = new OpenAI({
      apiKey,
      baseURL,
      maxRetries: 3,
    })

    // 缓存新创建的客户端
    this.clientCache.set(configHash, {
      client,
      timestamp: Date.now()
    })

    return client
  }
}

// 创建客户端管理器实例
const clientManager = new OpenAIClientManager()

export function getOpenAIClient() {
  return clientManager.getClient()
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function generateIcon(
  prompt: string, 
  style: string,
  options: GenerateIconOptions = {}
): Promise<GenerateIconResult> {
  const maxRetries = 3
  let attempt = 0

  const {
    responseFormat = 'url',
    size = '1024x1024',
  } = options

  const providerConfig = getSelectedProviderConfig()

  while (attempt < maxRetries) {
    try {
      const enhancedPrompt = createEnhancedPrompt(prompt, style, size)

      const client = getOpenAIClient()
      
      const requestParams = prepareServerRequest(providerConfig, enhancedPrompt, size, responseFormat)

      const response = await client!.images.generate(requestParams)

      return parseApiResponse(response, getApiConfig().selectedProvider)

    } catch (error) {
      attempt++
      // 仅记录错误类型和状态码，避免泄露敏感信息
      if (error instanceof APIError) {
        console.error(`try ${attempt}/${maxRetries} failed: API Error ${error.status}`)
      } else if (error instanceof Error) {
        console.error(`try ${attempt}/${maxRetries} failed: ${error.name}`)
      } else {
        console.error(`try ${attempt}/${maxRetries} failed: Unknown error`)
      }

      if (error instanceof APIError) {
        if (error.status === 400 && error.message.includes('response_format') && error.message.includes('unknown parameter')) {
          console.warn('Provider does not support response_format parameter, retrying without it...')
          
          // Retry without response_format parameter
          try {
            const enhancedPrompt = createEnhancedPrompt(prompt, style, size)
            const client = getOpenAIClient()
            
            // Prepare request without response_format
            const baseParams = {
              model: providerConfig.model || process.env.MODEL_NAME || 'gpt-image-1',
              prompt: enhancedPrompt,
              size: size as '256x256' | '512x512' | '1024x1024',
            }
            
            const response = await client!.images.generate(baseParams)
            return parseApiResponse(response, getApiConfig().selectedProvider)
          } catch {
            console.error('Retry without response_format also failed')
            throw new Error("api error: response_format parameter not supported by this provider")
          }
        }
        
        switch (error.status) {
          case 401:
            throw new Error("invalid api key")
          case 429:
            if (attempt < maxRetries) {
              const retryAfter = error.headers?.['retry-after'] 
                ? parseInt(error.headers['retry-after']) * 1000 
                : attempt * 2000
              await delay(retryAfter)
              continue
            }
            throw new Error("rate limit exceeded")
          case 500:
          case 502:
          case 503:
          case 504:
            if (attempt < maxRetries) {
              await delay(attempt * 2000)
              continue
            }
            throw new Error("server error")
          default:
            // 避免泄露详细的API错误信息
            throw new Error("api error: request failed")
        }
      }

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
          throw new Error("network error")
        }
      }

      throw new Error("unknown error")
    }
  }

  throw new Error("failed after multiple attempts")
}

// Re-export types for convenience
export { type GenerateIconResult } 