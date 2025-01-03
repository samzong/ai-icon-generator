"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { imageConfig } from "@/config/site"
import { downloadImage } from "@/lib/download"
import { ReloadIcon } from "@radix-ui/react-icons"

interface ExportOptionsProps {
  imageUrl: string
}

export function ExportOptions({ imageUrl }: ExportOptionsProps) {
  const [isDownloading, setIsDownloading] = React.useState<string | null>(null)

  const handleDownload = async (format: typeof imageConfig.formats[number]) => {
    if (isDownloading) return
    setIsDownloading(format)

    try {
      await downloadImage(imageUrl, format)
    } catch (error) {
      console.error(`Error downloading ${format}:`, error)
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