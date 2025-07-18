"use client"
import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function StartNewOrderForm({ shopId }: { shopId: string }) {
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [expiresInMinutes, setExpiresInMinutes] = useState<string | number>(30);

  // 재미있는 세션 이름 자동 생성 함수
  function generateFunTitle(): string {
    const funTitles = [
      "기분이 좋아서",
      "날씨가 좋아서",
      "커피가 땡겨서",
      "친구들과 함께",
      "혼자 여유롭게",
      "새로운 메뉴 시도",
      "오늘은 특별히",
      "스트레스 해소",
      "기념일이어서",
      "그냥 땡겨서",
      "커피 한 잔의 여유",
      "오후의 힐링",
      "아침의 활력",
      "저녁의 휴식",
      "주말의 특별함",
      "평일의 작은 선물",
      "커피 향에 취해서",
      "카페 분위기가 좋아서",
      "새로운 카페 탐방",
      "익숙한 맛이 그리워서"
    ]
    return funTitles[Math.floor(Math.random() * funTitles.length)]
  }


  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
          const minutes = expiresInMinutes === "" ? 30 : Number(expiresInMinutes);
          const now = new Date();
          // UTC 기준으로 expires_at 계산
          const expiresAt = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
          
          // 제목이 비어있으면 자동으로 재미있는 제목 생성
          const finalTitle = title.trim() || generateFunTitle();
          
          const res = await fetch("/api/start-new-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shopId, title: finalTitle, expires_at: expiresAt })
          })
          const data = await res.json()
          if (!data.success) setError(data.message)
          else {
            if (data.shareCode) {
              // 세션 페이지로 바로 이동
              router.push(`/order/${data.shareCode}`);
            } else {
              router.refresh()
            }
            setTitle("");
            setExpiresInMinutes(30);
          }
        })
      }}
      className="flex flex-col gap-3 w-full"
    >
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="세션 이름 (비워두면 자동 생성)"
          className="border-2 border-gray-200 rounded-lg px-3 py-2 flex-1 text-sm focus:border-blue-500 focus:outline-none transition-colors"
          disabled={isPending}
        />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>⏰ 만료시간: 30분</span>
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={isPending} 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            세션 생성 중...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>🎯</span>
            내가쏜다
          </div>
        )}
      </Button>
      {error && <span className="text-red-500 text-sm text-center">{error}</span>}
    </form>
  )
} 