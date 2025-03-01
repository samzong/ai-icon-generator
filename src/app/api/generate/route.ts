import { NextResponse } from "next/server"
import { generateIcon } from "@/lib/openai"
import { imageConfig } from "@/config/site"

export const runtime = "edge"

// 添加 HEAD 请求处理，用于获取速率限制信息
export async function HEAD() {
  // 只返回头信息，不返回内容
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: Request) {
  try {
    const { prompt, style } = await request.json()

    if (!prompt) {
      return new NextResponse("Missing prompt", { status: 400 })
    }

    if (!style || !imageConfig.styles.includes(style)) {
      return new NextResponse("Invalid style", { status: 400 })
    }

    const imageUrl = await generateIcon(prompt, style)

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error("Error in generate route:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 