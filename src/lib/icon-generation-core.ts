import { getApiConfig, type ApiProviderConfig } from "./storage"

export interface GenerateIconResult {
  url?: string
  base64?: string
  format: 'url' | 'base64'
}

export interface GenerateIconOptions {
  responseFormat?: 'url' | 'b64_json'
  size?: '256x256' | '512x512' | '1024x1024'
}

// Define types for API responses
interface ImageData {
  url?: string
  b64_json?: string
}

interface ApiResponse {
  data?: ImageData[]
}

// Generate enhanced prompt for icon generation
export function createEnhancedPrompt(prompt: string, style: string, size: '256x256' | '512x512' | '1024x1024'): string {
  return `"Create a professional macOS app icon with a ${style} style (e.g., modern, minimalist, flat). The icon should represent a single, unique, and memorable subject based on the user's simple and concise description: '${prompt}', which represents the main theme or element of the icon. The icon must be centered, isolated on a fully transparent background, with NO frames, borders, or UI elements around it. Ensure the design is simple, with NO additional decorative elements, and suitable as a macOS app icon or GitHub project logo. The icon should be easily recognizable even at small sizes. Use a cohesive color palette with 2-3 appropriate colors (e.g., shades of blue, gray, or green to suggest technology and professionalism) and maintain visual balance. The final image must be exactly ${size} pixels in resolution, high-quality, and contain ONLY the icon itself with NOTHING else, ensuring it is ready for immediate use in macOS and GitHub contexts."`
}

// Check if a provider supports response_format parameter
export function supportsResponseFormat(baseUrl?: string): boolean {
  if (!baseUrl) return true // Default to true for official OpenAI API
  
  // Official OpenAI domains that support response_format
  const supportedDomains = [
    'api.openai.com',
    'dalle.feiyuyu.net' // Known working proxy
  ]
  
  return supportedDomains.some(domain => baseUrl.includes(domain))
}

// Remove unsupported parameters from request body
export function sanitizeRequestBody(body: Record<string, unknown>, baseUrl?: string): Record<string, unknown> {
  const sanitized = { ...body }
  
  // Remove response_format if provider doesn't support it
  if (!supportsResponseFormat(baseUrl)) {
    delete sanitized.response_format
  }
  
  return sanitized
}

