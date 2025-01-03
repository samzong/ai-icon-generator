export async function downloadImage(url: string, format: string) {
  try {
    // 创建一个新的 a 标签
    const link = document.createElement('a')
    link.href = url
    link.download = `icon-${Date.now()}.${format}`
    link.target = '_blank'
    
    // 模拟点击下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (error) {
    console.error('下载图片失败:', error)
    // 如果下载失败，在新标签页打开
    window.open(url, '_blank')
    return false
  }
} 