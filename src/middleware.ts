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

const store: RateLimitStore = {
  hourlyRequests: new Map(),
  minutelyRequests: new Map(),
};

const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1小时清理一次
setInterval(() => {
  const now = Date.now();
  const hourAgo = now - 1000 * 60 * 60;
  const minuteAgo = now - 1000 * 60;

  for (const [ip, record] of store.hourlyRequests.entries()) {
    if (record.timestamp < hourAgo) {
      store.hourlyRequests.delete(ip);
    }
  }

  for (const [ip, record] of store.minutelyRequests.entries()) {
    if (record.timestamp < minuteAgo) {
      store.minutelyRequests.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

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
