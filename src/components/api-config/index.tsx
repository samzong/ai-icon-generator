"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Settings } from "lucide-react";
import {
  getApiConfig,
  setApiConfig,
  type ApiConfig,
  type ApiProvider,
  type ApiProviderConfig,
} from "@/lib/storage";
import { PROVIDER_INFO, validateApiConfig, type ValidationError } from "@/lib/api-providers";

export function ApiConfigDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<ApiConfig | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    const currentConfig = getApiConfig();
    setConfig(currentConfig);
    setSavedConfig(currentConfig);
  }, []);

  const handleSave = () => {
    if (!config) return;

    const errors = validateApiConfig(config);
    setValidationErrors(errors);

    if (errors.length === 0) {
      setApiConfig(config);
      setSavedConfig(config);
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && savedConfig) {
      setConfig(savedConfig);
      setValidationErrors([]);
    }
  };

  const handleCancel = () => {
    if (savedConfig) {
      setConfig(savedConfig);
      setValidationErrors([]);
    }
    setIsOpen(false);
  };

  const handleProviderChange = (provider: ApiProvider) => {
    if (config) {
      setConfig({
        ...config,
        selectedProvider: provider,
      });
      setValidationErrors([]);
    }
  };

  const handleProviderConfigChange = (
    provider: ApiProvider,
    field: keyof ApiProviderConfig,
    value: string
  ) => {
    if (config) {
      setConfig({
        ...config,
        providers: {
          ...config.providers,
          [provider]: {
            ...config.providers[provider],
            [field]: value,
          },
        },
      });
      
      // Clear field-specific errors
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  if (!config) return null;

  const selectedProvider = config.selectedProvider;
  const selectedProviderConfig = config.providers[selectedProvider];
  const selectedProviderInfo = PROVIDER_INFO[selectedProvider];
  const errorsByField = validationErrors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {} as Record<string, string>);

  // Get current provider display name for button - use saved config, not editing config
  const currentProviderName = savedConfig ? PROVIDER_INFO[savedConfig.selectedProvider]?.name || "API 配置" : "API 配置";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">API 配置</span>
          <span className="text-xs text-muted-foreground">({currentProviderName})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API 配置</DialogTitle>
          <DialogDescription>配置你的 AI 图标生成服务提供商</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>服务提供商</Label>
            <Select
              value={config.selectedProvider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{info.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {info.description}
                        </div>
                      </div>
                      {key === "default" ? (
                        <Badge variant="default" className="text-xs ml-2">
                          默认
                        </Badge>
                      ) : (
                        config.providers[key as ApiProvider].apiKey && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            已配置
                          </Badge>
                        )
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Provider Configuration */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{selectedProviderInfo.name}</h3>
              {!selectedProviderInfo.isDefault && (
                <a
                  href={selectedProviderInfo.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center"
                >
                  获取 API Key
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>

            {/* Default Service Info */}
            {selectedProvider === "default" && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <div className="font-medium mb-2">默认服务说明</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>使用系统预配置的 API 服务</li>
                  <li>无需配置 API Key，开箱即用</li>
                  <li>适合快速体验和测试使用</li>
                </ul>
              </div>
            )}

            {/* Custom Provider Configuration */}
            {selectedProvider !== "default" && (
              <>
                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="api-key">
                    API Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={selectedProviderConfig.apiKey}
                    onChange={(e) =>
                      handleProviderConfigChange(
                        selectedProvider,
                        "apiKey",
                        e.target.value
                      )
                    }
                    placeholder="sk-..."
                    className={errorsByField.apiKey ? "border-red-500" : ""}
                  />
                  {errorsByField.apiKey && (
                    <p className="text-xs text-red-500">{errorsByField.apiKey}</p>
                  )}
                </div>

                {/* Base URL - only show if editable */}
                {selectedProviderInfo.baseUrlEditable && (
                  <div className="space-y-2">
                    <Label htmlFor="base-url">
                      Base URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="base-url"
                      value={selectedProviderConfig.baseUrl || ""}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          selectedProvider,
                          "baseUrl",
                          e.target.value
                        )
                      }
                      placeholder="https://api.example.com/v1"
                      className={errorsByField.baseUrl ? "border-red-500" : ""}
                    />
                    {errorsByField.baseUrl && (
                      <p className="text-xs text-red-500">{errorsByField.baseUrl}</p>
                    )}
                  </div>
                )}

                {/* Base URL - show for console-d-run but disabled */}
                {selectedProvider === "console-d-run" && (
                  <div className="space-y-2">
                    <Label htmlFor="base-url">Base URL</Label>
                    <Input
                      id="base-url"
                      value={selectedProviderConfig.baseUrl || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}

                {/* Model - only show if editable */}
                {selectedProviderInfo.modelEditable && (
                  <div className="space-y-2">
                    <Label htmlFor="model">模型</Label>
                    <Input
                      id="model"
                      value={selectedProviderConfig.model || ""}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          selectedProvider,
                          "model",
                          e.target.value
                        )
                      }
                      placeholder={selectedProviderInfo.defaultModel}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Validation Error Summary */}
          {validationErrors.length > 0 && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
              <span className="font-medium">请完善以下必填信息：</span>
              <ul className="list-disc list-inside mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Notice */}
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <span className="font-medium">安全提示：</span>
            API Key 仅存储在本地浏览器，不会发送到其他服务器
          </div>

          {/* API Call Flow Explanation */}
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded">
            <div className="font-medium mb-2">🔄 API 调用流程说明</div>
            {selectedProvider === "default" ? (
              <div className="space-y-1">
                <div>• 浏览器 → 本地API(/api/generate) → 系统默认服务</div>
                <div>• 使用服务器端配置的API密钥</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div>• 浏览器 → 本地API(/api/generate) → {selectedProviderInfo.name}</div>
                <div>• 你的API密钥在服务器端调用，保证安全性</div>
                <div>• 浏览器网络面板只会显示对本地API的请求</div>
                <div>• 实际的第三方API调用在服务器端完成</div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave}>保存配置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
