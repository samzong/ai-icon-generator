import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { getRateLimitMessages } from './lib/rate-limit-messages';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'zh-CN'],
  defaultLocale: 'en',
  localeDetection: false,
  localePrefix: 'as-needed'
});

interface RequestRecord {
  count: number;
  timestamp: number;
}

interface RateLimitStore {
  hourlyRequests: Map<string, RequestRecord>;
  minutelyRequests: Map<string, RequestRecord>;
}

// Edge Runtime兼容的全局实例注册表
const RATE_LIMIT_MANAGER_SYMBOL = Symbol.for('__rate_limit_manager_instances__');

interface GlobalThis {
  [RATE_LIMIT_MANAGER_SYMBOL]?: {
    instances: Set<WeakRef<RateLimitManager>>;
    activeInstance?: WeakRef<RateLimitManager>;
    registry?: FinalizationRegistry<string>;
  };
}

// Edge Runtime环境检测
function isEdgeRuntime(): boolean {
  return (
    (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) ||
    (typeof process !== 'undefined' && process.env.VERCEL_REGION !== undefined) ||
    (typeof process !== 'undefined' && process.env.EDGE_RUNTIME === '1')
  );
}

// 速率限制存储管理类（Edge Runtime优化单例模式）
class RateLimitManager {
  private static instance: RateLimitManager;
  private store: RateLimitStore;
  private cleanupInterval: NodeJS.Timeout | number | null = null;
  private readonly CLEANUP_INTERVAL: number;
  private readonly isDestroyed = { value: false };
  private readonly instanceId = Math.random().toString(36).substring(2);

  private constructor() {
    this.store = {
      hourlyRequests: new Map(),
      minutelyRequests: new Map(),
    };
    
    // Edge Runtime中使用更短的清理间隔以减少内存压力
    this.CLEANUP_INTERVAL = isEdgeRuntime() ? 1000 * 60 * 15 : 1000 * 60 * 60; // 15分钟 vs 1小时
    
    this.registerInstance();
    this.startCleanup();
  }

  private registerInstance(): void {
    if (typeof globalThis === 'undefined') return;

    const global = globalThis as GlobalThis;
    
    // 初始化全局注册表
    if (!global[RATE_LIMIT_MANAGER_SYMBOL]) {
      global[RATE_LIMIT_MANAGER_SYMBOL] = {
        instances: new Set(),
        registry: new FinalizationRegistry((instanceId: string) => {
          // 清理回调 - instanceId用于标识已回收的实例
          console.debug('[RateLimitManager] Instance', instanceId, 'was garbage collected');
        })
      };
    }

    const registry = global[RATE_LIMIT_MANAGER_SYMBOL]!;
    
    // 清理已垃圾回收的实例引用
    registry.instances.forEach(weakRef => {
      if (weakRef.deref() === undefined) {
        registry.instances.delete(weakRef);
      }
    });

    // 销毁其他活动实例
    registry.instances.forEach(weakRef => {
      const instance = weakRef.deref();
      if (instance && instance !== this) {
        instance.destroy();
      }
    });

    // 注册当前实例
    const thisWeakRef = new WeakRef(this);
    registry.instances.add(thisWeakRef);
    registry.activeInstance = thisWeakRef;
    
    // 注册到终结器以确保清理
    if (registry.registry) {
      registry.registry.register(this, this.instanceId);
    }
  }

  public static getInstance(): RateLimitManager {
    if (typeof globalThis !== 'undefined') {
      const global = globalThis as GlobalThis;
      const registry = global[RATE_LIMIT_MANAGER_SYMBOL];
      
      // 尝试获取现有的活动实例
      if (registry?.activeInstance) {
        const existing = registry.activeInstance.deref();
        if (existing && !existing.isDestroyed.value) {
          return existing;
        }
      }
    }

    // 创建新实例
    if (!RateLimitManager.instance || RateLimitManager.instance.isDestroyed.value) {
      RateLimitManager.instance = new RateLimitManager();
    }
    
    return RateLimitManager.instance;
  }

  private startCleanup(): void {
    if (this.cleanupInterval !== null || this.isDestroyed.value) {
      return; // 已经启动清理任务或实例已销毁
    }

    // Edge Runtime兼容的定时器创建
    const createTimer = () => {
      if (typeof setTimeout === 'undefined') return null;
      
      const performCleanupWithCheck = () => {
        if (!this.isDestroyed.value) {
          this.performCleanup();
          // 递归调用以保持清理循环
          this.cleanupInterval = createTimer();
        }
      };

      return setTimeout(performCleanupWithCheck, this.CLEANUP_INTERVAL);
    };

    this.cleanupInterval = createTimer();
  }

