import type { ApiProvider, ApiConfig } from './storage'

export interface ProviderInfo {
  name: string
  description: string
  baseUrlEditable: boolean
  modelEditable: boolean
  helpUrl: string
  defaultModel: string
  isDefault: boolean
}

// Static provider configuration (non-translatable parts)
export const PROVIDER_CONFIG: Record<ApiProvider, Omit<ProviderInfo, 'name' | 'description'>> = {
  default: {
    baseUrlEditable: false,
    modelEditable: false,
    helpUrl: "",
    defaultModel: "",
    isDefault: true,
  },
  openai: {
    baseUrlEditable: true,
    modelEditable: true,
    helpUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-image-1",
    isDefault: false,
  },
  "free-dall-e-proxy": {
    baseUrlEditable: false,
    modelEditable: false,
    helpUrl: "https://github.com/Feiyuyu0503/free-dall-e-proxy",
    defaultModel: "gpt-image-1",
    isDefault: false,
  },
  "console-d-run": {
    baseUrlEditable: false,
    modelEditable: true,
    helpUrl: "https://console.d.run/hydra/management/api-key-manage/list",
    defaultModel: "public/hidream-i1-dev",
    isDefault: false,
  },
} as const

// Function to get provider info with translations
export function getProviderInfo(t: (key: string) => string): Record<ApiProvider, ProviderInfo> {
  return Object.entries(PROVIDER_CONFIG).reduce((acc, [key, config]) => {
    const provider = key as ApiProvider
    acc[provider] = {
      ...config,
      name: t(`providers.${provider}.name`),
      description: t(`providers.${provider}.description`),
    }
    return acc
  }, {} as Record<ApiProvider, ProviderInfo>)
}

// Legacy export for backward compatibility (contains Chinese text for existing code)
export const PROVIDER_INFO: Record<ApiProvider, ProviderInfo> = {
  default: {
    name: "默认服务",
    description: "使用系统默认配置",
    baseUrlEditable: false,
    modelEditable: false,
    helpUrl: "",
    defaultModel: "",
    isDefault: true,
  },
  openai: {
    name: "OpenAI",
    description: "官方 OpenAI API",
    baseUrlEditable: true,
    modelEditable: true,
    helpUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-image-1",
    isDefault: false,
  },
  "free-dall-e-proxy": {
    name: "Free DALL-E Proxy",
    description: "免费代理服务",
    baseUrlEditable: false,
    modelEditable: false,
    helpUrl: "https://github.com/Feiyuyu0503/free-dall-e-proxy",
    defaultModel: "gpt-image-1",
    isDefault: false,
  },
  "console-d-run": {
    name: "console.d.run",
    description: "d.run 大模型服务平台",
    baseUrlEditable: false,
    modelEditable: true,
    helpUrl: "https://console.d.run/hydra/management/api-key-manage/list",
    defaultModel: "public/hidream-i1-dev",
    isDefault: false,
  },
} as const

export interface ValidationError {
  field: string
  message: string
}

export function validateApiConfig(config: ApiConfig, t: (key: string) => string): ValidationError[] {
  const errors: ValidationError[] = []
  const selectedProvider = config.selectedProvider
  const selectedProviderConfig = config.providers[selectedProvider]
  const providerConfig = PROVIDER_CONFIG[selectedProvider]

  // Default service doesn't need validation
  if (selectedProvider === "default") {
    return errors
  }

  // Validate API Key
  if (!selectedProviderConfig.apiKey.trim()) {
    errors.push({ field: 'apiKey', message: t('validation.apiKeyRequired') })
  }

  // Validate Base URL (if editable)
  if (providerConfig.baseUrlEditable && !selectedProviderConfig.baseUrl?.trim()) {
    errors.push({ field: 'baseUrl', message: t('validation.baseUrlRequired') })
  }

  return errors
} 