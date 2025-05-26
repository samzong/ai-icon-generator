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

export function validateApiConfig(config: ApiConfig): ValidationError[] {
  const errors: ValidationError[] = []
  const selectedProvider = config.selectedProvider
  const selectedProviderConfig = config.providers[selectedProvider]
  const providerInfo = PROVIDER_INFO[selectedProvider]

  // Default service doesn't need validation
  if (selectedProvider === "default") {
    return errors
  }

  // Validate API Key
  if (!selectedProviderConfig.apiKey.trim()) {
    errors.push({ field: 'apiKey', message: 'API Key 不能为空' })
  }

  // Validate Base URL (if editable)
  if (providerInfo.baseUrlEditable && !selectedProviderConfig.baseUrl?.trim()) {
    errors.push({ field: 'baseUrl', message: 'Base URL 不能为空' })
  }

  return errors
} 