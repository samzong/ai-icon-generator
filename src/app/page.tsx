import { IconGenerator } from "@/components/icon-generator"

export default function Home() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-[800px] space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">AI 图标生成器</h1>
          <p className="text-muted-foreground">
            使用 AI 生成专业的图标设计，支持多种风格和格式
          </p>
        </div>
        <IconGenerator />
      </div>
    </div>
  )
}
