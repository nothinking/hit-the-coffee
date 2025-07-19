import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

// Helper to generate a unique short code for order links
function generateShareCode(length = 6): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const { shopName, title, expiresInMinutes, menus } = await req.json();
    
    if (!shopName || !menus || menus.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "매장 이름과 메뉴 정보가 필요합니다." 
      });
    }

    const supabase = await createSupabaseServer();

    // 1. Create coffee shop
    const { data: shop, error: shopError } = await supabase
      .from("coffee_shops")
      .insert({
        name: shopName,
        address: null
      })
      .select()
      .single();

    if (shopError) {
      console.error("Error creating shop:", shopError);
      return NextResponse.json({ 
        success: false, 
        message: shopError.message 
      });
    }

    // 2. Add menu items
    const menuItems = menus.map((menu: any) => ({
      coffee_shop_id: shop.id,
      name: menu.name,
      description: menu.description || null,
      price: parseFloat(menu.price) || 0
    }));

    const { error: menuError } = await supabase
      .from("menu_items")
      .insert(menuItems);

    if (menuError) {
      console.error("Error adding menu items:", menuError);
      // Continue anyway, the shop and order can still be created
    }

    // 3. Generate unique share code
    let shareCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      shareCode = generateShareCode();
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .eq("share_code", shareCode);
      
      if (error) {
        console.error("Error checking share code uniqueness:", error);
        return NextResponse.json({ 
          success: false, 
          message: error.message 
        });
      }
      
      if (!data || data.length === 0) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ 
        success: false, 
        message: "Could not generate a unique share code after multiple attempts." 
      });
    }

    // 4. Calculate expires_at
    let expires_at = null;
    let minutes = (typeof expiresInMinutes === "number" && expiresInMinutes > 0)
      ? expiresInMinutes
      : 30;
    expires_at = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    // 5. Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        coffee_shop_id: shop.id,
        share_code: shareCode,
        status: "open",
        title: title || null,
        expires_at,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json({ 
        success: false, 
        message: orderError.message 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Quick order created successfully!", 
      shareCode: order.share_code,
      shopId: shop.id
    });

  } catch (error) {
    console.error("Quick order creation error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
} 