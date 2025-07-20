import Link from "next/link"
import { createSupabaseServer } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { deleteShop } from "@/app/shop/[shopId]/actions"
import { useRouter } from "next/navigation"
import { DeleteShopButton } from "@/components/delete-shop-button"
import { StartNewOrderForm } from "@/components/start-new-order-form";

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

  // 모든 매장을 표시
  const allShops = coffeeShops || []

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-gray-600">원하는 매장에서 쏘세요~ 🎯</p>
              <p className="text-sm text-gray-500 mt-2">주문 취합이 편해 집니다</p>
            </div>
            
            {/* 액션 버튼들 */}
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Link href="/register-shop">
                <span className="mr-2">🏪</span>
                매장 등록
              </Link>
            </Button>
          </div>
        </div>

        {allShops && allShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allShops.map((shop) => (
              <Card key={shop.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      <Link href={`/shop/${shop.id}`} className="hover:underline">
                        {shop.name}
                      </Link>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  {shop.address && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-blue-500">📍</span>
                      {shop.address}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <StartNewOrderForm shopId={shop.id} shopName={shop.name} />

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">☕</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">등록된 매장이 없습니다</h2>
            <p className="text-lg text-gray-600 mb-8">첫 번째 매장을 등록하고 주문 시스템을 시작해보세요!</p>
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/register-shop">
                <span className="mr-2">🚀</span>
                첫 번째 매장 등록하기
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
