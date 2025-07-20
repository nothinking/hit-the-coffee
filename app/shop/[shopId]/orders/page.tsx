"use client"

import { notFound } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderSessionCard } from "@/components/order-session-card"
import { ArrowLeft, Users } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

interface OrdersPageProps {
  params: {
    shopId: string
  }
}

export default function OrdersPage({ params }: OrdersPageProps) {
  const [shopId, setShopId] = useState<string>("")
  const [coffeeShop, setCoffeeShop] = useState<any>(null)
  const [orderSessions, setOrderSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle params as Promise in Next.js 15
    const handleParams = async () => {
      try {
        const resolvedParams = await params
        setShopId(resolvedParams.shopId)
      } catch (error) {
        console.error('Error resolving params:', error)
      }
    }
    handleParams()
  }, [params])

  useEffect(() => {
    if (shopId) {
      loadData()
    }
  }, [shopId])

  async function loadData() {
    try {
      const supabase = createSupabaseBrowser()
      
      // Fetch coffee shop details
      const { data: shop, error: shopError } = await supabase
        .from("coffee_shops")
        .select("*")
        .eq("id", shopId)
        .single()

      if (shopError || !shop) {
        console.error("Error fetching coffee shop:", shopError)
        notFound()
      }
      setCoffeeShop(shop)

      // Fetch order sessions
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          order_selections (
            id,
            participant_name,
            quantity,
            menu_item_id,
            menu_items (
              name,
              price
            )
          )
        `)
        .eq("coffee_shop_id", shopId)
        .order("created_at", { ascending: false })

      if (orderError) {
        console.error("Error fetching order sessions:", orderError)
      } else {
        setOrderSessions(orders || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!coffeeShop) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pt-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href={`/shop/${shopId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              매장으로 돌아가기
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">{coffeeShop.name} - 주문 세션</h1>
        <p className="text-gray-600">이 매장의 모든 주문 세션을 확인할 수 있습니다.</p>
      </div>

      {/* Order Sessions */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            주문 세션 ({orderSessions.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orderSessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">주문 세션이 없습니다</h3>
              <p className="text-gray-600 mb-4">아직 생성된 주문 세션이 없습니다</p>
              <Button asChild>
                <Link href={`/shop/${shopId}`}>
                  첫 번째 주문 세션 만들기
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orderSessions.map((session) => (
                <OrderSessionCard 
                  key={session.id} 
                  shopId={shopId}
                  order={session}
                  orderSelections={session.order_selections || []}
                  onOrderDeleted={loadData}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 