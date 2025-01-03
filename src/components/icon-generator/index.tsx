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

    // 生成缓存键
    const cacheKey = `${prompt}-${style}`

    try {
      // 检查缓存
      const cachedUrl = iconCache.get(cacheKey)
      if (cachedUrl) {
        setImageUrl(cachedUrl)
        // 添加到历史记录
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
      
      // 保存到缓存
      iconCache.set(cacheKey, data.url)
      setImageUrl(data.url)

      // 添加到历史记录
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
    <div className="space-y-8">
      <div className="space-y-4">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={generateIcon}
          isGenerating={isGenerating}
        />
        <StyleSelector value={style} onChange={setStyle} />
      </div>
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <PreviewPanel imageUrl={imageUrl} isLoading={isGenerating} />
      {imageUrl && <ExportOptions imageUrl={imageUrl} />}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">历史记录</h2>
        <HistoryPanel onSelect={handleHistorySelect} />
      </div>
    </div>
  )
} 