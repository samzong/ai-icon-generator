export const promptSuggestions = [
  {
    category: "科技",
    suggestions: [
      "简约的云计算图标",
      "现代风格的数据库图标",
      "科技感的芯片图标",
      "网络连接图标",
      "智能设备图标",
    ],
  },
  {
    category: "自然",
    suggestions: [
      "优雅的树叶图标",
      "简约的山峰图标",
      "水滴图标",
      "太阳图标",
      "月亮图标",
    ],
  },
  {
    category: "商务",
    suggestions: [
      "专业的图表图标",
      "简洁的文档图标",
      "商务手提包图标",
      "团队协作图标",
      "时钟图标",
    ],
  },
  {
    category: "社交",
    suggestions: [
      "对话气泡图标",
      "用户头像图标",
      "点赞图标",
      "分享图标",
      "评论图标",
    ],
  },
]

export function getRandomSuggestion(): string {
  const randomCategory = promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)]
  const randomSuggestion = randomCategory.suggestions[Math.floor(Math.random() * randomCategory.suggestions.length)]
  return randomSuggestion
} 