  private performCleanup(): void {
    if (this.isDestroyed.value) return;

    const now = Date.now();
    const hourAgo = now - 1000 * 60 * 60;
    const minuteAgo = now - 1000 * 60;

    try {
      // 清理过期的小时记录
      for (const [ip, record] of this.store.hourlyRequests.entries()) {
        if (record.timestamp < hourAgo) {
          this.store.hourlyRequests.delete(ip);
        }
      }

      // 清理过期的分钟记录
      for (const [ip, record] of this.store.minutelyRequests.entries()) {
        if (record.timestamp < minuteAgo) {
          this.store.minutelyRequests.delete(ip);
        }
      }

      // Edge Runtime中的额外内存压力处理
      if (isEdgeRuntime()) {
        // 如果Map过大，进行强制清理
        const maxSize = 10000;
        if (this.store.hourlyRequests.size > maxSize) {
          const entries = Array.from(this.store.hourlyRequests.entries());
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          this.store.hourlyRequests.clear();
          entries.slice(0, maxSize / 2).forEach(([ip, record]) => {
            this.store.hourlyRequests.set(ip, record);
          });
        }
        
        if (this.store.minutelyRequests.size > maxSize) {
          const entries = Array.from(this.store.minutelyRequests.entries());
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          this.store.minutelyRequests.clear();
          entries.slice(0, maxSize / 2).forEach(([ip, record]) => {
            this.store.minutelyRequests.set(ip, record);
          });
        }
      }
    } catch (error) {
      // 清理过程中的错误不应该影响应用运行
      console.warn('[RateLimitManager] Cleanup error:', error);
    }
  }

  private stopCleanup(): void {
    if (this.cleanupInterval !== null) {
      if (typeof clearTimeout !== 'undefined') {
        clearTimeout(this.cleanupInterval as number);
      }
      this.cleanupInterval = null;
    }
  }

  public destroy(): void {
    if (this.isDestroyed.value) return;
    
    this.isDestroyed.value = true;
    this.stopCleanup();
    
    // 清理存储
    if (this.store.hourlyRequests) {
      this.store.hourlyRequests.clear();
    }
    if (this.store.minutelyRequests) {
      this.store.minutelyRequests.clear();
    }

    // 从全局注册表中移除
    if (typeof globalThis !== 'undefined') {
      const global = globalThis as GlobalThis;
      const registry = global[RATE_LIMIT_MANAGER_SYMBOL];
      
      if (registry) {
        registry.instances.forEach(weakRef => {
          if (weakRef.deref() === this) {
            registry.instances.delete(weakRef);
          }
        });
        
        if (registry.activeInstance?.deref() === this) {
          registry.activeInstance = undefined;
        }
      }
    }
  }

  public getStore(): RateLimitStore {
    if (this.isDestroyed.value) {
      throw new Error('RateLimitManager instance has been destroyed');
    }
    return this.store;
  }

  public getInstanceId(): string {
    return this.instanceId;
  }

  public isActive(): boolean {
    return !this.isDestroyed.value;
  }
}

// 获取全局单例实例的安全封装函数
function getRateLimitManager(): RateLimitManager {
  try {
    const manager = RateLimitManager.getInstance();
    if (!manager.isActive()) {
      // 如果实例已销毁，创建新实例
      return RateLimitManager.getInstance();
    }
    return manager;
  } catch (error) {
    console.warn('[RateLimitManager] Error getting instance, creating new one:', error);
    return RateLimitManager.getInstance();
  }
}

function getRateLimitStore(): RateLimitStore {
  const manager = getRateLimitManager();
  return manager.getStore();
}

