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
  const [orderLink, setOrderLink] = useState<string | null>(null);

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError(null)
        setOrderLink(null)
        startTransition(async () => {
          const minutes = expiresInMinutes === "" ? 30 : Number(expiresInMinutes);
          const now = new Date();
          // UTC 기준으로 expires_at 계산
          const expiresAt = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
          const res = await fetch("/api/start-new-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shopId, title, expires_at: expiresAt })
          })
          const data = await res.json()
          if (!data.success) setError(data.message)
          else {
            router.refresh()
            if (data.shareCode) {
              const link = `${window.location.origin}/order/${data.shareCode}`;
              setOrderLink(link);
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
          placeholder="Order title"
          className="border rounded px-2 py-1 flex-1 min-w-0"
          required
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
      {orderLink && (
        <div className="mt-2 flex flex-col items-start gap-2 w-full">
          <span className="text-sm font-semibold text-blue-700">주문 링크:</span>
          <div className="flex items-center gap-2 w-full">
            <input type="text" value={orderLink} readOnly className="border rounded px-2 py-1 flex-1 min-w-0 bg-gray-50" />
            <Button type="button" size="sm" onClick={() => {navigator.clipboard.writeText(orderLink)}}>복사</Button>
          </div>
        </div>
      )}
    </form>
  )
} 