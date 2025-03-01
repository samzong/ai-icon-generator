"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ReloadIcon, LightningBoltIcon } from "@radix-ui/react-icons"
import { promptSuggestions, getRandomSuggestion } from "@/lib/suggestions"

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
  isGenerating: boolean
  isDisabled?: boolean
}

export function PromptInput({
  value,
  onChange,
  onGenerate,
  isGenerating,
  isDisabled = false,
}: PromptInputProps) {
  const handleSuggestion = () => {
    onChange(getRandomSuggestion())
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">描述你的图标</label>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleSuggestion}
        >
          <LightningBoltIcon className="mr-2 h-4 w-4" />
          获取建议
        </Button>
      </div>
      <Textarea
        placeholder="描述你想要的图标，例如：一个简约的蓝色云朵图标..."
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex flex-wrap gap-2">
        {promptSuggestions.map((category) => (
          <div key={category.category} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {category.category}
            </span>
            <div className="flex flex-wrap gap-1">
              {category.suggestions.slice(0, 2).map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(suggestion)}
                  className="h-7 text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          onClick={onGenerate}
          disabled={!value || isGenerating || isDisabled}
        >
          {isGenerating && (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
          生成图标
        </Button>
      </div>
    </div>
  )
} 