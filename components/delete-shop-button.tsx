"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { deleteShop } from "@/app/shop/[shopId]/actions"

export function DeleteShopButton({ shopId }: { shopId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={async () => {
        if (!confirm("정말로 이 매장을 삭제하시겠습니까?")) return;
        setLoading(true)
        const result = await deleteShop(shopId)
        if (result.success) router.refresh()
        else alert(result.message)
        setLoading(false)
      }}
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete"}
    </Button>
  )
} 