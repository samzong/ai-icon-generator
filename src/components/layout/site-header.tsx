"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ApiConfigDialog } from "@/components/api-config"
import { Github } from "lucide-react"
import { siteConfig } from "@/config/site"
import { useTranslations } from 'next-intl'

export function SiteHeader() {
  const t = useTranslations('siteHeader')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        
        <div className="mr-md flex">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo64.png"
              alt={siteConfig.name}
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{siteConfig.name}</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-sm md:justify-end">
          <ApiConfigDialog />
          <Link href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="mr-1">
              <Github className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">{t('github')}</span>
            </Button>
          </Link>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
