export interface HistoryItem {
  id: string
  prompt: string
  style: string
  imageUrl: string
  timestamp: number
  isFavorite: boolean
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
      id: crypto.randomUUID(),
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