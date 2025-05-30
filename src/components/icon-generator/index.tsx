"use client"

import * as React from "react"
import { PromptInput } from "./prompt-input"
import { StyleSelector } from "./style-selector"
import { ConfigIndicator } from "./config-indicator"
import { PreviewPanel } from "./preview-panel"
import { ExportOptions } from "./export-options"
import { HistoryPanel } from "./history-panel"
import { imageConfig } from "@/config/site"
import { iconCache } from "@/lib/cache"
import { iconStorage, type HistoryItem } from "@/lib/storage"
import { eventManager, EVENTS } from "@/lib/events"
import { useTranslations } from 'next-intl'
import { generateIconClient } from "@/lib/openai-client"
import { shouldUseClientSideCall } from "@/lib/icon-generation-core"

export function IconGenerator() {
  const t = useTranslations('iconGenerator')
  const tHistory = useTranslations('historyPanel')
  const [prompt, setPrompt] = React.useState("")
  const [style, setStyle] = React.useState<typeof imageConfig.styles[number]>("flat")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = React.useState(false)

  const generateIcon = async () => {
    if (!prompt) return
    setIsGenerating(true)
    setError(null)
    setIsRateLimited(false)

    const cacheKey = `${prompt}-${style}`

    try {
      const cachedUrl = iconCache.get(cacheKey)
      if (cachedUrl) {
        setImageUrl(cachedUrl)
        iconStorage.addToHistory({
          prompt,
          style,
          imageUrl: cachedUrl,
        })
        
        // Trigger history update event
        eventManager.emit(EVENTS.HISTORY_UPDATE)
        return
      }

      let result
      
      // Choose calling method based on configuration
      if (shouldUseClientSideCall()) {
        // Client-side direct API call for custom configurations
        result = await generateIconClient(prompt, style)
        
        // Handle different response formats
        let imageUrl: string
        if (result.format === 'url' && result.url) {
          imageUrl = result.url
        } else if (result.format === 'base64' && result.base64) {
          imageUrl = `data:image/png;base64,${result.base64}`
        } else {
          throw new Error("Invalid response format from generateIconClient")
        }
        
        iconCache.set(cacheKey, imageUrl)
        setImageUrl(imageUrl)
        
        iconStorage.addToHistory({
          prompt,
          style,
          imageUrl: imageUrl,
        })
        
        // Trigger history update event
        eventManager.emit(EVENTS.HISTORY_UPDATE)
      } else {
        // Server-side proxy call for default configuration
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, style }),
        })

        // Save status code for error display
        const statusCode = response.status

        // Handle rate limit errors
        if (statusCode === 429) {
          setIsRateLimited(true)
          const errorData = await response.json()
          
          // Use server-returned friendly message
          if (errorData.message) {
            throw new Error(`[HTTP ${statusCode}] ${errorData.message}`)
          }
          
          // If server doesn't return friendly message, construct our own
          const resetTime = new Date(errorData.resetAt)
          const now = new Date()
          
          // Calculate remaining time
          const diffMs = resetTime.getTime() - now.getTime()
          const diffMins = Math.round(diffMs / 60000)
          const diffSecs = Math.round((diffMs % 60000) / 1000)
          
          let timeMessage = ""
          if (diffMins > 0) {
            timeMessage = `${diffMins} ${t('errors.minutes')}`
          }
          if (diffSecs > 0) {
            timeMessage += timeMessage ? ` ${diffSecs} ${t('errors.seconds')}` : `${diffSecs} ${t('errors.seconds')}`
          }
          
          const limitType = errorData.error.includes('小时') || errorData.error.includes('hour') ? t('errors.rateLimitHourly') : t('errors.rateLimitMinutely')
          throw new Error(
            `[HTTP ${statusCode}] ${t('errors.rateLimitMessage', { type: limitType, time: timeMessage || t('errors.rateLimitMessageFallback') })}`
          )
        }

        if (!response.ok) {
          throw new Error(`[HTTP ${statusCode}] ${t('errors.requestFailed')}`)
        }

        const data = await response.json()
        
        iconCache.set(cacheKey, data.url)
        setImageUrl(data.url)

        iconStorage.addToHistory({
          prompt,
          style,
          imageUrl: data.url,
        })
        
        // Trigger history update event
        eventManager.emit(EVENTS.HISTORY_UPDATE)
      }
      
      // Trigger rate limit update event
      eventManager.emit(EVENTS.RATE_LIMIT_UPDATE)
    } catch (error) {
      console.error("Error generating icon:", error)
      setError(error instanceof Error ? error.message : t('errors.generateFailed'))
      // Check if error message contains rate limit information
      if (error instanceof Error && error.message.includes('[HTTP 429]')) {
        setIsRateLimited(true)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleHistorySelect = (item: HistoryItem) => {
    setPrompt(item.prompt)
    setStyle(item.style as typeof imageConfig.styles[number])
    setImageUrl(item.imageUrl)
  }

  // Clear error message
  const clearError = () => {
    setError(null)
    setIsRateLimited(false)
  }

  return (
    <div className="space-y-xl">
      <div className="space-y-md">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={generateIcon}
          isGenerating={isGenerating}
          isDisabled={isRateLimited}
        />
        <StyleSelector value={style} onChange={setStyle} />
        <ConfigIndicator />
      </div>
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm border border-red-200 dark:border-red-800 flex items-start space-x-3">
          <svg
            className="h-5 w-5 shrink-0 text-red-500 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-red-800 dark:text-red-200">
                {error.includes('[HTTP 429]') ? t('errors.requestLimited') : t('errors.requestFailed')}
              </p>
              <div className="flex items-center space-x-2">
                {error.match(/\[HTTP (\d+)\]/) && (
                  <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded-sm font-mono">
                    {error.match(/\[HTTP (\d+)\]/)?.[1] || ''}
                  </span>
                )}
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label={t('errors.closeError')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="mt-1 text-red-700 dark:text-red-300">
              {error.replace(/\[HTTP \d+\] /, '')}
            </p>
            {(error.includes('请求限制') || error.includes('rate limit')) && (
              <button 
                onClick={() => eventManager.emit(EVENTS.RATE_LIMIT_UPDATE)}
                className="mt-2 text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                {t('errors.refreshLimitStatus')}
              </button>
            )}
          </div>
        </div>
      )}
      <PreviewPanel imageUrl={imageUrl} isLoading={isGenerating} />
      {imageUrl && <ExportOptions imageUrl={imageUrl} />}
      <div className="space-y-md">
        <h2 className="text-xl font-medium text-primary-800 dark:text-primary-200">{tHistory('historyTitle')}</h2>
        <HistoryPanel onSelect={handleHistorySelect} />
      </div>
    </div>
  )
} 