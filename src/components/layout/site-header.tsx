"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { getCustomApiKey, setCustomApiKey, removeCustomApiKey } from "@/lib/storage"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChangeEvent } from "react"
import { Github } from "lucide-react"

import { siteConfig } from "@/config/site"

export function SiteHeader() {
  const [apiKey, setApiKey] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const key = getCustomApiKey()
    if (key) setApiKey(key)
  }, [])

  const handleSave = () => {
    if (apiKey.trim()) {
      setCustomApiKey(apiKey.trim())
    } else {
      removeCustomApiKey()
    }
    setIsOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        <div className="mr-md flex">
          <Link href="/" className="flex items-center space-x-sm">
            <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{siteConfig.name}</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-sm md:justify-end">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>OpenAI API Key</DialogTitle>
                <DialogDescription>
                  设置你的自定义 OpenAI API Key。如果不设置，将使用系统默认的 key。
                </DialogDescription>
                <div className="mt-4 space-y-3">
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <div className="mb-2 font-medium">如何获取 API Key:</div>
                    <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                      <li>访问 <a href="https://github.com/Feiyuyu0503/free-dall-e-proxy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">free-dall-e-proxy</a> 获取免费的 API Key</li>
                    </ul>
                  </div>
                  <div className="text-xs text-muted-foreground">注意：你的 API Key 将安全地存储在本地，不会被发送到任何其他服务器。</div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)} className="mr-2">取消</Button>
                <Button onClick={handleSave}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="mr-1">
              <Github className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">GitHub</span>
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
} 