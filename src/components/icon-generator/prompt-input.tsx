"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ReloadIcon, LightningBoltIcon } from "@radix-ui/react-icons"
import { promptSuggestions, getRandomSuggestion } from "@/lib/suggestions"
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('PromptInput');
  const tSuggestions = useTranslations('PromptSuggestions');

  const handleSuggestion = () => {
    // Note: getRandomSuggestion() will still return the original language suggestion.
    // Translating these dynamic suggestions would require a more complex setup.
    // For now, we'll accept that the random suggestion might not be in the current language.
    onChange(getRandomSuggestion());
  };

  // Helper to translate category names. Assumes original category names are simple keys.
  const translateCategory = (categoryKey: string) => {
    // Simplistic mapping; ideally, keys should be more robust (e.g., "Tech" -> "categoryTech")
    // For this example, I'll assume the keys in suggestions.ts are like "Tech", "Nature", etc.
    // And in the JSON, we'll have "Tech": "科技", "Nature": "自然" under PromptSuggestions.category
    try {
      return tSuggestions(`category.${categoryKey}`) || categoryKey;
    } catch (e) {
      // Fallback if translation is not found
      return categoryKey;
    }
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{t('label')}</label>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleSuggestion}
        >
          <LightningBoltIcon className="mr-2 h-4 w-4" />
          {t('suggestionButton')}
        </Button>
      </div>
      <Textarea
        placeholder={t('placeholder')}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex flex-wrap gap-2">
        {promptSuggestions.map((category) => (
          <div key={category.category} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {translateCategory(category.category)}
            </span>
            <div className="flex flex-wrap gap-1">
              {category.suggestions.slice(0, 2).map((suggestion) => (
                // Individual suggestions are not translated for now due to complexity
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
          {t('generateButton')}
        </Button>
      </div>
    </div>
  )
} 