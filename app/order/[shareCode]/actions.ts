"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/lib/supabase-server"

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
    const { data: order, error: orderError } = await supabase.from("orders").select("status").eq("id", orderId).single()

    if (orderError || !order) {
      console.error("Error fetching order status:", orderError)
      return { success: false, message: "Order not found or inaccessible." }
    }
    if (order.status === "closed") {
      return { success: false, message: "This order session is closed. You can no longer submit selections." }
    }

    /* 2. Prepare rows to insert into `order_selections`. */
    const rows = selections.map(({ itemId, quantity }) => ({
      order_id: orderId,
      menu_item_id: itemId,
      quantity,
      participant_name: participantName,
    }))

    /* 3. Insert rows. */
    const { error: insertError } = await supabase.from("order_selections").insert(rows)
    if (insertError) {
      console.error("Error inserting selections:", insertError)
      return { success: false, message: insertError.message }
    }

    /* 4. Revalidate any pages that show this data. */
    revalidatePath(`/shop/${order.coffee_shop_id}`) // Revalidate the specific shop page
    revalidatePath(`/order/${orderId}`) // Revalidate the order page itself (though not strictly needed for this action)

    return { success: true, message: "Your selections have been submitted!" }
  } catch (error: any) {
    console.error("An unexpected error occurred in submitOrderSelections:", error)
    return { success: false, message: `An unexpected error occurred: ${error.message || String(error)}` }
  }
}