// Prepare request data for different providers (client-side)
export function prepareClientRequest(
  providerConfig: ApiProviderConfig,
  prompt: string,
  size: '256x256' | '512x512' | '1024x1024',
  responseFormat: 'url' | 'b64_json'
) {
  const config = getApiConfig()
  
  switch (config.selectedProvider) {
    case 'openai':
      const baseBody = {
        model: providerConfig.model || 'gpt-image-1',
        prompt,
        size,
        n: 1,
      }
      
      // Only add response_format if provider supports it
      const body = supportsResponseFormat(providerConfig.baseUrl) 
        ? { ...baseBody, response_format: responseFormat }
        : baseBody
      
      return {
        url: `${providerConfig.baseUrl}/images/generations`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerConfig.apiKey}`,
        },
        body
      }

    case 'free-dall-e-proxy':
      const proxyBaseBody = {
        model: providerConfig.model || 'gpt-image-1',
        prompt,
        size,
        n: 1,
      }
      
      // Only add response_format if provider supports it
      const proxyBody = supportsResponseFormat(providerConfig.baseUrl)
        ? { ...proxyBaseBody, response_format: responseFormat }
        : proxyBaseBody
      
      return {
        url: `${providerConfig.baseUrl}/images/generations`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerConfig.apiKey}`,
        },
        body: proxyBody
      }

    case 'console-d-run':
      return {
        url: `${providerConfig.baseUrl}/v1/images/generations`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerConfig.apiKey}`,
        },
        body: {
          model: providerConfig.model || 'public/hidream-i1-dev',
          prompt,
          size,
          n: 1,
        }
      }

    default:
      throw new Error(`Unsupported provider: ${config.selectedProvider}`)
  }
}

// Prepare request parameters for OpenAI SDK (server-side)
export function prepareServerRequest(
  providerConfig: ApiProviderConfig,
  prompt: string,
  size: '256x256' | '512x512' | '1024x1024',
  responseFormat: 'url' | 'b64_json'
) {
  const baseParams = {
    model: providerConfig.model || process.env.MODEL_NAME || 'gpt-image-1',
    prompt,
    size: size as '256x256' | '512x512' | '1024x1024',
  }

  // Only add response_format if it's supported and valid
  if (responseFormat && (providerConfig.baseUrl?.includes('openai.com') || providerConfig.baseUrl?.includes('dalle.feiyuyu.net'))) {
    return {
      ...baseParams,
      response_format: responseFormat as 'url' | 'b64_json'
    }
  }

  return baseParams
}

// Parse response from different providers - unified logic
export function parseApiResponse(data: unknown, provider: string): GenerateIconResult {
  const response = data as ApiResponse

  // Handle OpenAI SDK response format (server-side)
  if (response.data && Array.isArray(response.data)) {
    if (!response.data[0]) {
      throw new Error("Invalid API response: no image data")
    }
    
    const imageData = response.data[0] as ImageData
    if (imageData.url) {
      return { url: imageData.url, format: 'url' }
    } else if (imageData.b64_json) {
      return { base64: imageData.b64_json, format: 'base64' }
    } else {
      throw new Error("No image data found in API response")
    }
  }

  // Handle direct API response format (client-side)
  switch (provider) {
    case 'openai':
    case 'free-dall-e-proxy':
      if (!response.data?.[0]) {
        console.error('Missing data array in response:', data)
        throw new Error('Invalid API response: no image data')
      }
      
      const imageData = response.data[0] as ImageData
      
      if (imageData.url) {
        return { url: imageData.url, format: 'url' }
      } else if (imageData.b64_json) {
        return { base64: imageData.b64_json, format: 'base64' }
      }
      
      console.error('No URL or base64 data found in image data:', imageData)
      throw new Error('No image data found in response')

    case 'console-d-run':
      if (!response.data?.[0]) {
        console.error('Missing URL in console-d-run response:', data)
        throw new Error('Invalid API response: no image URL')
      }
      const consoleImageData = response.data[0] as ImageData
      if (!consoleImageData.url) {
        console.error('Missing URL in console-d-run response:', data)
        throw new Error('Invalid API response: no image URL')
      }
      return { url: consoleImageData.url, format: 'url' }

    default:
      throw new Error(`Unsupported provider response format: ${provider}`)
  }
}

// Handle HTTP errors with user-friendly messages
export function handleHttpError(status: number, errorText: string): Error {
  if (status === 400 && errorText.includes('unknown parameter')) {
    if (errorText.includes('response_format')) {
      return new Error('API provider does not support response_format parameter. This is expected for some proxy services.')
    }
    return new Error(`Invalid request parameter: ${errorText}`)
  }
  
  switch (status) {
    case 401:
      return new Error('Invalid API key. Please check your API configuration.')
    case 403:
      return new Error('Access forbidden. Please verify your API key permissions.')
    case 429:
      return new Error('Rate limit exceeded. Please try again later.')
    case 500:
    case 502:
    case 503:
    case 504:
      return new Error('Server error. Please try again later.')
    default:
      return new Error(`HTTP ${status}: ${errorText || 'Unknown error'}`)
  }
}

// Handle network errors
export function handleNetworkError(error: Error): Error {
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return new Error('Network error: Unable to connect to the API. This might be due to CORS restrictions or network connectivity issues.')
  }
  
  // Handle CORS errors specifically
  if (error instanceof TypeError && (
    error.message.includes('CORS') || 
    error.message.includes('Cross-Origin') ||
    error.message.includes('blocked by CORS policy')
  )) {
    return new Error('CORS error: The API provider does not allow direct browser access. Please use the default server-side configuration instead.')
  }
  
  return error
}

// Check if current configuration should use client-side calling
export function shouldUseClientSideCall(): boolean {
  const config = getApiConfig()
  return config.selectedProvider !== 'default'
} 