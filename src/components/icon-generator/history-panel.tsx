"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { iconStorage, type HistoryItem } from "@/lib/storage"
import { eventManager, EVENTS } from "@/lib/events"
import { StarIcon, StarFilledIcon, TrashIcon } from "@radix-ui/react-icons"
import { formatDistanceToNow } from "date-fns"
import { zhCN, enUS } from "date-fns/locale"
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

interface HistoryPanelProps {
  onSelect: (item: HistoryItem) => void
}

export function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const t = useTranslations('historyPanel')
  const locale = useLocale()
  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const [filter, setFilter] = React.useState<"all" | "favorites" | "client" | "server">("all")
  const [, forceUpdate] = React.useReducer(x => x + 1, 0) // Force re-render mechanism

  // Use useCallback to memoize refreshHistory function and prevent unnecessary re-renders
  const refreshHistory = React.useCallback(() => {
    const newHistory = iconStorage.getHistory()
    setHistory(newHistory)
    
    // Reset filter to "all" when history updates to ensure all items are visible
    // This prevents the issue where switching providers hides previously generated items
    if (newHistory.length > 0 && filter !== "all") {
      setFilter("all")
    }
    
    forceUpdate() // Force component re-render
  }, [filter]) // Include filter in dependencies for proper state synchronization

  React.useEffect(() => {
    // Initial load
    refreshHistory()

    // Subscribe to history update events
    const unsubscribe = eventManager.subscribe(EVENTS.HISTORY_UPDATE, () => {
      refreshHistory()
    })

    return unsubscribe
  }, [refreshHistory]) // Use refreshHistory in dependencies

  const filteredHistory = React.useMemo(() => {
    let filtered = history
    
    // Filter by favorites
    if (filter === "favorites") {
      filtered = filtered.filter((item) => item.isFavorite)
    }
    // Filter by generation type
    else if (filter === "client") {
      filtered = filtered.filter((item) => item.generationType === 'client')
    }
    else if (filter === "server") {
      filtered = filtered.filter((item) => item.generationType === 'server' || !item.generationType) // Include legacy items without generationType
    }
    
    return filtered
  }, [history, filter])

  const handleToggleFavorite = (id: string) => {
    iconStorage.toggleFavorite(id)
    eventManager.emit(EVENTS.HISTORY_UPDATE)
  }

  const handleRemove = (id: string) => {
    iconStorage.removeFromHistory(id)
    eventManager.emit(EVENTS.HISTORY_UPDATE)
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        {t('noHistory')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            {t('all')}
          </Button>
          <Button
            variant={filter === "favorites" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("favorites")}
          >
            {t('favorites')}
          </Button>
          <Button
            variant={filter === "client" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("client")}
          >
            {t('clientGenerated')}
          </Button>
          <Button
            variant={filter === "server" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("server")}
          >
            {t('serverGenerated')}
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            iconStorage.clearHistory()
            eventManager.emit(EVENTS.HISTORY_UPDATE)
          }}
        >
          {t('clearHistory')}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-lg border bg-background p-2"
          >
            <div className="aspect-square">
              <OptimizedImage
                src={item.imageUrl}
                alt={item.prompt}
                fill
                noRetry={true}
                className="cursor-pointer rounded-md object-contain"
                onClick={() => onSelect(item)}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(item.timestamp, {
                    addSuffix: true,
                    locale: locale === 'zh-CN' ? zhCN : enUS,
                  })}
                </span>
                {item.generationType && (
                  <span className="text-xs text-muted-foreground">
                    {item.generationType === 'client' ? t('clientTag') : t('serverTag')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggleFavorite(item.id)}
                >
                  {item.isFavorite ? (
                    <StarFilledIcon className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <StarIcon className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(item.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 