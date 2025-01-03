import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateIcon(prompt: string, style: string) {
  try {
    const enhancedPrompt = `Create a professional icon with ${style} style. ${prompt}. Make it simple, memorable, and suitable as an app icon or logo. Use appropriate colors and ensure it's visually balanced.`

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    })

    return response.data[0].url
  } catch (error) {
    console.error("Error generating icon:", error)
    throw error
  }
} 