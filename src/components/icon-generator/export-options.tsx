"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { imageConfig } from "@/config/site"
import { downloadImage } from "@/lib/download"
import { ReloadIcon, InfoCircledIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ExportOptionsProps {
  imageUrl: string
}

export function ExportOptions({ imageUrl }: ExportOptionsProps) {
  const [isDownloading, setIsDownloading] = React.useState<string | null>(null)
  const [shape, setShape] = React.useState<typeof imageConfig.shapes[number]>("square")
  const [background, setBackground] = React.useState<typeof imageConfig.backgrounds[number]>("transparent")

  const handleDownload = async (format: typeof imageConfig.formats[number]) => {
    if (isDownloading) return
    
    if (!imageUrl) {
      toast.error('No images to download')
      return
    }

    setIsDownloading(format)

    try {
      const success = await downloadImage(imageUrl, {
        format,
        shape,
        background,
      })
      if (success) {
        toast.success(`${format.toUpperCase()} 格式下载成功`)
      } else {
        toast.info('已在新标签页打开图片，请手动保存')
      }
    } catch (error) {
      console.error(`下载 ${format} 格式失败:`, error)
      
      // Simplified error handling
      if (error instanceof Error) {
        if (error.message.includes('图片URL为空')) {
          toast.error('没有可下载的图片，请先生成图片')
        } else if (error.message.includes('无效的图片URL格式') || error.message.includes('不支持的URL类型')) {
          toast.error('图片链接格式无效，请重新生成图片')
        } else if (error.message.includes('timeout')) {
          toast.error('请求超时，请重试')
        } else {
          toast.error('下载失败，请重试')
        }
      } else {
        toast.error('下载失败，请重试')
      }
    } finally {
      setIsDownloading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="font-medium">导出选项</h3>
      </div>
      
      <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <InfoCircledIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              不同平台生成的图片保留时间不一致，请尽快下载保存到本地。过期的图片链接将无法访问。
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">形状</label>
          <Select value={shape} onValueChange={(value: typeof imageConfig.shapes[number]) => setShape(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="square">正方形</SelectItem>
              <SelectItem value="rounded">圆角</SelectItem>
              <SelectItem value="circle">圆形</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">背景</label>
          <Select value={background} onValueChange={(value: typeof imageConfig.backgrounds[number]) => setBackground(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">透明</SelectItem>
              <SelectItem value="white">白色</SelectItem>
              <SelectItem value="black">黑色</SelectItem>
              <SelectItem value="auto">自动</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
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