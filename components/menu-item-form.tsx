"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { addMenuItem } from "@/app/shop/[shopId]/actions"

interface MenuItemFormProps {
  shopId: string
}

export function MenuItemForm({ shopId }: MenuItemFormProps) {
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await addMenuItem(shopId, formData)
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      formRef.current?.reset() // Clear the form
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
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Item Name</Label>
        <Input id="name" name="name" required disabled={loading} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" disabled={loading} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="price">Price</Label>
        <Input id="price" name="price" type="number" step="0.01" required disabled={loading} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding..." : "Add Menu Item"}
      </Button>
    </form>
  )
}
