# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run dev:noturbo      # Start development server without Turbopack

# Build and Production
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint

# Testing
npm run test:e2e        # Run Playwright E2E tests
```

## Architecture Overview

This is a Next.js 15 AI icon generator using DALL-E 3 with App Router architecture. The application supports multiple AI providers, internationalization (English/Chinese), and includes comprehensive caching and rate limiting.

### Key API Routes (`/src/app/api/`)
- `/api/generate` - Core icon generation endpoint with multi-provider support
- `/api/proxy` - Image proxy service for CORS handling and validation
- `/api/rate-limit-status` - Rate limiting status checker

### Core Components Structure
- `icon-generator/` - Main generation interface with prompt input, style selector, preview, and export options
- `layout/` - Site header and language switcher
- `ui/` - shadcn/ui component library

### Essential Libraries (`/src/lib/`)
- `openai.ts` - Multi-provider AI integration (OpenAI, custom endpoints)
- `storage.ts` - Local storage for history and API configurations
- `cache.ts` - Icon caching system to avoid duplicate requests
- `api-providers.ts` - AI provider configuration management
- `download.ts` - Image format conversion and download handling

### Internationalization
- Uses next-intl with "as-needed" path strategy
- Default locale (English) has no path prefix
- Message files in `/messages/` directory
- Language detection handled by middleware

### Rate Limiting Configuration
- Built-in IP-based rate limiting in API routes
- Configurable via environment variables (MAX_REQUESTS_PER_HOUR, MAX_REQUESTS_PER_MINUTE)
- Status endpoint for frontend rate limit display

### State Management
- Uses Zustand for client-side state
- Local storage integration for persistence
- Event system for cross-component communication

### Image Processing
- Supports multiple export formats (PNG, ICO, ICNS, JPEG)
- Image proxy for external URL handling
- Size validation and optimization
- Remote image pattern configuration in next.config.ts

### Technology Stack
- Next.js 15 with App Router
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- next-intl for i18n
- Playwright for E2E testing
- Zustand for state management
