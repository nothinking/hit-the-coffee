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
      className="flex flex-col gap-2 w-full max-w-xl"
    >
      <div className="flex flex-row gap-2 items-center w-full">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="왜 쏘나요? (비워두면 자동 생성)"
          className="border rounded px-2 py-1 flex-1 min-w-0"
          disabled={isPending}
        />
        <input
          type="text"
          min={1}
          value={expiresInMinutes}
          onChange={e => {
            const val = e.target.value;
            if (/^\d*$/.test(val)) {
              setExpiresInMinutes(val === "" ? "" : Number(val));
            }
          }}
          placeholder="만료(분)"
          className="border rounded px-2 py-1 w-10"
          disabled={isPending}
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">기본 30(분)</span>
        <Button type="submit" disabled={isPending} className="whitespace-nowrap">빵야빵야</Button>
      </div>
      {error && <span className="text-red-500 ml-2">{error}</span>}
    </form>
  )
} 