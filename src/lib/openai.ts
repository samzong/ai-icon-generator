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
  throw new Error("Missing OPENAI_API_KEY environment variable")
}

let openaiInstance: OpenAI | null = null
let currentConfigHash: string | null = null

function getConfigHash(config: ApiProviderConfig): string {
  return JSON.stringify(config)
}

export function getOpenAIClient() {
  const config = getApiConfig()
  const providerConfig = getSelectedProviderConfig()
  const configHash = getConfigHash(providerConfig)
  
  // Only recreate client if config changed
  if (openaiInstance && currentConfigHash === configHash) {
    return openaiInstance
  }

  // For default provider, use environment variables
  let apiKey: string
  let baseURL: string | undefined

  if (config.selectedProvider === 'default') {
    apiKey = process.env.OPENAI_API_KEY!
    baseURL = process.env.OPENAI_API_BASE_URL
  } else {
    apiKey = providerConfig.apiKey
    baseURL = providerConfig.baseUrl || process.env.OPENAI_API_BASE_URL
  }

  openaiInstance = new OpenAI({
    apiKey,
    baseURL,
    maxRetries: 3,
  })

  currentConfigHash = configHash
  return openaiInstance
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
      console.error(`try ${attempt}/${maxRetries} failed:`, error)

      if (error instanceof APIError) {
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
            throw new Error(`api error: ${error.message}`)
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