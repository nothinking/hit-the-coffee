"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useRefreshContext } from "./auto-refresh-wrapper"

interface RefreshOrderButtonProps {
  className?: string
}

export function RefreshOrderButton({ className }: RefreshOrderButtonProps) {
  const router = useRouter()
  const [localRefreshing, setLocalRefreshing] = useState(false)
  
  // AutoRefreshWrapper의 새로고침 상태를 가져옵니다
  let contextRefreshing = false
  try {
    const { isRefreshing } = useRefreshContext()
    contextRefreshing = isRefreshing
  } catch (error) {
    // AutoRefreshWrapper 외부에서 사용될 때는 무시
  }

  const isRefreshing = localRefreshing || contextRefreshing

  const handleRefresh = () => {
    setLocalRefreshing(true)
    // 페이지를 새로고침하여 최신 주문현황을 가져옵니다
    router.refresh()
    
    // 애니메이션을 위해 잠시 대기 후 상태를 리셋합니다
    setTimeout(() => {
      setLocalRefreshing(false)
    }, 1000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className}
    >
      <RefreshCw 
        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
    </Button>
  )
} 