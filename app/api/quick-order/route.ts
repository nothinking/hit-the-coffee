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
    
    if (!menus || menus.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "메뉴 정보가 필요합니다." 
      });
    }

    const supabase = await createSupabaseServer();

    let shop = null;
    let shopId = null;

    // 1. Create coffee shop only if shopName is provided
    if (shopName && shopName.trim()) {
      const { data: createdShop, error: shopError } = await supabase
        .from("coffee_shops")
        .insert({
          name: shopName.trim(),
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

      shop = createdShop;
      shopId = shop.id;
    }

    let insertedMenuItems = null;

    // 2. Add menu items only if shop was created
    if (shopId) {
      const menuItems = menus.map((menu: any) => ({
        coffee_shop_id: shopId,
        name: menu.name,
        description: menu.description || null,
        price: parseFloat(menu.price) || 0
      }));

      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .insert(menuItems)
        .select();

      if (menuError) {
        console.error("Error adding menu items:", menuError);
        // Continue anyway, the order can still be created
      } else {
        insertedMenuItems = menuData;
      }
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
    console.log("Creating order with shopId:", shopId);
    
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        coffee_shop_id: shopId, // null if no shop was created
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

    console.log("Order created successfully:", order.id);

    // 6. Create menu snapshots for this order to preserve menu state
    // If shop was created, use menu items from database
    // If no shop was created, create snapshots directly from input menus
    if (insertedMenuItems && insertedMenuItems.length > 0) {
      // Shop was created, use menu items from database
      const snapshots = insertedMenuItems.map((item: any) => ({
        order_id: order.id,
        original_menu_item_id: item.id,
        name: item.name,
        description: item.description || null,
        price: item.price
      }));

      const { error: snapshotError } = await supabase
        .from("order_menu_snapshots")
        .insert(snapshots);

      if (snapshotError) {
        console.error("Error creating menu snapshots:", snapshotError);
        // Continue anyway, the order was created successfully
      }
    } else {
      // No shop was created, create snapshots directly from input menus
      console.log("Creating snapshots directly from input menus:", menus.length, "items");
      
      const snapshots = menus.map((menu: any) => ({
        order_id: order.id,
        original_menu_item_id: null, // No original menu item since no shop was created
        name: menu.name,
        description: menu.description || null,
        price: parseFloat(menu.price) || 0
      }));

      console.log("Snapshots to insert:", snapshots);

      const { error: snapshotError } = await supabase
        .from("order_menu_snapshots")
        .insert(snapshots);

      if (snapshotError) {
        console.error("Error creating menu snapshots:", snapshotError);
        // Continue anyway, the order was created successfully
      } else {
        console.log("Successfully created snapshots from input menus");
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Quick order created successfully!", 
      shareCode: order.share_code,
      shopId: shopId // null if no shop was created
    });

  } catch (error) {
    console.error("Quick order creation error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
} 