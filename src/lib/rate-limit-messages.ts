export async function getRateLimitMessages(locale: string) {
  try {
    const messages = await import(`../locales/${locale}/common.json`);
    const rateLimit = messages.default.rateLimit;
    
    return {
      hourlyError: rateLimit.hourlyError,
      minutelyError: rateLimit.minutelyError,
      hourlyMessage: (limit: number, resetTime: string) => 
        rateLimit.hourlyMessage.replace('{limit}', limit.toString()).replace('{resetTime}', resetTime),
      minutelyMessage: (limit: number, resetTime: string) => 
        rateLimit.minutelyMessage.replace('{limit}', limit.toString()).replace('{resetTime}', resetTime)
    };
  } catch {    
    return {
      hourlyError: "Hourly rate limit exceeded",
      minutelyError: "Per-minute rate limit exceeded",
      hourlyMessage: (limit: number, resetTime: string) => 
        `You have reached the hourly limit of ${limit} requests. Please try again after ${resetTime}.`,
      minutelyMessage: (limit: number, resetTime: string) => 
        `You have reached the per-minute limit of ${limit} requests. Please try again after ${resetTime}.`
    };
  }
}
