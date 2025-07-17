import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { OrderSelectionForm } from "@/components/order-selection-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import OrderCountdownInfoWrapper from "@/components/order-countdown-info-wrapper";

interface OrderPageProps {
  params: {
    shareCode: string
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { shareCode } = await params
  const supabase = await createSupabaseServer()

  // 1. Fetch the order session using the shareCode
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("share_code", shareCode)
    .single()

  if (orderError || !order) {
    console.error("Error fetching order:", orderError)
    notFound() // If order not found or error, show 404
  }

  // 2. Fetch the coffee shop details associated with this order
  const { data: coffeeShop, error: shopError } = await supabase
    .from("coffee_shops")
    .select("*")
    .eq("id", order.coffee_shop_id)
    .single()

  if (shopError || !coffeeShop) {
    console.error("Error fetching coffee shop for order:", shopError)
    notFound() // If shop not found or error, show 404
  }

  // 3. Fetch the menu items for this coffee shop
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("coffee_shop_id", coffeeShop.id)
    .order("name", { ascending: true })

  if (menuError) {
    console.error("Error fetching menu items for order:", menuError)
    // Continue rendering, but menuItems will be null or empty
  }

  // 4. Fetch order selections for this order, joined with menu_items
  const { data: orderSelections, error: selectionsError } = await supabase
    .from("order_selections")
    .select(`id, participant_name, quantity, menu_item_id, menu_items ( name, price )`)
    .eq("order_id", order.id)
    .order("created_at", { ascending: true })

  if (selectionsError) {
    console.error("Error fetching order selections:", selectionsError)
    // Continue rendering, but orderSelections will be null or empty
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{coffeeShop.name}</CardTitle>
          <OrderCountdownInfoWrapper
            createdAt={order.created_at}
            expiresAt={order.expires_at}
            title={order.title}
            address={coffeeShop.address}
          />
        </CardHeader>
        <CardContent>
          <OrderSelectionForm
            orderId={order.id}
            menuItems={menuItems || []} // Pass empty array if no menu items
            orderStatus={order.status}
          />
          {/* Show saved order selections below the form */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Saved Orders</h3>
            {orderSelections && orderSelections.length > 0 ? (
              <>
                <div className="mb-2 text-sm text-gray-700">총 주문 수: {orderSelections.length}개</div>
                <div className="space-y-2">
                  {orderSelections.map((sel) => (
                    <div key={sel.id} className="flex justify-between items-center border-b py-2 text-sm">
                      <span className="font-medium">{sel.participant_name}</span>
                      <span>{Array.isArray((sel.menu_items as any)) ? (sel.menu_items as any)[0]?.name || "Unknown Item" : (sel.menu_items as any)?.name || "Unknown Item"}</span>
                      <span>×{sel.quantity}</span>
                      <span>{Array.isArray((sel.menu_items as any)) ? `₩${(sel.menu_items as any)[0]?.price?.toFixed(2) ?? "-"}` : `₩${(sel.menu_items as any)?.price?.toFixed(2) ?? "-"}`}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500">No orders submitted yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
