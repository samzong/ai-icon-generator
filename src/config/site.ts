export const siteConfig = {
  name: "AI Icon Generator",
  description: "使用 AI 生成专业的图标设计",
  url: process.env.NEXT_PUBLIC_APP_URL,
  ogImage: "https://ui.shadcn.com/og.jpg",
  links: {
    github: "https://github.com/samzong/nextjs-demo",
  },
}

export type SiteConfig = typeof siteConfig

export const imageConfig = {
  defaultSize: parseInt(process.env.DEFAULT_IMAGE_SIZE || "512"),
  maxSize: parseInt(process.env.MAX_IMAGE_SIZE || "1024"),
  formats: ["png", "svg", "ico"] as const,
  styles: ["flat", "line", "solid", "gradient"] as const,
}

export type ImageConfig = typeof imageConfig 