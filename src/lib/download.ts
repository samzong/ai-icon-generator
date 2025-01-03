export async function downloadImage(url: string, format: string) {
  try {
    // 获取图片数据
    const response = await fetch(url)
    const blob = await response.blob()

    // 创建下载链接
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `icon.${format}`

    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error downloading image:', error)
    throw error
  }
} 