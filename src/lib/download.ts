export async function downloadImage(url: string, format: string) {
  try {
    // 获取图片数据
    const response = await fetch(url, {
      mode: 'cors',  // 启用跨域
      credentials: 'omit',  // 不发送 cookies
      headers: {
        'Accept': 'image/*'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)

    // 创建临时链接并触发下载
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `icon-${Date.now()}.${format}`
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('下载图片失败:', error)
    // 如果下载失败，提供备选方案
    window.open(url, '_blank')
    throw new Error('下载失败，已在新标签页打开图片')
  }
} 