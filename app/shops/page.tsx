import Link from "next/link"
import { createSupabaseServer } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { deleteShop } from "@/app/shop/[shopId]/actions"
import { useRouter } from "next/navigation"
import { DeleteShopButton } from "@/components/delete-shop-button"

export default async function CoffeeShopListPage() {
  const supabase = await createSupabaseServer()
  const { data: coffeeShops, error } = await supabase.from("coffee_shops").select("*")

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-600">Error loading coffee shops: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4">

      {coffeeShops && coffeeShops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coffeeShops.map((shop) => (
            <Card key={shop.id}>
              <CardHeader>
                <CardTitle>{shop.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {shop.address && <p className="text-sm text-gray-500 mb-2">{shop.address}</p>}
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={`/shop/${shop.id}`}>Manage Shop</Link>
                  </Button>
                  <DeleteShopButton shopId={shop.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 mb-4">No coffee shops registered yet.</p>
          <Button asChild>
            <Link href="/register-shop">Register Your First Coffee Shop</Link>
          </Button>
        </div>
      )}
    </main>
  )
}
