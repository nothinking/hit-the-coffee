"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { useRouter } from "next/navigation"

interface RefreshContextType {
  isRefreshing: boolean
  setIsRefreshing: (refreshing: boolean) => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function useRefreshContext() {
  const context = useContext(RefreshContext)
  if (!context) {
    throw new Error("useRefreshContext must be used within AutoRefreshWrapper")
  }
  return context
}

interface AutoRefreshWrapperProps {
  children: React.ReactNode
  intervalMs?: number // 기본값 5000ms (5초)
  enabled?: boolean // 자동 새로고침 활성화 여부
}

export function AutoRefreshWrapper({ 
  children, 
  intervalMs = 5000, 
  enabled = true 
}: AutoRefreshWrapperProps) {
  const router = useRouter()
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isEnabled) return

    const interval = setInterval(() => {
      setIsRefreshing(true)
      router.refresh()
      
      // 새로고침 애니메이션을 위해 잠시 대기 후 상태를 리셋
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [router, intervalMs, isEnabled])

  return (
    <RefreshContext.Provider value={{ isRefreshing, setIsRefreshing }}>
      {children}
    </RefreshContext.Provider>
  )
} 