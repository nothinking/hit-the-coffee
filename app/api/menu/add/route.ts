import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { shopId, menus } = await req.json();
    if (!shopId || !Array.isArray(menus)) {
      return NextResponse.json({ success: false, message: "shopId와 menus가 필요합니다." }, { status: 400 });
    }
    // menus: [{ name, price }]
    const inserts = menus.map((menu: any) => ({
      coffee_shop_id: shopId,
      name: menu.name,
      price: menu.price ?? null,
    }));
    const { error } = await supabase.from("menu_items").insert(inserts);
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "메뉴 등록 실패" }, { status: 500 });
  }
} 