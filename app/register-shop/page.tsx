"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function RegisterShopPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowser()
      const { data, error: supabaseError } = await supabase
        .from("coffee_shops")
        .insert({ name, address })
        .select()
        .single()

      if (supabaseError) throw supabaseError

      // Navigate to the management page for the new shop
      router.push(`/shop/${data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-6">
          <h1 className="text-2xl font-semibold text-center">Register Coffee Shop</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Shop Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Address (optional)</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Create Shop"}
            </Button>
          </form>

          {error && (
            <p className="text-sm text-red-600 text-center" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
