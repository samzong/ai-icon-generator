type CacheItem = {
  url: string
  timestamp: number
}

class IconCache {
  private cache: Map<string, CacheItem>
  private readonly maxAge: number // 缓存过期时间（毫秒）

  constructor(maxAge = 24 * 60 * 60 * 1000) { // 默认 24 小时
    this.cache = new Map()
    this.maxAge = maxAge
  }

  set(key: string, url: string) {
    this.cache.set(key, {
      url,
      timestamp: Date.now(),
    })
  }

  get(key: string): string | null {
    const item = this.cache.get(key)
    if (!item) return null

    // 检查是否过期
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    return item.url
  }

  clear() {
    this.cache.clear()
  }
}

// 创建单例实例
export const iconCache = new IconCache() 