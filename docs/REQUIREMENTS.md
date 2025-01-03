# AI 图标生成器 - 需求说明书

## 项目概述

开发一个基于 Next.js 的 AI 图标生成器 Web 应用，允许用户通过文本描述生成专业的图标设计。

## 技术栈

- **前端框架**: Next.js 14
- **UI 框架**: Tailwind CSS + Shadcn/ui
- **AI 集成**: OpenAI DALL-E 3
- **图像处理**: Sharp
- **状态管理**: Zustand
- **部署**: Vercel

## 功能需求

### 1. 用户界面

#### 1.1 主页面布局
- 清爽现代的设计风格
- 响应式布局，支持移动端到桌面端
- 深色/浅色主题切换

#### 1.2 输入区域
- 文本输入框，支持多行输入
- 预设模板选择下拉菜单
- AI 提示词辅助生成按钮
- 风格预设选择器（扁平、线性、渐变等）

#### 1.3 预览区域
- 实时预览窗口
- 多尺寸预览（16px 到 512px）
- 背景切换（透明、白色、黑色、棋盘格）

#### 1.4 导出选项
- 格式选择（PNG、SVG、ICO）
- 尺寸批量导出
- 导出进度指示器

### 2. 核心功能

#### 2.1 AI 提示词生成
- 根据用户简单描述生成详细的提示词
- 提供多个变体选项
- 支持提示词历史记录

#### 2.2 图标生成
- 实时生成预览
- 支持批量生成多个变体
- 生成过程进度显示
- 错误重试机制

#### 2.3 图标编辑
- 基础调整（亮度、对比度、饱和度）
- 颜色主题快速切换
- 简单的滤镜效果
- 导出尺寸裁剪预览

#### 2.4 历史记录
- 生成历史保存
- 收藏夹功能
- 历史记录分享

### 3. 技术要求

#### 3.1 性能优化
- 图片懒加载
- 生成结果缓存
- 客户端状态管理
- 服务端渲染优化

#### 3.2 API 集成
```typescript
// API 路由示例
interface GenerateIconRequest {
  prompt: string;
  style: 'flat' | 'line' | 'solid' | 'gradient';
  size: number;
  format: 'png' | 'svg' | 'ico';
  variations: number;
}

interface GenerateIconResponse {
  urls: string[];
  metadata: {
    prompt: string;
    style: string;
    timestamp: string;
  };
}
```

#### 3.3 数据存储
- 用户设置
- 生成历史
- 收藏记录

### 4. 用户体验

#### 4.1 交互设计
- 拖拽上传支持
- 快捷键支持
- 操作步骤引导
- 友好的错误提示

#### 4.2 响应式设计
- 移动端优化
- 平板适配
- 大屏幕布局优化

### 5. 安全性要求

- API 密钥安全存储
- 请求频率限制
- 输入验证和过滤
- 文件上传安全检查

## 开发里程碑

### 第一阶段：基础框架（1周）
- 项目初始化
- 基础 UI 组件开发
- 路由设置

### 第二阶段：核心功能（2周）
- AI 接口集成
- 图标生成功能
- 基础编辑功能

### 第三阶段：优化和测试（1周）
- 性能优化
- 用户体验改进
- 兼容性测试

## 验收标准

1. 所有核心功能正常运行
2. 页面加载时间 < 3秒
3. Google Lighthouse 性能分数 > 90
4. 移动端完全适配
5. 主流浏览器兼容性
6. 无重大安全漏洞

## API 端点设计

```typescript
// pages/api/generate.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateIconResponse>
) {
  // 实现图标生成逻辑
}

// pages/api/optimize.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 实现图标优化逻辑
}

// pages/api/history.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 实现历史记录管理
}
```

## 组件结构

```typescript
// 主要组件
components/
  ├── IconGenerator/
  │   ├── PromptInput.tsx
  │   ├── StyleSelector.tsx
  │   ├── PreviewPanel.tsx
  │   └── ExportOptions.tsx
  ├── Editor/
  │   ├── ColorAdjust.tsx
  │   ├── FilterPanel.tsx
  │   └── SizeControl.tsx
  ├── History/
  │   ├── HistoryList.tsx
  │   └── FavoritePanel.tsx
  └── common/
      ├── Button.tsx
      ├── Input.tsx
      └── Loading.tsx
``` 