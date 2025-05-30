"use client"

import { Badge } from "@/components/ui/badge"
import { Shield, Server } from "lucide-react"
import { getApiConfig, type ApiConfig } from "@/lib/storage"
import { shouldUseClientSideCall } from "@/lib/icon-generation-core"
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

export function ConfigIndicator() {
  const t = useTranslations('apiConfig')
  const [config, setConfig] = useState<ApiConfig | null>(null)
  const [isClientSide, setIsClientSide] = useState(false)

  useEffect(() => {
    const currentConfig = getApiConfig()
    setConfig(currentConfig)
    setIsClientSide(shouldUseClientSideCall())
  }, [])

  // Keep the functionality but don't render anything
  return null
} 