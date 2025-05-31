"use client"

import { useEffect, useState } from 'react'
import { getApiConfig, type ApiConfig } from "@/lib/storage"
import { shouldUseClientSideCall } from "@/lib/icon-generation-core"

export function ConfigIndicator() {
  const [, setConfig] = useState<ApiConfig | null>(null)
  const [, setIsClientSide] = useState(false)

  useEffect(() => {
    const currentConfig = getApiConfig()
    setConfig(currentConfig)
    setIsClientSide(shouldUseClientSideCall())
  }, [])

  // Keep the functionality but don't render anything
  return null
} 