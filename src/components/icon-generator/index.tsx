"use client"

import * as React from "react"
import { PromptInput } from "./prompt-input"
import { StyleSelector } from "./style-selector"
import { PreviewPanel } from "./preview-panel"
import { ExportOptions } from "./export-options"
import { HistoryPanel } from "./history-panel"
import { imageConfig } from "@/config/site"
import { iconCache } from "@/lib/cache"
import { iconStorage, type HistoryItem } from "@/lib/storage"
import { eventManager, EVENTS } from "@/lib/events"
import { useTranslations } from 'next-intl';

export function IconGenerator() {
  const t = useTranslations('IconGenerator');
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
        return
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, style }),
      })

      // 保存状态码，用于错误显示
      const statusCode = response.status

      // 处理速率限制错误
      if (statusCode === 429) {
        setIsRateLimited(true)
        const errorData = await response.json()
        
        // Use server's friendly message if available
        if (errorData.message) {
          throw new Error(`${t('errorHttpPrefix')} ${statusCode}: ${errorData.message}`);
        }
        
        // Construct a friendly message if server didn't provide one
        const resetTime = new Date(errorData.resetAt);
        const now = new Date();
        const diffMs = resetTime.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffSecs = Math.round((diffMs % 60000) / 1000);
        
        let timeParts = [];
        if (diffMins > 0) {
          timeParts.push(t('timeMinutes', { count: diffMins }));
        }
        if (diffSecs > 0) {
          timeParts.push(t('timeSeconds', { count: diffSecs }));
        }
        const timeMessage = timeParts.join(' ') || t('timeMoment');
        
        const messageKey = errorData.error?.includes('hour') || errorData.error?.includes('小时') 
          ? 'rateLimitHourlyMessage' 
          : 'rateLimitMinutelyMessage';
        throw new Error(`${t('errorHttpPrefix')} ${statusCode}: ${t(messageKey, { timeMessage })}`);
      }

      if (!response.ok) {
        throw new Error(`${t('errorHttpPrefix')} ${statusCode}: ${t('errorRequestFailed')}`);
      }

      const data = await response.json();
      iconCache.set(cacheKey, data.url);
      setImageUrl(data.url)

      iconStorage.addToHistory({
        prompt,
        style,
        imageUrl: data.url,
      })
      
      // 触发速率限制更新事件
      eventManager.emit(EVENTS.RATE_LIMIT_UPDATE)
    } catch (error) {
      console.error("Error generating icon:", error);
      setError(error instanceof Error ? error.message : t('errorDefault'));
      // Check if error message indicates rate limiting
      if (error instanceof Error && (error.message.includes(`${t('errorHttpPrefix')} 429`) || error.message.includes('[HTTP 429]'))) {
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

  // 清除错误信息
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
                {isRateLimited ? t('errorRateLimitedTitle') : t('errorGenerationFailedTitle')}
              </p>
              <div className="flex items-center space-x-2">
                {error.match(/ ((\d+)):/) && ( // Adjusted regex to match "HTTP <code>:"
                  <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded-sm font-mono">
                    {error.match(/ ((\d+)):/)?.[1] || ''}
                  </span>
                )}
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label={t('errorCloseAriaLabel')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="mt-1 text-red-700 dark:text-red-300">
              {error.replace(new RegExp(`${t('errorHttpPrefix')} \\d+: `), '')}
            </p>
            {isRateLimited && (
              <button 
                onClick={() => eventManager.emit(EVENTS.RATE_LIMIT_UPDATE)}
                className="mt-2 text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                {t('errorRefreshStatus')}
              </button>
            )}
          </div>
        </div>
      )}
      <PreviewPanel imageUrl={imageUrl} isLoading={isGenerating} />
      {imageUrl && <ExportOptions imageUrl={imageUrl} />}
      <div className="space-y-md">
        <h2 className="text-xl font-medium text-primary-800 dark:text-primary-200">{t('historyTitle')}</h2>
        <HistoryPanel onSelect={handleHistorySelect} />
      </div>
    </div>
  )
} 