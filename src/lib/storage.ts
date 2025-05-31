export interface HistoryItem {
  id: string
  prompt: string
  style: string
  imageUrl: string
  timestamp: number
  isFavorite: boolean
  generationType?: 'client' | 'server' // 标识生成方式：客户端直连或服务端代理
}

// Utility function to generate UUID that works in both browser and Node.js
function generateUUID(): string {
  // Use crypto.getRandomValues() which has better browser support
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    // Set version (4) and variant (2) bits
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;
    
    // Convert to hex string
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class IconStorage {
  private readonly HISTORY_KEY = "icon_history"
  private readonly MAX_HISTORY = 50
  private readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024 // 4MB limit to stay safe

  // Check if localStorage has enough space
  private checkStorageQuota(data: string): boolean {
    try {
      // Estimate current localStorage usage
      let totalSize = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }
      
      // Add the size of new data
      const newDataSize = data.length + this.HISTORY_KEY.length
      return (totalSize + newDataSize) < this.MAX_STORAGE_SIZE
    } catch {
      return false
    }
  }

  // Clean old items to make space
  private cleanupStorage(): void {
    const history = this.getHistory()
    if (history.length === 0) return

    // Remove oldest non-favorite items first
    const nonFavorites = history.filter(item => !item.isFavorite)
    const favorites = history.filter(item => item.isFavorite)
    
    // Keep only the most recent 20 non-favorites and all favorites
    const cleanedHistory = [
      ...nonFavorites.slice(0, 20),
      ...favorites
    ].sort((a, b) => b.timestamp - a.timestamp)

    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(cleanedHistory))
    } catch {
      // If still failing, keep only favorites
      try {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(favorites.slice(0, 10)))
      } catch {
        // Last resort: clear all history
        this.clearHistory()
      }
    }
  }

  // Safe localStorage setItem with quota handling
  private safeSetItem(key: string, value: string): boolean {
    try {
      // Check quota before attempting to store
      if (!this.checkStorageQuota(value)) {
        this.cleanupStorage()
        
        // Try again after cleanup
        if (!this.checkStorageQuota(value)) {
          console.warn('Storage quota still exceeded after cleanup')
          return false
        }
      }

      localStorage.setItem(key, value)
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting cleanup...')
        this.cleanupStorage()
        
        // Try one more time after cleanup
        try {
          localStorage.setItem(key, value)
          return true
        } catch {
          console.error('Failed to store data even after cleanup')
          return false
        }
      }
      console.error('Storage error:', error)
      return false
    }
  }

  getHistory(): HistoryItem[] {
    if (typeof window === "undefined") return []
    try {
      const data = localStorage.getItem(this.HISTORY_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to parse history data:', error)
      // Clear corrupted data
      this.clearHistory()
      return []
    }
  }

  addToHistory(item: Omit<HistoryItem, "id" | "timestamp" | "isFavorite">) {
    const history = this.getHistory()
    
    // Check if the same image already exists
    const existingIndex = history.findIndex((h) => h.imageUrl === item.imageUrl)
    
    if (existingIndex !== -1) {
      // If exists, update timestamp and move to front
      const existing = history[existingIndex]
      history.splice(existingIndex, 1)
      const updatedItem = {
        ...existing,
        timestamp: Date.now(),
      }
      history.unshift(updatedItem)
      
      const success = this.safeSetItem(this.HISTORY_KEY, JSON.stringify(history))
      if (!success) {
        console.warn('Failed to update history item')
        return existing // Return original item if storage fails
      }
      return updatedItem
    }

    // If not exists, add new record
    const newItem: HistoryItem = {
      ...item,
      id: generateUUID(),
      timestamp: Date.now(),
      isFavorite: false,
    }

    // Add to the beginning of history
    const updatedHistory = [newItem, ...history]
    
    // Limit history count
    if (updatedHistory.length > this.MAX_HISTORY) {
      updatedHistory.pop()
    }

    const success = this.safeSetItem(this.HISTORY_KEY, JSON.stringify(updatedHistory))
    if (!success) {
      console.warn('Failed to add new history item')
      // Try to add without the oldest items
      const reducedHistory = [newItem, ...history.slice(0, Math.floor(this.MAX_HISTORY / 2))]
      this.safeSetItem(this.HISTORY_KEY, JSON.stringify(reducedHistory))
    }
    
    return newItem
  }

  toggleFavorite(id: string) {
    const history = this.getHistory()
    const updatedHistory = history.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    
    const success = this.safeSetItem(this.HISTORY_KEY, JSON.stringify(updatedHistory))
    if (!success) {
      console.warn('Failed to toggle favorite status')
    }
  }

  removeFromHistory(id: string) {
    const history = this.getHistory()
    const updatedHistory = history.filter((item) => item.id !== id)
    
    const success = this.safeSetItem(this.HISTORY_KEY, JSON.stringify(updatedHistory))
    if (!success) {
      console.warn('Failed to remove history item')
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem(this.HISTORY_KEY)
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  // Get storage usage info for debugging
  getStorageInfo() {
    if (typeof window === "undefined") return null
    
    try {
      let totalSize = 0
      let historySize = 0
      
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const itemSize = localStorage[key].length + key.length
          totalSize += itemSize
          if (key === this.HISTORY_KEY) {
            historySize = itemSize
          }
        }
      }
      
      return {
        totalSize,
        historySize,
        historyCount: this.getHistory().length,
        maxSize: this.MAX_STORAGE_SIZE,
        usage: (totalSize / this.MAX_STORAGE_SIZE * 100).toFixed(2) + '%'
      }
    } catch {
      return null
    }
  }
}

export const iconStorage = new IconStorage() 

const STORAGE_KEYS = {
  API_PROVIDER_CONFIG: 'api_provider_config',
} as const

// API Provider types
export type ApiProvider = 'default' | 'openai' | 'free-dall-e-proxy' | 'console-d-run'

export interface ApiProviderConfig {
  apiKey: string
  baseUrl?: string
  model?: string
}

export interface ApiConfig {
  selectedProvider: ApiProvider
  providers: Record<ApiProvider, ApiProviderConfig>
}

// Default configuration
const DEFAULT_API_CONFIG: ApiConfig = {
  selectedProvider: 'default',
  providers: {
    'default': {
      apiKey: '',
      baseUrl: '',
      model: '',
    },
    'openai': {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-image-1',
    },
    'free-dall-e-proxy': {
      apiKey: '',
      baseUrl: 'https://dalle.feiyuyu.net/v1',
      model: 'gpt-image-1',
    },
    'console-d-run': {
      apiKey: '',
      baseUrl: 'https://chat.d.run',
      model: 'public/hidream-i1-dev',
    }
  }
}

// New API configuration functions
export function getApiConfig(): ApiConfig {
  if (typeof window === 'undefined') return DEFAULT_API_CONFIG
  
  const stored = localStorage.getItem(STORAGE_KEYS.API_PROVIDER_CONFIG)
  if (!stored) return DEFAULT_API_CONFIG
  
  try {
    const parsed = JSON.parse(stored)
    // Merge with defaults to ensure all providers exist
    return {
      ...DEFAULT_API_CONFIG,
      ...parsed,
      providers: {
        ...DEFAULT_API_CONFIG.providers,
        ...parsed.providers
      }
    }
  } catch {
    return DEFAULT_API_CONFIG
  }
}

export function setApiConfig(config: ApiConfig): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.API_PROVIDER_CONFIG, JSON.stringify(config))
}

export function getSelectedProviderConfig(): ApiProviderConfig {
  const config = getApiConfig()
  return config.providers[config.selectedProvider]
} 