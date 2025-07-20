"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { deleteShop } from "@/app/shop/[shopId]/actions"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DeleteShopButton({ shopId }: { shopId: string }) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  const handleDelete = async () => {
    setLoading(true)
    setIsOpen(false)
    const result = await deleteShop(shopId)
    if (result.success) {
      toast({
        title: "메뉴판 삭제 완료",
        description: "메뉴판이 삭제되었습니다.",
      })
      router.push('/shops')
    } else {
      toast({
        title: "메뉴판 삭제 실패",
        description: result.message || "메뉴판 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
                  <AlertDialogTitle>메뉴판 삭제 확인</AlertDialogTitle>
        <AlertDialogDescription>
          정말로 이 메뉴판을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 메뉴와 주문 내역이 영구적으로 삭제됩니다.
        </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 