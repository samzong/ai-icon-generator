"use client"

import * as React from "react"
import { ReloadIcon } from "@radix-ui/react-icons"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { useTranslations } from 'next-intl'

interface PreviewPanelProps {
  imageUrl: string | null
  isLoading: boolean
}

export function PreviewPanel({ imageUrl, isLoading }: PreviewPanelProps) {
  const t = useTranslations('previewPanel')
  
  return (
    <div className="flex items-center justify-center rounded-lg border bg-muted/50 p-8">
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <ReloadIcon className="h-4 w-4 animate-spin" />
          <span>{t('generating')}</span>
        </div>
      ) : imageUrl ? (
        <div className="relative aspect-square w-48">
          <OptimizedImage
            src={imageUrl}
            alt="Generated icon"
            className="h-full w-full rounded-lg object-contain"
            fallback={
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{t('loadFailed')}</span>
                <button
                  onClick={() => window.open(imageUrl, '_blank')}
                  className="text-xs text-primary hover:underline"
                >
                  {t('viewDirectly')}
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <span className="text-muted-foreground">
          {t('previewArea')}
        </span>
      )}
    </div>
  )
} 