import type { ExportOptions } from '@/config/site'

export async function downloadImage(url: string, options: ExportOptions) {
  try {
    // 使用代理服务器请求图片
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    const img = await createImageFromBlob(blob)
    const canvas = await processImage(img, options)
    
    // 转换为 blob
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
  } catch (error) {
    console.error('下载图片失败:', error)
    // 降级处理：直接在新标签页打开图片
    window.open(url, '_blank', 'noopener,noreferrer')
    return false
  }
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
  
  // 处理背景
  if (options.background !== 'transparent') {
    ctx.fillStyle = options.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  
  // 处理形状
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
  
  // 绘制图像
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