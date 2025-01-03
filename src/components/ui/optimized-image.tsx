"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)
  const maxRetries = 3

  const handleLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleError = () => {
    setIsLoading(false)
    setError(new Error("Failed to load image"))
    
    // 自动重试加载
    if (retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        setIsLoading(true)
        setError(null)
      }, 1000 * (retryCount + 1)) // 递增重试间隔
      
      return () => clearTimeout(timer)
    }
  }

  // 重置状态当 src 改变时
  React.useEffect(() => {
    setIsLoading(true)
    setError(null)
    setRetryCount(0)
  }, [src])

  if (error && retryCount >= maxRetries && fallback) {
    return <>{fallback}</>
  }

  return (
    <div className={cn("relative", className)}>
      {src && (
        <img
          src={src}
          alt={alt || ""}
          className={cn(
            "h-full w-full transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            props.className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            {retryCount > 0 && (
              <span className="text-xs text-muted-foreground">
                重试中... ({retryCount}/{maxRetries})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 