// 简单的事件管理器
type EventCallback = () => void;
type EventMap = {
  [eventName: string]: EventCallback[];
};

class EventManager {
  private events: EventMap = {};

  // 订阅事件
  subscribe(eventName: string, callback: EventCallback): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);

    // 返回取消订阅的函数
    return () => {
      this.events[eventName] = this.events[eventName].filter(
        (cb) => cb !== callback
      );
    };
  }

  // 触发事件
  emit(eventName: string): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in event callback for ${eventName}:`, error);
        }
      });
    }
  }
}

// 创建单例实例
export const eventManager = new EventManager();

// 定义事件名称常量
export const EVENTS = {
  RATE_LIMIT_UPDATE: 'rate-limit-update',
  HISTORY_UPDATE: 'history-update',
}; 