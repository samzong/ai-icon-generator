import { useTranslations } from 'next-intl'

export const suggestionCategories = ['technology', 'nature', 'business', 'social'] as const

export function usePromptSuggestions() {
  const t = useTranslations('promptInput')
  
  return suggestionCategories.map(category => ({
    category: t(`categories.${category}`),
    categoryKey: category,
    suggestions: t.raw(`suggestions.${category}`) as string[]
  }))
}

export function useRandomSuggestion() {
  const t = useTranslations('promptInput')
  
  return () => {
    const randomCategory = suggestionCategories[Math.floor(Math.random() * suggestionCategories.length)]
    const suggestions = t.raw(`suggestions.${randomCategory}`) as string[]
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    return randomSuggestion
  }
} 