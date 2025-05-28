"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { imageConfig } from "@/config/site"
import { downloadImage } from "@/lib/download"
import { ReloadIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from 'next-intl';

interface ExportOptionsProps {
  imageUrl: string;
}

export function ExportOptions({ imageUrl }: ExportOptionsProps) {
  const t = useTranslations('ExportOptions');
  const [isDownloading, setIsDownloading] = React.useState<string | null>(null);
  const [shape, setShape] = React.useState<typeof imageConfig.shapes[number]>("square");
  const [background, setBackground] = React.useState<typeof imageConfig.backgrounds[number]>("transparent");

  const handleDownload = async (format: typeof imageConfig.formats[number]) => {
    if (isDownloading) return;

    if (!imageUrl) {
      toast.error(t('toast.noImageToDownload'));
      return;
    }

    setIsDownloading(format);

    try {
      const success = await downloadImage(imageUrl, {
        format,
        shape,
        background,
      });
      if (success) {
        toast.success(t('toast.downloadSuccess', { format: format.toUpperCase() }));
      } else {
        toast.info(t('toast.manualSave'));
      }
    } catch (error) {
      console.error(t('toast.downloadFailedConsole', { format: format.toUpperCase() }), error);

      if (error instanceof Error) {
        if (error.message.includes('图片URL为空') || error.message.toLowerCase().includes('no image to download')) { // Added English check
          toast.error(t('toast.error.noImage'));
        } else if (error.message.includes('无效的图片URL格式') || error.message.includes('不支持的URL类型') || error.message.toLowerCase().includes('invalid image url')) { // Added English check
          toast.error(t('toast.error.invalidUrl'));
        } else if (error.message.includes('timeout')) {
          toast.error(t('toast.error.timeout'));
        } else {
          toast.error(t('toast.error.generic'));
        }
      } else {
        toast.error(t('toast.error.generic'));
      }
    } finally {
      setIsDownloading(null);
    }
  };

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
              {t('infoBox')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">{t('shapeLabel')}</label>
          <Select value={shape} onValueChange={(value: typeof imageConfig.shapes[number]) => setShape(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t(`shape.${shape}`)} />
            </SelectTrigger>
            <SelectContent>
              {imageConfig.shapes.map((s) => (
                <SelectItem key={s} value={s}>{t(`shape.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">{t('backgroundLabel')}</label>
          <Select value={background} onValueChange={(value: typeof imageConfig.backgrounds[number]) => setBackground(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t(`background.${background}`)} />
            </SelectTrigger>
            <SelectContent>
              {imageConfig.backgrounds.map((b) => (
                <SelectItem key={b} value={b}>{t(`background.${b}`)}</SelectItem>
              ))}
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
            {t('downloadButtonText', { format: format.toUpperCase() })}
          </Button>
        ))}
      </div>
    </div>
  );
} 