import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { OrderSelectionForm } from "@/components/order-selection-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import OrderCountdownInfoWrapper from "@/components/order-countdown-info-wrapper";
import OrderSelectionDeleteButton from "@/components/OrderSelectionDeleteButton";
import { ReceiptPopup } from "@/components/receipt-popup";
import { ShareSessionButton } from "@/components/share-session-button";

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

  // 메뉴별로 합치기
  let mergedMenu: { name: string; price: number; quantity: number }[] = [];
  if (orderSelections && orderSelections.length > 0) {
    const merged: Record<string, { name: string; price: number; quantity: number }> = {};
    orderSelections.forEach(sel => {
      const menu = Array.isArray(sel.menu_items) ? sel.menu_items[0] : sel.menu_items;
      if (!menu) return;
      const key = `${menu.name}|${menu.price}`;
      if (!merged[key]) {
        merged[key] = { name: menu.name, price: menu.price, quantity: 0 };
      }
      merged[key].quantity += sel.quantity;
    });
    mergedMenu = Object.values(merged);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">{coffeeShop.name}에서 쏩니다</span>
            </div>

            <OrderCountdownInfoWrapper
              createdAt={order.created_at}
              expiresAt={order.expires_at}
              title={order.title}
              address={coffeeShop.address}
            />
            
            {/* Share Session Button */}
            <div className="mt-6">
              <ShareSessionButton 
                shareCode={shareCode}
                orderTitle={order.title}
                shopName={coffeeShop.name}
              />
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">주문 세션 활성화</span>
              </div>
            </CardHeader>
        <CardContent>
          <OrderSelectionForm
            orderId={order.id}
            menuItems={menuItems || []} // Pass empty array if no menu items
            orderStatus={order.status}
          />

          {/* Show saved order selections below the form */}
          <div className="mt-8">
            {/* 개별 주문리스트(참여자, 메뉴, 수량, 금액, 삭제) - 아래로 이동 */}
            {orderSelections && orderSelections.length > 0 && (
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-lg p-6 max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📋</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">주문 현황</h3>
                    <p className="text-sm text-gray-600">현재까지 주문된 메뉴들입니다</p>
                  </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[100px_1fr_60px_80px_50px] gap-x-4 font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-200">
                  <span className="text-sm">참여자</span>
                  <span className="text-sm">메뉴</span>
                  <span className="text-sm text-center">수량</span>
                  <span className="text-sm text-right">금액</span>
                  <span className="text-sm text-center">관리</span>
                </div>

                {/* Table Rows */}
                <div className="space-y-3">
                  {orderSelections.map((sel, index) => {
                    const menuItems = sel.menu_items as any;
                    const menuName = Array.isArray(menuItems) ? menuItems[0]?.name || "-" : menuItems?.name || "-";
                    const menuPrice = Array.isArray(menuItems) ? menuItems[0]?.price || 0 : menuItems?.price || 0;
                    
                    return (
                      <div key={sel.id} className="grid grid-cols-[100px_1fr_60px_80px_50px] gap-x-4 items-center py-3 px-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{sel.participant_name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-gray-900 truncate">{sel.participant_name}</span>
                        </div>
                        <span className="font-medium text-gray-800 truncate">{menuName}</span>
                        <span className="text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            {sel.quantity}
                          </span>
                        </span>
                        <span className="text-right font-semibold text-blue-600">
                          {menuPrice.toFixed(2)}
                        </span>
                        <div className="flex justify-center">
                          <OrderSelectionDeleteButton shopId={order.coffee_shop_id} selectionId={sel.id} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">총 주문 수량:</span>
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold">
                        {orderSelections.reduce((sum, sel) => sum + sel.quantity, 0)}개
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">총 금액:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {orderSelections.reduce((sum, sel) => {
                          const menuItems = sel.menu_items as any;
                          const price = Array.isArray(menuItems) ? menuItems[0]?.price || 0 : menuItems?.price || 0;
                          return sum + (price * sel.quantity);
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* 주문취합 보기 버튼 */}
                  <div className="text-center">
                    <ReceiptPopup 
                      mergedMenu={mergedMenu}
                      coffeeShopName={coffeeShop.name}
                      orderTitle={order.title}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </main>
  )
}
