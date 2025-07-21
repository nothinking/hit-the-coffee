import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { OrderSelectionForm } from "@/components/order-selection-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import OrderCountdownInfoWrapper from "@/components/order-countdown-info-wrapper";
import OrderSelectionDeleteButton from "@/components/OrderSelectionDeleteButton";
import { ReceiptPopup } from "@/components/receipt-popup";
import { ShareSessionButton } from "@/components/share-session-button";

import { RefreshOrderButton } from "@/components/refresh-order-button";
import { AutoRefreshWrapper } from "@/components/auto-refresh-wrapper";


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

  // 2. Fetch the coffee shop details associated with this order (if exists)
  let coffeeShop = null;
  if (order.coffee_shop_id) {
    const { data: shop, error: shopError } = await supabase
      .from("coffee_shops")
      .select("*")
      .eq("id", order.coffee_shop_id)
      .single()

    if (shopError) {
      console.error("Error fetching coffee shop for order:", shopError)
      // Continue without shop - this is valid for orders without shops
    } else {
      coffeeShop = shop;
    }
  }

  // 3. Fetch the menu items from snapshots for this order (preserves menu state at creation time)
  let { data: menuItems, error: menuError } = await supabase
    .from("order_menu_snapshots")
    .select("id, name, description, price, original_menu_item_id")
    .eq("order_id", order.id)
    .order("name", { ascending: true })

  // If no snapshots exist, try to create them
  if (menuError || !menuItems || menuItems.length === 0) {
    console.log("No snapshots found, trying to create them")
    
    // Import the function dynamically since this is a server component
    const { createMenuSnapshotsForOrder } = await import("./actions")
    const result = await createMenuSnapshotsForOrder(order.id)
    
    if (result.success) {
      console.log("Created menu snapshots successfully")
      // Fetch the newly created snapshots
      const { data: newSnapshots } = await supabase
        .from("order_menu_snapshots")
        .select("id, name, description, price, original_menu_item_id")
        .eq("order_id", order.id)
        .order("name", { ascending: true })
      
      menuItems = newSnapshots || []
    } else {
      console.log("Failed to create snapshots, trying to get from existing selections")
      
      // Try to get menu items from existing order selections
      const { data: existingSelections, error: selectionsError } = await supabase
        .from("order_selections")
        .select(`
          menu_item_id,
          menu_items (
            id, name, description, price
          )
        `)
        .eq("order_id", order.id)
      
      if (!selectionsError && existingSelections && existingSelections.length > 0) {
        // Create snapshots from existing selections
        const snapshots = existingSelections
          .filter(sel => sel.menu_items)
          .map(sel => ({
            order_id: order.id,
            original_menu_item_id: sel.menu_item_id,
            name: (sel.menu_items as any).name,
            description: (sel.menu_items as any).description,
            price: (sel.menu_items as any).price
          }))
        
        if (snapshots.length > 0) {
          const { error: insertError } = await supabase
            .from("order_menu_snapshots")
            .insert(snapshots)
          
          if (!insertError) {
            console.log("Created snapshots from existing selections")
            // Fetch the newly created snapshots
            const { data: newSnapshots } = await supabase
              .from("order_menu_snapshots")
              .select("id, name, description, price, original_menu_item_id")
              .eq("order_id", order.id)
              .order("name", { ascending: true })
            
            menuItems = newSnapshots || []
          }
        }
      }
      
      // If still no menu items, fallback to current menu items (for backward compatibility)
      if (!menuItems || menuItems.length === 0) {
        console.log("Still no snapshots, falling back to current menu items")
        if (coffeeShop) {
          const { data: currentMenuItems, error: currentMenuError } = await supabase
            .from("menu_items")
            .select("id, name, description, price")
            .eq("coffee_shop_id", coffeeShop.id)
            .order("name", { ascending: true })
          
          if (currentMenuError) {
            console.error("Error fetching current menu items:", currentMenuError)
          } else {
            // Add original_menu_item_id to match snapshot format
            menuItems = currentMenuItems?.map(item => ({
              ...item,
              original_menu_item_id: item.id
            })) || []
          }
        } else {
          console.log("No coffee shop associated with this order")
        }
      }
    }
  }

  // 4. Fetch order selections for this order, joined with snapshots
  let { data: orderSelections, error: selectionsError } = await supabase
    .from("order_selections")
    .select(`id, participant_name, quantity, snapshot_id, order_menu_snapshots ( name, price )`)
    .eq("order_id", order.id)
    .order("created_at", { ascending: true })

  // If no snapshots are used, try to get order selections with menu_items
  if (selectionsError || !orderSelections || orderSelections.length === 0) {
    console.log("No snapshots found for selections, trying to get with menu_items")
    
    // Get order selections with menu_items
    const { data: fallbackSelections, error: fallbackError } = await supabase
      .from("order_selections")
      .select(`id, participant_name, quantity, menu_item_id, menu_items ( name, price )`)
      .eq("order_id", order.id)
      .order("created_at", { ascending: true })
    
    if (fallbackError) {
      console.error("Error fetching fallback selections:", fallbackError)
    } else if (fallbackSelections && fallbackSelections.length > 0) {
      // Transform fallback data to match snapshot format
      orderSelections = fallbackSelections?.map(selection => ({
        ...selection,
        snapshot_id: selection.menu_item_id,
        order_menu_snapshots: selection.menu_items
      })) || []
    }
  }

  if (selectionsError) {
    console.error("Error fetching order selections:", selectionsError)
    // Continue rendering, but orderSelections will be null or empty
  }

  // 메뉴별로 합치기
  let mergedMenu: { name: string; price: number; quantity: number }[] = [];
  if (orderSelections && orderSelections.length > 0) {
    const merged: Record<string, { name: string; price: number; quantity: number }> = {};
    orderSelections.forEach(sel => {
      // Handle both snapshot and fallback data
      const menu = Array.isArray((sel as any).order_menu_snapshots) ? (sel as any).order_menu_snapshots[0] : 
                   (sel as any).order_menu_snapshots || (sel as any).menu_items;
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
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">
                {coffeeShop ? `${coffeeShop.name}에서 쏩니다` : '빠른 주문 세션'}
              </span>
            </div>

            <OrderCountdownInfoWrapper
              createdAt={order.created_at}
              expiresAt={order.expires_at}
              title={order.title}
              address={coffeeShop?.address}
            />
            
            {/* Share Session Button */}
            <div className="mt-6">
                          <ShareSessionButton 
              shareCode={shareCode}
              orderTitle={order.title}
              shopName={coffeeShop?.name || '빠른 주문'}
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
                {/* 주문현황 섹션 - 항상 표시 */}
                <AutoRefreshWrapper intervalMs={3000}>
                  <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-lg p-4 sm:p-6 max-w-2xl mx-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-bold">📋</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">주문 현황</h3>
                        <p className="text-xs sm:text-sm text-gray-600">현재까지 주문된 메뉴들입니다</p>
                      </div>
                    </div>
                    <RefreshOrderButton />
                  </div>

                  {/* 개별 주문리스트(참여자, 메뉴, 수량, 금액, 삭제) */}
                  {orderSelections && orderSelections.length > 0 ? (
                    <>
                      {/* Table Header */}
                      <div className="hidden md:grid md:grid-cols-[100px_1fr_60px_50px] gap-x-4 font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-200">
                        <span className="text-sm">참여자</span>
                        <span className="text-sm">메뉴</span>
                        <span className="text-sm text-center">수량</span>
                        <span className="text-sm text-center">관리</span>
                      </div>

                      {/* Table Rows */}
                      <div className="space-y-3">
                        {orderSelections.map((sel, index) => {
                          // Handle both snapshot and fallback data
                          const menuItems = (sel as any).order_menu_snapshots || (sel as any).menu_items;
                          const menuName = Array.isArray(menuItems) ? menuItems[0]?.name || "-" : menuItems?.name || "-";
                          const menuPrice = Array.isArray(menuItems) ? menuItems[0]?.price || 0 : menuItems?.price || 0;
                          
                          return (
                            <div key={sel.id}>
                              {/* Desktop View */}
                              <div className="hidden md:grid md:grid-cols-[100px_1fr_60px_50px] gap-x-4 items-center py-3 px-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200">
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
                                <div className="flex justify-center">
                                  <OrderSelectionDeleteButton shopId={order.coffee_shop_id} selectionId={sel.id} />
                                </div>
                              </div>

                              {/* Mobile View */}
                              <div className="md:hidden bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">{sel.participant_name.charAt(0)}</span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{sel.participant_name}</div>
                                      <div className="text-sm text-gray-600">{menuName}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className="text-sm text-gray-500">수량: {sel.quantity}</div>
                                    </div>
                                    <OrderSelectionDeleteButton shopId={order.coffee_shop_id} selectionId={sel.id} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-center mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">총 주문 수량:</span>
                            <span className="inline-flex items-center justify-center px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold">
                              {orderSelections.reduce((sum, sel) => sum + sel.quantity, 0)}개
                            </span>
                          </div>
                        </div>
                        
                        {/* 주문취합 보기 버튼 */}
                        <div className="text-center">
                          <ReceiptPopup 
                            mergedMenu={mergedMenu}
                            coffeeShopName={coffeeShop?.name || '빠른 주문'}
                            orderTitle={order.title}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* 주문이 없을 때 표시할 내용 */
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-gray-500">아직 주문이 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">새로고침 버튼을 눌러 최신 주문현황을 확인하세요</p>
                    </div>
                  )}
                  </div>
                </AutoRefreshWrapper>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
