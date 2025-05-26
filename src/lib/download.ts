import type { ExportOptions } from '@/config/site'

export async function downloadImage(url: string, options: ExportOptions) {
  try {
    // Validate URL
    if (!url) {
      throw new Error('图片URL为空')
    }
    
    // Check URL type and handle accordingly
    const urlType = getUrlType(url)
    
    if (urlType === 'invalid') {
      throw new Error('无效的图片URL格式')
    }
    
    // Handle data URLs directly
    if (urlType === 'data') {
      return await handleDataUrl(url, options)
    }
    
    // Handle blob URLs directly
    if (urlType === 'blob') {
      return await handleBlobUrl(url, options)
    }
    
    // Handle HTTP/HTTPS URLs through proxy
    if (urlType !== 'http') {
      throw new Error(`不支持的URL类型: ${urlType}`)
    }

    // Use proxy server with fallback to POST for long URLs
    const encodedUrl = encodeURIComponent(url)
    const proxyUrl = `/api/proxy?url=${encodedUrl}`
    
    let response: Response
    
    if (proxyUrl.length > 2000) {
      response = await fetchWithRetryPost('/api/proxy', url, 2)
    } else {
      response = await fetchWithRetry(proxyUrl, 2)
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    
    if (blob.size === 0) {
      throw new Error('获取到的图片数据为空')
    }

    return await processAndDownload(blob, options)
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('图片URL为空') || 
          error.message.includes('无效的图片URL格式') ||
          error.message.includes('不支持的URL类型')) {
        throw error // Re-throw validation errors
      }
    }
    
    // Fallback: open in new tab
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (openError) {
      console.error('Failed to open in new tab:', openError)
    }
    return false
  }
}

// Detect URL type
function getUrlType(url: string): 'http' | 'data' | 'blob' | 'invalid' {
  try {
    if (url.startsWith('data:')) return 'data'
    if (url.startsWith('blob:')) return 'blob'
    
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return 'http'
    }
    
    return 'invalid'
  } catch {
    return 'invalid'
  }
}

// Handle data URLs
async function handleDataUrl(dataUrl: string, options: ExportOptions): Promise<boolean> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  
  if (blob.size === 0) {
    throw new Error('Data URL转换失败')
  }
  
  return await processAndDownload(blob, options)
}

// Handle blob URLs
async function handleBlobUrl(blobUrl: string, options: ExportOptions): Promise<boolean> {
  const response = await fetch(blobUrl)
  const blob = await response.blob()
  
  if (blob.size === 0) {
    throw new Error('Blob URL转换失败')
  }
  
  return await processAndDownload(blob, options)
}

// Process image and trigger download
async function processAndDownload(blob: Blob, options: ExportOptions): Promise<boolean> {
  const img = await createImageFromBlob(blob)
  const canvas = await processImage(img, options)
  const processedBlob = await canvasToBlob(canvas, options.format)
  const blobUrl = URL.createObjectURL(processedBlob)
  
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = `icon-${Date.now()}.${options.format}`
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(blobUrl)
  
  return true
}

// Fetch with retry (GET)
async function fetchWithRetry(url: string, retries: number): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch(url, {
        headers: { 'Accept': 'image/*,*/*' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('All retries failed')
}

// Fetch with retry (POST)
async function fetchWithRetryPost(apiUrl: string, imageUrl: string, retries: number): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'image/*,*/*',
        },
        body: JSON.stringify({ url: imageUrl }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('All retries failed')
}

function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}

async function processImage(img: HTMLImageElement, options: ExportOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  canvas.width = img.width
  canvas.height = img.height
  
  // Handle background
  if (options.background !== 'transparent') {
    ctx.fillStyle = options.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  
  // Handle shape
  if (options.shape !== 'square') {
    ctx.beginPath()
    const radius = options.shape === 'circle' 
      ? Math.min(canvas.width, canvas.height) / 2
      : Math.min(canvas.width, canvas.height) * 0.1
      
    if (options.shape === 'circle') {
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        radius,
        0,
        Math.PI * 2
      )
    } else {
      ctx.roundRect(0, 0, canvas.width, canvas.height, radius)
    }
    
    ctx.clip()
  }
  
  // Draw image
  ctx.drawImage(img, 0, 0)
  
  return canvas
}

async function canvasToBlob(canvas: HTMLCanvasElement, format: string): Promise<Blob> {
  const mimeType = getMimeType(format)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas to Blob conversion failed'))
      },
      mimeType,
      1
    )
  })
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    ico: 'image/x-icon',
    icns: 'image/x-icns'
  }
  return mimeTypes[format] || 'application/octet-stream'
} 