import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 内存存储请求记录
interface RequestRecord {
  count: number;
  timestamp: number;
}

interface RateLimitStore {
  // IP -> 小时窗口记录
  hourlyRequests: Map<string, RequestRecord>;
  // IP -> 分钟窗口记录
  minutelyRequests: Map<string, RequestRecord>;
}

// 初始化存储
const store: RateLimitStore = {
  hourlyRequests: new Map(),
  minutelyRequests: new Map(),
};

// 清理过期记录（可选，防止内存泄漏）
const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1小时清理一次
setInterval(() => {
  const now = Date.now();
  const hourAgo = now - 1000 * 60 * 60;
  const minuteAgo = now - 1000 * 60;

  // 清理过期的小时记录
  for (const [ip, record] of store.hourlyRequests.entries()) {
    if (record.timestamp < hourAgo) {
      store.hourlyRequests.delete(ip);
    }
  }

  // 清理过期的分钟记录
  for (const [ip, record] of store.minutelyRequests.entries()) {
    if (record.timestamp < minuteAgo) {
      store.minutelyRequests.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

// 获取环境变量中的限制配置
const MAX_REQUESTS_PER_HOUR = parseInt(
  process.env.MAX_REQUESTS_PER_HOUR || "10",
  10
);
const MAX_REQUESTS_PER_MINUTE = parseInt(
  process.env.MAX_REQUESTS_PER_MINUTE || "2",
  10
);

// 获取客户端 IP 地址
function getClientIP(request: NextRequest): string {
  // 尝试从各种头部获取 IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for 可能包含多个 IP，取第一个
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // 如果无法获取 IP，返回一个默认值
  return "unknown";
}

export function middleware(request: NextRequest) {
  // 仅对 API 生成路由应用限制
  if (!request.nextUrl.pathname.startsWith("/api/generate")) {
    return NextResponse.next();
  }

  // 获取客户端 IP
  const ip = getClientIP(request);

  const now = Date.now();
  const isHeadRequest = request.method === "HEAD";

  // 检查小时限制
  const hourAgo = now - 1000 * 60 * 60;
  let hourlyRecord = store.hourlyRequests.get(ip);

  if (!hourlyRecord || hourlyRecord.timestamp < hourAgo) {
    // 如果没有记录或记录已过期，创建新记录
    hourlyRecord = { count: isHeadRequest ? 0 : 1, timestamp: now };
  } else if (!isHeadRequest) {
    // 只有非 HEAD 请求才增加计数
    hourlyRecord.count += 1;
  }

  // 更新记录
  store.hourlyRequests.set(ip, hourlyRecord);

  // 检查分钟限制
  const minuteAgo = now - 1000 * 60;
  let minutelyRecord = store.minutelyRequests.get(ip);

  if (!minutelyRecord || minutelyRecord.timestamp < minuteAgo) {
    // 如果没有记录或记录已过期，创建新记录
    minutelyRecord = { count: isHeadRequest ? 0 : 1, timestamp: now };
  } else if (!isHeadRequest) {
    // 只有非 HEAD 请求才增加计数
    minutelyRecord.count += 1;
  }

  // 更新记录
  store.minutelyRequests.set(ip, minutelyRecord);

  // 如果是 HEAD 请求，直接返回限制信息，不检查是否超过限制
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

  // 检查是否超过限制
  if (hourlyRecord.count > MAX_REQUESTS_PER_HOUR) {
    const resetTime = new Date(hourlyRecord.timestamp + 1000 * 60 * 60);
    const resetTimeISO = resetTime.toISOString();
    const resetTimeLocal = resetTime.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return new NextResponse(
      JSON.stringify({
        error: "已超过每小时请求限制",
        limit: MAX_REQUESTS_PER_HOUR,
        remaining: 0,
        resetAt: resetTimeISO,
        resetAtLocal: resetTimeLocal,
        message: `您已达到每小时 ${MAX_REQUESTS_PER_HOUR} 次的请求限制。请在 ${resetTimeLocal} 后再试。`,
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
    const resetTimeLocal = resetTime.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return new NextResponse(
      JSON.stringify({
        error: "已超过每分钟请求限制",
        limit: MAX_REQUESTS_PER_MINUTE,
        remaining: 0,
        resetAt: resetTimeISO,
        resetAtLocal: resetTimeLocal,
        message: `您已达到每分钟 ${MAX_REQUESTS_PER_MINUTE} 次的请求限制。请在 ${resetTimeLocal} 后再试。`,
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

  // 添加剩余请求信息到响应头
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

// 配置中间件匹配的路径
export const config = {
  matcher: ["/api/generate"],
};
