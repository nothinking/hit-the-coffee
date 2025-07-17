"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { deleteMenuItem } from "@/app/shop/[shopId]/actions"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
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
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </CardContent>
    </Card>
  )
}
