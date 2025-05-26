import OpenAI from "openai"
import { APIError } from "openai/error"
import { getApiConfig, getSelectedProviderConfig, type ApiProviderConfig } from "./storage"

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

export interface GenerateIconResult {
  url?: string
  base64?: string
  format: 'url' | 'base64'
}

export async function generateIcon(
  prompt: string, 
  style: string,
  options: {
    responseFormat?: 'url' | 'b64_json'
    size?: '256x256' | '512x512' | '1024x1024'
  } = {}
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
      const enhancedPrompt = `"Create a professional macOS app icon with a ${style} style (e.g., modern, minimalist, flat). The icon should represent a single, unique, and memorable subject based on the user's simple and concise description: '${prompt}', which represents the main theme or element of the icon. The icon must be centered, isolated on a fully transparent background, with NO frames, borders, or UI elements around it. Ensure the design is simple, with NO additional decorative elements, and suitable as a macOS app icon or GitHub project logo. The icon should be easily recognizable even at small sizes. Use a cohesive color palette with 2-3 appropriate colors (e.g., shades of blue, gray, or green to suggest technology and professionalism) and maintain visual balance. The final image must be exactly ${size} pixels in resolution, high-quality, and contain ONLY the icon itself with NOTHING else, ensuring it is ready for immediate use in macOS and GitHub contexts."`

      const client = getOpenAIClient()
      
      const requestParams = {
        model: providerConfig.model || process.env.MODEL_NAME || 'gpt-image-1',
        prompt: enhancedPrompt,
        size: size,
        ...(responseFormat && (providerConfig.baseUrl?.includes('openai.com') || providerConfig.baseUrl?.includes('dalle.feiyuyu.net')) 
          ? { response_format: responseFormat } 
          : {})
      }

      const response = await client!.images.generate(requestParams)

      if (!response.data?.[0]) {
        throw new Error("invalid api response")
      }

      const imageData = response.data[0]

      if (imageData.url) {
        return {
          url: imageData.url,
          format: 'url'
        }
      } else if (imageData.b64_json) {
        return {
          base64: imageData.b64_json,
          format: 'base64'
        }
      } else {
        throw new Error("no image data found in api response")
      }

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