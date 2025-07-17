"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/lib/supabase-server"

// Helper to generate a unique short code for order links
function generateShareCode(length = 6): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export async function addMenuItem(shopId: string, formData: FormData) {
  const supabase = await createSupabaseServer()
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = Number.parseFloat(formData.get("price") as string)

  if (!name || !price) {
    return { success: false, message: "Name and Price are required." }
  }
  if (isNaN(price) || price <= 0) {
    return { success: false, message: "Price must be a positive number." }
  }

  const { error } = await supabase.from("menu_items").insert({
    coffee_shop_id: shopId,
    name,
    description,
    price,
  })

  if (error) {
    console.error("Error adding menu item:", error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/shop/${shopId}`)
  return { success: true, message: "Menu item added successfully!" }
}

export async function deleteMenuItem(shopId: string, itemId: string) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.from("menu_items").delete().eq("id", itemId)

  if (error) {
    console.error("Error deleting menu item:", error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/shop/${shopId}`)
  return { success: true, message: "Menu item deleted successfully!" }
}

export async function startNewOrder(shopId: string, title?: string, expiresInMinutes?: number) {
  const supabase = await createSupabaseServer()
  let shareCode = ""
  let isUnique = false
  let attempts = 0

  // Generate a unique short code, retry if collision (unlikely for short codes)
  while (!isUnique && attempts < 5) {
    shareCode = generateShareCode()
    const { data, error } = await supabase.from("orders").select("id").eq("share_code", shareCode)
    if (error) {
      console.error("Error checking share code uniqueness:", error)
      return { success: false, message: error.message }
    }
    if (!data || data.length === 0) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique) {
    return { success: false, message: "Could not generate a unique share code after multiple attempts." }
  }

  // expires_at 계산
  let expires_at = null;
  let minutes = (typeof expiresInMinutes === "number" && expiresInMinutes > 0)
    ? expiresInMinutes
    : 30;
  expires_at = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      coffee_shop_id: shopId,
      share_code: shareCode,
      status: "open",
      title: title ?? null,
      expires_at,
    })
    .select()
    .single()

  if (error) {
    console.error("Error starting new order:", error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/shop/${shopId}`)
  return { success: true, message: "New order started!", shareCode: data.share_code }
}

export async function terminateOrder(shopId: string, orderId: string) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase
    .from("orders")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) {
    console.error("Error terminating order:", error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/shop/${shopId}`)
  return { success: true, message: "Order terminated successfully!" }
}

export async function deleteOrderSelection(shopId: string, selectionId: string) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.from("order_selections").delete().eq("id", selectionId)

  if (error) {
    console.error("Error deleting order selection:", error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/shop/${shopId}`) // Revalidate the shop page to reflect changes
  return { success: true, message: "Order selection deleted successfully!" }
}

export async function deleteOrderSession(shopId: string, orderId: string) {
  const supabase = await createSupabaseServer()
  const { error } = await supabase.from("orders").delete().eq("id", orderId)
  if (error) {
    console.error("Error deleting order session:", error)
    return { success: false, message: error.message }
  }
  revalidatePath(`/shop/${shopId}`)
  return { success: true, message: "Order session deleted successfully!" }
}

export async function deleteShop(shopId: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("coffee_shops").delete().eq("id", shopId);
  if (error) {
    console.error("Error deleting shop:", error);
    return { success: false, message: error.message };
  }
  revalidatePath("/shops");
  return { success: true, message: "Shop deleted successfully!" };
}
