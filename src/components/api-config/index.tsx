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
import { ExternalLink, Settings, Shield, CheckCircle2 } from "lucide-react";
import {
  getApiConfig,
  setApiConfig,
  type ApiConfig,
  type ApiProvider,
  type ApiProviderConfig,
} from "@/lib/storage";
import { getProviderInfo, validateApiConfig, type ValidationError } from "@/lib/api-providers";
import { eventManager, EVENTS } from "@/lib/events";
import { useTranslations } from 'next-intl';

export function ApiConfigDialog() {
  const t = useTranslations('apiConfig');
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<ApiConfig | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Get translated provider info
  const PROVIDER_INFO_TRANSLATED = getProviderInfo((key: string) => t(key));

  useEffect(() => {
    const currentConfig = getApiConfig();
    setConfig(currentConfig);
    setSavedConfig(currentConfig);
  }, []);

  const handleSave = () => {
    if (!config) return;

    const errors = validateApiConfig(config, (key: string) => t(key));
    setValidationErrors(errors);

    if (errors.length === 0) {
      setApiConfig(config);
      setSavedConfig(config);
      setIsOpen(false);
      
      // Trigger history update event to refresh history panel
      eventManager.emit(EVENTS.HISTORY_UPDATE);
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
  const selectedProviderInfo = PROVIDER_INFO_TRANSLATED[selectedProvider];
  const errorsByField = validationErrors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {} as Record<string, string>);

  // Get current provider display name for button - use saved config, not editing config
  const currentProviderName = savedConfig ? PROVIDER_INFO_TRANSLATED[savedConfig.selectedProvider]?.name || 'API Key' : 'API Key';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="text-xs text-muted-foreground">({currentProviderName})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Security Notice */}
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50 p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  {t('security.title')}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  {t('security.description')}
                </div>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>{t('provider')}</Label>
            <Select
              value={config.selectedProvider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger>
                <SelectValue>
                  {config.selectedProvider && (() => {
                    const selectedInfo = PROVIDER_INFO_TRANSLATED[config.selectedProvider];
                    const selectedKey = config.selectedProvider;
                    return (
                      <div className="flex items-center gap-2">
                        <span>{selectedInfo.name}</span>
                        {selectedKey === "default" ? (
                          <Badge variant="default" className="text-xs">
                            {t('badges.default')}
                          </Badge>
                        ) : (
                          config.providers[selectedKey as ApiProvider].apiKey && (
                            <Badge variant="secondary" className="text-xs">
                              {t('badges.configured')}
                            </Badge>
                          )
                        )}
                      </div>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_INFO_TRANSLATED).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{info.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {info.description}
                        </div>
                      </div>
                      {key === "default" ? (
                        <Badge variant="default" className="text-xs ml-2 shrink-0">
                          {t('badges.default')}
                        </Badge>
                      ) : (
                        config.providers[key as ApiProvider].apiKey && (
                          <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                            {t('badges.configured')}
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
                  {t('getApiKey')}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>

            {/* Default Service Info */}
            {selectedProvider === "default" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {(t.raw('defaultService.features') as string[]).map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Provider Configuration */}
            {selectedProvider !== "default" && (
              <>
                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="api-key">
                    {t('apiKey')} <span className="text-red-500">{t('required')}</span>
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
                      {t('baseUrl')} <span className="text-red-500">{t('required')}</span>
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
                    <Label htmlFor="base-url">{t('baseUrl')}</Label>
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
                    <Label htmlFor="model">{t('model')}</Label>
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
              <span className="font-medium">{t('validation.title')}</span>
              <ul className="list-disc list-inside mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
