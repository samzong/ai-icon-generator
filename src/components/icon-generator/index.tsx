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

export function IconGenerator() {
  const [prompt, setPrompt] = React.useState("")
  const [style, setStyle] = React.useState<typeof imageConfig.styles[number]>("flat")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const generateIcon = async () => {
    if (!prompt) return
    setIsGenerating(true)
    setError(null)

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      iconCache.set(cacheKey, data.url)
      setImageUrl(data.url)

      iconStorage.addToHistory({
        prompt,
        style,
        imageUrl: data.url,
      })
    } catch (error) {
      console.error("Error generating icon:", error)
      setError("生成图标时出错，请稍后重试")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleHistorySelect = (item: HistoryItem) => {
    setPrompt(item.prompt)
    setStyle(item.style as typeof imageConfig.styles[number])
    setImageUrl(item.imageUrl)
  }

  return (
    <div className="space-y-xl">
      <div className="space-y-md">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={generateIcon}
          isGenerating={isGenerating}
        />
        <StyleSelector value={style} onChange={setStyle} />
      </div>
      {error && (
        <div className="rounded-md bg-error/15 p-md text-sm text-error flex items-center space-x-sm">
          <svg
            className="h-4 w-4 shrink-0"
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
          <span>{error}</span>
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