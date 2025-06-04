import { getApiConfig, getSelectedProviderConfig } from "./storage"
import {
  type GenerateIconResult,
  type GenerateIconOptions,
  createEnhancedPrompt,
  prepareClientRequest,
  parseApiResponse,
  handleHttpError,
  handleNetworkError,
  shouldUseClientSideCall,
  sanitizeRequestBody
} from "./icon-generation-core"

// Client-side OpenAI API call
export async function generateIconClient(
  prompt: string, 
  style: string,
  options: GenerateIconOptions = {}
): Promise<GenerateIconResult> {
  const config = getApiConfig()
  const providerConfig = getSelectedProviderConfig()
  
  // If using default provider, delegate to server-side API
  if (config.selectedProvider === 'default') {
    throw new Error('Default provider should use server-side API')
  }

  const {
    responseFormat = 'url',
    size = '1024x1024',
  } = options

  const enhancedPrompt = createEnhancedPrompt(prompt, style, size)

  // Prepare request based on provider
  const requestData = prepareClientRequest(providerConfig, enhancedPrompt, size, responseFormat)
  
  try {
    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: requestData.headers,
      body: JSON.stringify(requestData.body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      // If we get an "unknown parameter" error specifically for response_format, retry without it
      if (response.status === 400 && errorText.includes('response_format') && errorText.includes('unknown parameter')) {
        console.warn('Provider does not support response_format parameter, retrying without it...')
        
        // Sanitize the request body to remove unsupported parameters
        const sanitizedBody = sanitizeRequestBody(requestData.body, providerConfig.baseUrl)
        
        const retryResponse = await fetch(requestData.url, {
          method: 'POST',
          headers: requestData.headers,
          body: JSON.stringify(sanitizedBody),
        })

        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text()
          throw handleHttpError(retryResponse.status, retryErrorText)
        }

        const retryData = await retryResponse.json()
        return parseApiResponse(retryData, config.selectedProvider)
      }
      
      throw handleHttpError(response.status, errorText)
    }

    const data = await response.json()
    return parseApiResponse(data, config.selectedProvider)
  } catch (error) {
    console.error('Client-side API call failed:', error)
    
    if (error instanceof Error) {
      throw handleNetworkError(error)
    }
    
    throw error
  }
}

// Re-export for convenience
export { shouldUseClientSideCall, type GenerateIconResult } 