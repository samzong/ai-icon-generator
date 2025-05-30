"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { imageConfig } from "@/config/site"
import { downloadImage } from "@/lib/download"
import { ReloadIcon, InfoCircledIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('exportOptions')
  const [isDownloading, setIsDownloading] = React.useState<string | null>(null)
  const [shape, setShape] = React.useState<typeof imageConfig.shapes[number]>("square")
  const [background, setBackground] = React.useState<typeof imageConfig.backgrounds[number]>("transparent")

  const handleDownload = async (format: typeof imageConfig.formats[number]) => {
    if (isDownloading) return
    
    if (!imageUrl) {
      toast.error(t('messages.noImages'))
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
        toast.success(t('messages.downloadSuccess', { format: format.toUpperCase() }))
      } else {
        toast.info(t('messages.openedInNewTab'))
      }
    } catch (error) {
      console.error(`Failed to download ${format} format:`, error)
      
      // Simplified error handling
      if (error instanceof Error) {
        if (error.message.includes('图片URL为空') || error.message.includes('empty')) {
          toast.error(t('messages.noImageGenerated'))
        } else if (error.message.includes('无效的图片URL格式') || error.message.includes('不支持的URL类型') || error.message.includes('invalid') || error.message.includes('unsupported')) {
          toast.error(t('messages.invalidImageUrl'))
        } else if (error.message.includes('timeout')) {
          toast.error(t('messages.requestTimeout'))
        } else {
          toast.error(t('messages.downloadFailed'))
        }
      } else {
        toast.error(t('messages.downloadFailed'))
      }
    } finally {
      setIsDownloading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="font-medium">{t('title')}</h3>
      </div>
      
      <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <InfoCircledIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('notice')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">{t('shape')}</label>
          <Select value={shape} onValueChange={(value: typeof imageConfig.shapes[number]) => setShape(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="square">{t('shapes.square')}</SelectItem>
              <SelectItem value="rounded">{t('shapes.rounded')}</SelectItem>
              <SelectItem value="circle">{t('shapes.circle')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">{t('background')}</label>
          <Select value={background} onValueChange={(value: typeof imageConfig.backgrounds[number]) => setBackground(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">{t('backgrounds.transparent')}</SelectItem>
              <SelectItem value="white">{t('backgrounds.white')}</SelectItem>
              <SelectItem value="black">{t('backgrounds.black')}</SelectItem>
              <SelectItem value="auto">{t('backgrounds.auto')}</SelectItem>
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
            {t('downloadFormat', { format: format.toUpperCase() })}
          </Button>
        ))}
      </div>
    </div>
  )
} 