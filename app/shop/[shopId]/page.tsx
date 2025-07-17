import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MenuItemForm } from "@/components/menu-item-form"
import { MenuItemCard } from "@/components/menu-item-card"
import { OrderSessionCard } from "@/components/order-session-card"
import { startNewOrder } from "./actions"
import { useState } from "react"
import { StartNewOrderForm } from "@/components/start-new-order-form"

interface CoffeeShopDetailPageProps {
  params: {
    shopId: string
  }
}

export default async function CoffeeShopDetailPage({ params }: CoffeeShopDetailPageProps) {
  const { shopId } = await params
  const supabase = await createSupabaseServer()

  // Fetch coffee shop details
  const { data: coffeeShop, error: shopError } = await supabase
    .from("coffee_shops")
    .select("*")
    .eq("id", shopId)
    .single()

  if (shopError || !coffeeShop) {
    console.error("Error fetching coffee shop:", shopError)
    notFound() // Or render a specific error message
  }

  // Fetch menu items for the shop
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("coffee_shop_id", shopId)
    .order("name", { ascending: true })

  if (menuError) {
    console.error("Error fetching menu items:", menuError)
    // Handle error gracefully, perhaps show an empty list or error message
  }

  // Fetch active and closed order sessions for the shop
  // Also fetch related order_selections and join with menu_items to get names/prices
  const { data: orderSessions, error: orderError } = await supabase
    .from("orders")
    .select(
      `
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
    `,
    )
    .eq("coffee_shop_id", shopId)
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "order_selections", ascending: true }) // Order selections within each order

  if (orderError) {
    console.error("Error fetching order sessions:", orderError)
    // Handle error gracefully
  }

  return (
    <main className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">{coffeeShop.name}</h1>
        <p className="text-lg text-gray-600">{coffeeShop.address}</p>
      </div>

      {/* Menu Management Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Menu Item</CardTitle>
          </CardHeader>
          <CardContent>
            <MenuItemForm shopId={shopId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Menu Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {menuItems && menuItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {menuItems.map((item) => (
                  <MenuItemCard key={item.id} shopId={shopId} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No menu items added yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Order Sessions Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Order Sessions</h2>
          <StartNewOrderForm shopId={shopId} />
        </div>

        {orderSessions && orderSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderSessions.map((order) => (
              <OrderSessionCard
                key={order.id}
                shopId={shopId}
                order={order}
                orderSelections={order.order_selections || []}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No order sessions started yet.</p>
        )}
      </section>
    </main>
  )
}
