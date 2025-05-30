"use client"

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useState } from 'react'

const languages = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'zh-CN',
    name: '简体中文',
    flag: '🇨🇳'
  }
] as const

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('siteHeader')
  const [isOpen, setIsOpen] = useState(false)

  // Backup locale detection from pathname
  const getLocaleFromPathname = (path: string): string => {
    const segments = path.split('/').filter(Boolean) // Remove empty segments
    const firstSegment = segments[0]
    return ['zh-CN'].includes(firstSegment) ? firstSegment : 'en'
  }

  // Use backup detection if useLocale seems incorrect
  const currentLocale = getLocaleFromPathname(pathname)

  const handleLanguageChange = (newLocale: string) => {
    // Close dropdown immediately
    setIsOpen(false)
    
    // Don't switch if already on the same locale
    if (newLocale === currentLocale) {
      return
    }
    
    // Remove current locale from pathname if it exists
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/'
    
    // Add new locale prefix if it's not the default locale
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`
    
    // Use router.replace for immediate navigation
    router.replace(newPath)
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        aria-label={t('switchLanguage')}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="h-[1.2rem] w-[1.2rem]" />
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] bg-background border border-border rounded-md shadow-lg">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-start ${
                  language.code === currentLocale 
                    ? 'bg-accent text-accent-foreground' 
                    : ''
                }`}
              >
                <span className="mr-2">{language.flag}</span>
                <span className="flex-1 text-left">{language.name}</span>
                {language.code === currentLocale && (
                  <span className="ml-2 text-xs opacity-60">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
} 