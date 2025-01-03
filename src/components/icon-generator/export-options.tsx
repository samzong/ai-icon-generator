"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { imageConfig } from "@/config/site"
import { downloadImage } from "@/lib/download"
import { ReloadIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

interface ExportOptionsProps {
  imageUrl: string
}

export function ExportOptions({ imageUrl }: ExportOptionsProps) {
  const [isDownloading, setIsDownloading] = React.useState<string | null>(null)

  const handleDownload = async (format: typeof imageConfig.formats[number]) => {
    if (isDownloading) return
    setIsDownloading(format)

    try {
      const success = await downloadImage(imageUrl, format)
      if (success) {
        toast.success('开始下载')
      } else {
        toast.info('已在新标签页打开图片')
      }
    } catch (error) {
      console.error(`下载 ${format} 格式失败:`, error)
      toast.error('下载失败，请重试')
    } finally {
      setIsDownloading(null)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">导出选项</h3>
      <div className="flex flex-wrap gap-2">
        {imageConfig.formats.map((format) => (
          <Button
            key={format}
            variant="outline"
            onClick={() => handleDownload(format)}
            disabled={isDownloading === format}
          >
            {isDownloading === format && (
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            )}
            下载 {format.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  )
} 