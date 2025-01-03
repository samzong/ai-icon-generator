# AI Icon Generator 智能图标生成器

基于人工智能的图标生成工具，只需输入文本描述，即可生成专业的图标设计。

## ✨ 特性

- 🤖 基于 AI 模型生成原创图标
- 🎨 支持多种风格（扁平化、拟物化、线性等）
- 📏 自动生成多种尺寸规格
- 🔄 支持风格迁移和图标优化
- 📦 支持批量导出 (PNG, SVG, ICO)
- 🌈 支持颜色主题定制

## 🚀 快速开始

```bash
# 安装
npm install ai-icon-generator

# 使用
npx ai-icon-generator
```

## 💡 使用示例

```javascript
const { generateIcon } = require('ai-icon-generator');

// 通过文本描述生成图标
await generateIcon({
  prompt: "一个简约的购物袋图标，使用蓝色线条风格",
  style: "line",
  size: 256,
  format: "svg"
});

// 批量生成不同风格
await generateIcon({
  prompt: "一个云存储的图标",
  styles: ["flat", "line", "solid"],
  sizes: [64, 128, 256],
  formats: ["png", "svg"]
});
```

## 📝 提示词指南

查看 [PROMPT.md](PROMPT.md) 获取详细的提示词编写指南，以获得最佳生成效果。

## ⚙️ 配置选项

| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| prompt | string | 图标描述文本 | - |
| style | string | 图标风格 | "flat" |
| size | number | 输出尺寸 | 256 |
| format | string | 输出格式 | "png" |
| color | string | 主色调 | "#000000" |
| variations | number | 生成变体数量 | 1 |

## 🎨 支持的风格

- flat: 扁平化风格
- line: 线性图标
- solid: 实心图标
- gradient: 渐变风格
- isometric: 等距风格
- hand-drawn: 手绘风格
- pixel: 像素风格

## 🛠️ 开发

```bash
# 克隆项目
git clone https://github.com/yourusername/ai-icon-generator.git

# 安装依赖
npm install

# 运行开发环境
npm run dev

# 构建项目
npm run build
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
