'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { eventManager, EVENTS } from '@/lib/events'
import { useTranslations } from 'next-intl'

interface RateLimitInfo {
  hourLimit: string
  minuteLimit: string
  hourRemaining: string | null
  minuteRemaining: string | null
}

export function RateLimitStatus() {
  const t = useTranslations('rateLimitStatus')
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取速率限制信息
  const fetchRateLimitInfo = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rate-limit-status')
      if (!response.ok) {
        throw new Error(t('errorFetch'))
      }
      const data = await response.json()
      setRateLimitInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFetch'))
      console.error('Failed to fetch rate limit info:', err)
    } finally {
      setLoading(false)
    }
  }, [t])

  // 组件加载时获取速率限制信息
  useEffect(() => {
    fetchRateLimitInfo()

    // 每 60 秒刷新一次
    const intervalId = setInterval(fetchRateLimitInfo, 60000)
    
    // 订阅速率限制更新事件
    const unsubscribe = eventManager.subscribe(EVENTS.RATE_LIMIT_UPDATE, fetchRateLimitInfo)
    
    return () => {
      clearInterval(intervalId)
      unsubscribe()
    }
  }, [fetchRateLimitInfo])

  // 如果正在加载或出错，不显示任何内容
  if (loading || error || !rateLimitInfo) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 py-2 px-4 text-sm flex items-center justify-center space-x-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{t('title')}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <span className="font-medium">{t('hourly')}</span>
            <span className="text-gray-400">{t('loading')}</span>
          </div>
          
          <div>
            <span className="font-medium">{t('minutely')}</span>
            <span className="text-gray-400">{t('loading')}</span>
          </div>
        </div>
      </div>
    )
  }

  // 计算小时和分钟的剩余请求数
  const hourRemaining = rateLimitInfo.hourRemaining !== null 
    ? Math.max(0, parseInt(rateLimitInfo.hourRemaining, 10))
    : parseInt(rateLimitInfo.hourLimit, 10)
  
  const minuteRemaining = rateLimitInfo.minuteRemaining !== null 
    ? Math.max(0, parseInt(rateLimitInfo.minuteRemaining, 10))
    : parseInt(rateLimitInfo.minuteLimit, 10)

  // 确定警告级别
  const getHourWarningLevel = () => {
    const hourLimit = parseInt(rateLimitInfo.hourLimit, 10)
    const percentage = (hourRemaining / hourLimit) * 100
    if (percentage <= 20) return 'text-red-500'
    if (percentage <= 50) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getMinuteWarningLevel = () => {
    const minuteLimit = parseInt(rateLimitInfo.minuteLimit, 10)
    const percentage = (minuteRemaining / minuteLimit) * 100
    if (percentage <= 50) return 'text-red-500'
    return 'text-green-500'
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 py-2 px-4 text-sm flex items-center justify-center space-x-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 mr-1" />
        <span>{t('title')}</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div>
          <span className="font-medium">{t('hourly')}</span>
          <span className={getHourWarningLevel()}>
            {hourRemaining}/{rateLimitInfo.hourLimit}{t('times')}
          </span>
        </div>
        
        <div>
          <span className="font-medium">{t('minutely')}</span>
          <span className={getMinuteWarningLevel()}>
            {minuteRemaining}/{rateLimitInfo.minuteLimit}{t('times')}
          </span>
        </div>
      </div>
    </div>
  )
} 