const MAX_REQUESTS_PER_HOUR = parseInt(
  process.env.MAX_REQUESTS_PER_HOUR || "10",
  10
);
const MAX_REQUESTS_PER_MINUTE = parseInt(
  process.env.MAX_REQUESTS_PER_MINUTE || "2",
  10
);

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/');
  const locale = segments[1];
  return ['en', 'zh-CN'].includes(locale) ? locale : 'en';
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith("/api")) {
    if (pathname.startsWith("/api/generate")) {
      const ip = getClientIP(request);
      const now = Date.now();
      const isHeadRequest = request.method === "HEAD";
      const locale = getLocaleFromPath(request.headers.get('referer') || '/en');
      const messages = await getRateLimitMessages(locale);

      // 获取当前活动的存储实例
      const store = getRateLimitStore();

      const hourAgo = now - 1000 * 60 * 60;
      let hourlyRecord = store.hourlyRequests.get(ip);

      if (!hourlyRecord || hourlyRecord.timestamp < hourAgo) {
        hourlyRecord = { count: isHeadRequest ? 0 : 1, timestamp: now };
      } else if (!isHeadRequest) {
        hourlyRecord.count += 1;
      }

      store.hourlyRequests.set(ip, hourlyRecord);

      const minuteAgo = now - 1000 * 60;
      let minutelyRecord = store.minutelyRequests.get(ip);

      if (!minutelyRecord || minutelyRecord.timestamp < minuteAgo) {
        minutelyRecord = { count: isHeadRequest ? 0 : 1, timestamp: now };
      } else if (!isHeadRequest) {
        minutelyRecord.count += 1;
      }

      store.minutelyRequests.set(ip, minutelyRecord);

      if (isHeadRequest) {
        const response = NextResponse.next();
        response.headers.set(
          "X-RateLimit-Limit-Hour",
          MAX_REQUESTS_PER_HOUR.toString()
        );
        response.headers.set(
          "X-RateLimit-Remaining-Hour",
          Math.max(0, MAX_REQUESTS_PER_HOUR - hourlyRecord.count).toString()
        );
        response.headers.set(
          "X-RateLimit-Limit-Minute",
          MAX_REQUESTS_PER_MINUTE.toString()
        );
        response.headers.set(
          "X-RateLimit-Remaining-Minute",
          Math.max(0, MAX_REQUESTS_PER_MINUTE - minutelyRecord.count).toString()
        );
        return response;
      }

      if (hourlyRecord.count > MAX_REQUESTS_PER_HOUR) {
        const resetTime = new Date(hourlyRecord.timestamp + 1000 * 60 * 60);
        const resetTimeISO = resetTime.toISOString();
        const resetTimeLocal = resetTime.toLocaleTimeString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
          hour: "2-digit",
          minute: "2-digit",
        });

        return new NextResponse(
          JSON.stringify({
            error: messages.hourlyError,
            limit: MAX_REQUESTS_PER_HOUR,
            remaining: 0,
            resetAt: resetTimeISO,
            resetAtLocal: resetTimeLocal,
            message: messages.hourlyMessage(MAX_REQUESTS_PER_HOUR, resetTimeLocal),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": MAX_REQUESTS_PER_HOUR.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": resetTimeISO,
            },
          }
        );
      }

      if (minutelyRecord.count > MAX_REQUESTS_PER_MINUTE) {
        const resetTime = new Date(minutelyRecord.timestamp + 1000 * 60);
        const resetTimeISO = resetTime.toISOString();
        const resetTimeLocal = resetTime.toLocaleTimeString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        return new NextResponse(
          JSON.stringify({
            error: messages.minutelyError,
            limit: MAX_REQUESTS_PER_MINUTE,
            remaining: 0,
            resetAt: resetTimeISO,
            resetAtLocal: resetTimeLocal,
            message: messages.minutelyMessage(MAX_REQUESTS_PER_MINUTE, resetTimeLocal),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": MAX_REQUESTS_PER_MINUTE.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": resetTimeISO,
            },
          }
        );
      }

      const response = NextResponse.next();
      response.headers.set(
        "X-RateLimit-Limit-Hour",
        MAX_REQUESTS_PER_HOUR.toString()
      );
      response.headers.set(
        "X-RateLimit-Remaining-Hour",
        Math.max(0, MAX_REQUESTS_PER_HOUR - hourlyRecord.count).toString()
      );
      response.headers.set(
        "X-RateLimit-Limit-Minute",
        MAX_REQUESTS_PER_MINUTE.toString()
      );
      response.headers.set(
        "X-RateLimit-Remaining-Minute",
        Math.max(0, MAX_REQUESTS_PER_MINUTE - minutelyRecord.count).toString()
      );

      return response;
    }
    
    return NextResponse.next();
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (pathname === '/zh') {
    const url = request.nextUrl.clone();
    url.pathname = '/zh-CN';
    return NextResponse.redirect(url);
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith('/en') || pathname.startsWith('/zh-CN')) {
    return intlMiddleware(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)' 
  ]
};
