# AI Icon Generator

基于 OpenAI DALL-E 3 的专业图标生成工具。

## 特性

- 🎨 使用 DALL-E 3 生成高质量图标
- 🎯 支持多种图标风格
- 💾 支持多种导出格式
- 🌓 支持深色/浅色主题
- 📱 响应式设计
- ⚡️ 快速生成和预览

## 技术栈

- Node.js >= 20.0.0
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- OpenAI API

## 系统要求

- Node.js 20.0.0 或更高版本
- npm 10.0.0 或更高版本（推荐）

## 开始使用

1. 确保您的 Node.js 版本符合要求
```bash
node --version  # 应该显示 v20.0.0 或更高版本
```

2. 克隆项目
```bash
git clone https://github.com/yourusername/ai-icon-generator.git
cd ai-icon-generator
```

3. 安装依赖
```bash
npm install
```

4. 配置环境变量
```bash
cp .env.example .env
```
然后编辑 `.env` 文件，添加必要的配置：
- OPENAI_API_KEY：您的 OpenAI API 密钥
- OPENAI_API_BASE_URL：API 端点（可选）

5. 启动开发服务器
```bash
npm run dev
```

6. 构建生产版本
```bash
npm run build
```

## 使用方法

1. 输入图标描述
2. 选择图标风格
3. 点击生成按钮
4. 等待生成完成
5. 下载所需格式

## 许可证

MIT License
