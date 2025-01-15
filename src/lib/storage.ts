export interface HistoryItem {
  id: string
  prompt: string
  style: string
  imageUrl: string
  timestamp: number
  isFavorite: boolean
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

  getHistory(): HistoryItem[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.HISTORY_KEY)
    return data ? JSON.parse(data) : []
  }

  addToHistory(item: Omit<HistoryItem, "id" | "timestamp" | "isFavorite">) {
    const history = this.getHistory()
    const newItem: HistoryItem = {
      ...item,
      id: generateUUID(),
      timestamp: Date.now(),
      isFavorite: false,
    }

    // 添加到历史记录开头
    const updatedHistory = [newItem, ...history]
    
    // 限制历史记录数量
    if (updatedHistory.length > this.MAX_HISTORY) {
      updatedHistory.pop()
    }

    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updatedHistory))
    return newItem
  }

  toggleFavorite(id: string) {
    const history = this.getHistory()
    const updatedHistory = history.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updatedHistory))
  }

  removeFromHistory(id: string) {
    const history = this.getHistory()
    const updatedHistory = history.filter((item) => item.id !== id)
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updatedHistory))
  }

  clearHistory() {
    localStorage.removeItem(this.HISTORY_KEY)
  }
}

export const iconStorage = new IconStorage() 

const STORAGE_KEYS = {
  CUSTOM_API_KEY: 'custom_openai_api_key',
} as const

export function getCustomApiKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.CUSTOM_API_KEY)
}

export function setCustomApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.CUSTOM_API_KEY, apiKey)
}

export function removeCustomApiKey(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_API_KEY)
} 