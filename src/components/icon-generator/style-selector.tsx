"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { imageConfig } from "@/config/site"
import { useTranslations } from 'next-intl';

interface StyleSelectorProps {
  value: typeof imageConfig.styles[number]
  onChange: (style: typeof imageConfig.styles[number]) => void
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  const t = useTranslations('StyleSelector.style');

  return (
    <div className="flex flex-wrap gap-2">
      {imageConfig.styles.map((style) => (
        <Button
          key={style}
          variant={value === style ? "default" : "outline"}
          onClick={() => onChange(style)}
          className="capitalize" // Keep capitalize for consistent casing if translations vary
        >
          {t(style)}
        </Button>
      ))}
    </div>
  )
} 