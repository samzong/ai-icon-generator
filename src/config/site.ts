export const siteConfig = {
  name: "AI Icon Generator",
  description: "使用 AI 生成专业的图标设计",
  url: process.env.NEXT_PUBLIC_APP_URL,
  ogImage: "https://ui.shadcn.com/og.jpg",
  links: {
    github: "https://github.com/samzong/ai-icon-generator",
  },
}

export type SiteConfig = typeof siteConfig

export const imageConfig = {
  defaultSize: parseInt(process.env.DEFAULT_IMAGE_SIZE || "512"),
  maxSize: parseInt(process.env.MAX_IMAGE_SIZE || "1024"),
  formats: ["png", "ico", "icns", "jpeg"] as const,
  styles: ["flat", "line", "solid", "gradient", "windows", "fluent"] as const,
  shapes: ["square", "rounded", "circle"] as const,
  backgrounds: ["transparent", "white", "black", "auto"] as const,
}

export type ImageConfig = typeof imageConfig 

export interface ExportOptions {
  format: typeof imageConfig.formats[number]
  shape: typeof imageConfig.shapes[number]
  background: typeof imageConfig.backgrounds[number]
} 