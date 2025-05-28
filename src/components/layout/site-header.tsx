"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ApiConfigDialog } from "@/components/api-config"
import { LanguageSwitcher } from "@/components/layout/language-switcher"; // Added import
import { Github } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useTranslations } from 'next-intl'; // Added import

export function SiteHeader() {
  const t = useTranslations('Header'); // Added useTranslations

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        <div className="mr-md flex">
          <Link href="/" className="flex items-center space-x-sm">
            {/* Using Header.title for site name as it's already in messages.json */}
            <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{t('title')}</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-sm md:justify-end">
          <LanguageSwitcher /> {/* Added LanguageSwitcher */}
          <ApiConfigDialog />
          <Link href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="mr-1">
              <Github className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">{t('githubAlt')}</span>
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
} 