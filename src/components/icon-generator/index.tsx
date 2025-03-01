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

export function IconGenerator() {
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
        
        // 使用服务器返回的友好消息
        if (errorData.message) {
          throw new Error(`[HTTP ${statusCode}] ${errorData.message}`)
        }
        
        // 如果服务器没有返回友好消息，则自己构造
        const resetTime = new Date(errorData.resetAt)
        const now = new Date()
        
        // 计算剩余时间
        const diffMs = resetTime.getTime() - now.getTime()
        const diffMins = Math.round(diffMs / 60000)
        const diffSecs = Math.round((diffMs % 60000) / 1000)
        
        let timeMessage = ""
        if (diffMins > 0) {
          timeMessage = `${diffMins} 分钟`
        }
        if (diffSecs > 0) {
          timeMessage += timeMessage ? ` ${diffSecs} 秒` : `${diffSecs} 秒`
        }
        
        throw new Error(
          `[HTTP ${statusCode}] 已达到${errorData.error.includes('小时') ? '每小时' : '每分钟'}请求限制。请在 ${timeMessage || '片刻'} 后再试。`
        )
      }

      if (!response.ok) {
        throw new Error(`[HTTP ${statusCode}] 请求失败`)
      }

      const data = await response.json()
      
      iconCache.set(cacheKey, data.url)
      setImageUrl(data.url)

      iconStorage.addToHistory({
        prompt,
        style,
        imageUrl: data.url,
      })
      
      // 触发速率限制更新事件
      eventManager.emit(EVENTS.RATE_LIMIT_UPDATE)
    } catch (error) {
      console.error("Error generating icon:", error)
      setError(error instanceof Error ? error.message : "生成图标时出错，请稍后重试")
      // 检查错误消息是否包含速率限制信息
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
                {error.includes('[HTTP 429]') ? '请求受限' : '生成失败'}
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
                  aria-label="关闭错误提示"
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
            {error.includes('请求限制') && (
              <button 
                onClick={() => eventManager.emit(EVENTS.RATE_LIMIT_UPDATE)}
                className="mt-2 text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                刷新限制状态
              </button>
            )}
          </div>
        </div>
      )}
      <PreviewPanel imageUrl={imageUrl} isLoading={isGenerating} />
      {imageUrl && <ExportOptions imageUrl={imageUrl} />}
      <div className="space-y-md">
        <h2 className="text-xl font-medium text-primary-800 dark:text-primary-200">历史记录</h2>
        <HistoryPanel onSelect={handleHistorySelect} />
      </div>
    </div>
  )
} 