"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/lib/supabase-server"

/**
 * Creates menu snapshots for an existing order session
 */
export async function createMenuSnapshotsForOrder(orderId: string) {
  try {
    const supabase = await createSupabaseServer()

    // Check if snapshots already exist
    const { data: existingSnapshots } = await supabase
      .from("order_menu_snapshots")
      .select("id")
      .eq("order_id", orderId)

    if (existingSnapshots && existingSnapshots.length > 0) {
      return { success: true, message: "Snapshots already exist" }
    }

    // Get order details to find coffee shop
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("coffee_shop_id")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return { success: false, message: "Order not found" }
    }

    // Get current menu items for the shop
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, description, price")
      .eq("coffee_shop_id", order.coffee_shop_id)

    if (menuError) {
      return { success: false, message: menuError.message }
    }

    if (!menuItems || menuItems.length === 0) {
      return { success: false, message: "No menu items found" }
    }

    // Create snapshots
    const snapshots = menuItems.map(item => ({
      order_id: orderId,
      original_menu_item_id: item.id,
      name: item.name,
      description: item.description,
      price: item.price
    }))

    const { error: insertError } = await supabase
      .from("order_menu_snapshots")
      .insert(snapshots)

    if (insertError) {
      return { success: false, message: insertError.message }
    }

    return { success: true, message: "Menu snapshots created successfully" }
  } catch (error: any) {
    console.error("Error creating menu snapshots:", error)
    return { success: false, message: error.message || "Unknown error" }
  }
}

/**
 * Saves the participant's menu selections.
 * The first argument (`_prevState`) is required when the action is used
 * with React's `useActionState`.
 */
export async function submitOrderSelections(
  _prevState: unknown,
  orderId: string,
  participantName: string,
  selectionsInput: unknown, // renamed for clarity
) {
  try {
    const selections = Array.isArray(selectionsInput)
      ? (selectionsInput as Array<{ itemId: string; quantity: number }>)
      : []

    /* Guard against empty or invalid payloads */
    if (selections.length === 0) {
      return {
        success: false,
        message: "No menu items were received. Please pick at least one item before submitting.",
      }
    }

    /* ------------------------------------------------------------------ */
    const supabase = await createSupabaseServer()

    /* 1. Make sure the order session is still open. */
    const { data: order, error: orderError } = await supabase.from("orders").select("status, coffee_shop_id").eq("id", orderId).single()

    if (orderError || !order) {
      console.error("Error fetching order status:", orderError)
      return { success: false, message: "Order not found or inaccessible." }
    }
    if (order.status === "closed") {
      return { success: false, message: "This order session is closed. You can no longer submit selections." }
    }

    /* 2. Get snapshot IDs for the selected menu items */
    const { data: snapshots, error: snapshotError } = await supabase
      .from("order_menu_snapshots")
      .select("id, original_menu_item_id")
      .eq("order_id", orderId)
      .in("original_menu_item_id", selections.map(s => s.itemId))

    if (snapshotError) {
      console.error("Error fetching snapshots:", snapshotError)
      return { success: false, message: "Error fetching menu snapshots." }
    }

    /* 3. Prepare rows to insert into `order_selections`. */
    const rows = selections.map(({ itemId, quantity }) => {
      const snapshot = snapshots?.find(s => s.original_menu_item_id === itemId)
      return {
        order_id: orderId,
        menu_item_id: null, // Don't use menu_item_id for snapshots
        snapshot_id: snapshot?.id || itemId,  // Use snapshot ID if available, fallback to itemId
        quantity,
        participant_name: participantName,
      }
    })

    /* 4. Insert rows. */
    const { error: insertError } = await supabase.from("order_selections").insert(rows)
    if (insertError) {
      console.error("Error inserting selections:", insertError)
      return { success: false, message: insertError.message }
    }

    /* 5. Revalidate any pages that show this data. */
    revalidatePath(`/shop/${order.coffee_shop_id}`) // Revalidate the specific shop page
    revalidatePath(`/order/${orderId}`) // Revalidate the order page itself (though not strictly needed for this action)

    return { success: true, message: "Your selections have been submitted!" }
  } catch (error: any) {
    console.error("An unexpected error occurred in submitOrderSelections:", error)
    return { success: false, message: `An unexpected error occurred: ${error.message || String(error)}` }
  }
}
