"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends React.ComponentProps<typeof Image> {
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

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = (error: Error) => {
    setIsLoading(false)
    setError(error)
  }

  if (error && fallback) {
    return <>{fallback}</>
  }

  return (
    <div className={cn("relative", className)}>
      <Image
        src={src}
        alt={alt}
        {...props}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        onError={() => handleError(new Error("Failed to load image"))}
        loading="lazy"
        quality={90}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
} 