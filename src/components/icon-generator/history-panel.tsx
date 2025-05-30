"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { iconStorage, type HistoryItem } from "@/lib/storage"
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
  const [filter, setFilter] = React.useState<"all" | "favorites">("all")

  React.useEffect(() => {
    setHistory(iconStorage.getHistory())
  }, [])

  const filteredHistory = React.useMemo(() => {
    return filter === "favorites"
      ? history.filter((item) => item.isFavorite)
      : history
  }, [history, filter])

  const handleToggleFavorite = (id: string) => {
    iconStorage.toggleFavorite(id)
    setHistory(iconStorage.getHistory())
  }

  const handleRemove = (id: string) => {
    iconStorage.removeFromHistory(id)
    setHistory(iconStorage.getHistory())
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
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            iconStorage.clearHistory()
            setHistory([])
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
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(item.timestamp, {
                  addSuffix: true,
                  locale: locale === 'zh-CN' ? zhCN : enUS,
                })}
              </span>
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