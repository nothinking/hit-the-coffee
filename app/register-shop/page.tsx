"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { MenuInputForm } from "@/components/menu-input-form"

interface MenuItem {
  name: string
  description: string
  price: string
}

export default function RegisterShopPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [extractedMenus, setExtractedMenus] = useState<MenuItem[]>([])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowser()
      const { data, error: supabaseError } = await supabase
        .from("coffee_shops")
        .insert({ name })
        .select()
        .single()

      if (supabaseError) throw supabaseError

      // If there are menus to add, add them
      if (extractedMenus.length > 0) {
        const menuResponse = await fetch("/api/menu/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: data.id,
            menus: extractedMenus.map(menu => ({
              name: menu.name,
              description: menu.description,
              price: menu.price || "0"
            }))
          })
        })

        if (!menuResponse.ok) {
          console.error("Failed to add menus")
        }
      }

      // Navigate to the management page for the new shop
      router.push(`/shop/${data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMenusExtracted = (menus: MenuItem[]) => {
    setExtractedMenus(menus)
  }

  const handleReset = () => {
    setExtractedMenus([])
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4 pt-24">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">매장등록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Shop Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Shop Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Shop Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </form>

            {error && (
              <p className="text-sm text-red-600 text-center" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Menu Setup Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Menu Setup (Optional)</h2>
            <p className="text-sm text-gray-600">
              메뉴판 사진을 찍어서 자동으로 메뉴를 등록할 수 있습니다.
            </p>

            <MenuInputForm 
              onMenusExtracted={handleMenusExtracted}
              onReset={handleReset}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading || !name}
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e as any)
              }}
            >
              {loading ? "등록 중..." : "매장 등록하기"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
