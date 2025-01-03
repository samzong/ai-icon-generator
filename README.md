# AI Icon Generator

基于 OpenAI DALL-E 3 的专业图标生成工具。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsamzong%2Fai-icon-generator&env=OPENAI_API_KEY,OPENAI_API_BASE_URL,NODE_VERSION&envDescription=API%20密钥和端点配置&envLink=https%3A%2F%2Fgithub.com%2Fsamzong%2Fai-icon-generator%23%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F&project-name=ai-icon-generator&repository-name=ai-icon-generator&demo-title=AI%20Icon%20Generator&demo-description=基于%20OpenAI%20DALL-E%203%20的专业图标生成工具&demo-url=https%3A%2F%2Fai-icon-generator.vercel.app&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2Fsamzong%2Fai-icon-generator%2Fmain%2Fpublic%2Fdemo.png)

[在线预览](https://ai-icon-generator.vercel.app)

## 特性

- 🎨 使用 DALL-E 3 生成高质量图标
- 🎯 支持多种图标风格
- 💾 支持多种导出格式
- 🌓 支持深色/浅色主题
- 📱 响应式设计
- ⚡️ 快速生成和预览
- 🔄 支持自定义 API 端点
- 🚀 一键部署到 Vercel

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
- NODE_VERSION：v20.11.0（确保 Node.js 版本）

## 使用 DALL-E 代理

本项目支持使用 [Free DALL-E Proxy](https://github.com/Feiyuyu0503/free-dall-e-proxy) 作为 OpenAI API 的替代方案。

### 配置步骤

1. 在 `.env` 文件中设置代理端点：
```bash
OPENAI_API_BASE_URL=https://dalle.feiyuyu.net/v1
```

2. 使用您的 API 密钥：
```bash
OPENAI_API_KEY=your-api-key
```

### 代理特性

- 完全兼容 OpenAI API
- 支持 DALL-E 3 模型
- 免费使用（基于 Coze 平台）
- 支持标准的图片生成参数

### 注意事项

- 建议在开发环境中使用
- 遵循代理服务的使用规范
- 注意请求频率限制
- 仅用于教育和学习目的

## Vercel 部署

本项目可以轻松部署到 Vercel 平台。

### 部署步骤

1. Fork 本项目到您的 GitHub 账号

2. 在 Vercel 中导入项目：
   - 登录 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 选择您 fork 的仓库
   - 点击 "Import"

3. 配置环境变量：
   - 在项目设置中找到 "Environment Variables"
   - 添加以下环境变量：
     ```
     OPENAI_API_KEY=your-api-key
     OPENAI_API_BASE_URL=https://dalle.feiyuyu.net/v1
     NODE_VERSION=20.11.0
     ```

4. 部署设置：
   - Framework Preset: Next.js
   - Node.js Version: 20.x（会自动使用 NODE_VERSION 环境变量的值）
   - Build Command: `next build`
   - Output Directory: `.next`

5. 点击 "Deploy" 开始部署

### 更新部署

- 推送到 main 分支的代码会自动触发重新部署
- 环境变量的修改会触发重新构建
- 可以在 Vercel Dashboard 中查看部署状态和日志

## 本地开发

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
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
