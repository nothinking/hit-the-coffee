"use client"
import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function StartNewOrderForm({ shopId }: { shopId: string }) {
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
          const res = await fetch("/api/start-new-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shopId, title })
          })
          const data = await res.json()
          if (!data.success) setError(data.message)
          else router.refresh()
        })
      }}
      className="flex gap-2 items-center"
    >
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Order title"
        className="border rounded px-2 py-1"
        required
        disabled={isPending}
      />
      <Button type="submit" disabled={isPending}>Start New Order</Button>
      {error && <span className="text-red-500 ml-2">{error}</span>}
    </form>
  )
} 