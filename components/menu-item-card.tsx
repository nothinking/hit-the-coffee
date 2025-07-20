"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { deleteMenuItem } from "@/app/shop/[shopId]/actions"
import { useRouter } from "next/navigation"
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

interface MenuItemCardProps {
  shopId: string
  item: {
    id: string
    name: string
    description?: string | null
    price: number
  }
}

export function MenuItemCard({ shopId, item }: MenuItemCardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    setIsOpen(false)
    const result = await deleteMenuItem(shopId, item.id)
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        {item.description && <CardDescription>{item.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <p className="text-lg font-semibold">{item.price.toFixed(2)}</p>
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>메뉴 삭제 확인</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 "{item.name}" 메뉴를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
      </CardContent>
    </Card>
  )
}
