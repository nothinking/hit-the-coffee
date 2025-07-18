import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { shopId, address } = await req.json();
    
    if (!shopId) {
      return NextResponse.json({ 
        success: false, 
        message: "매장 ID가 필요합니다." 
      });
    }

    const supabase = await createSupabaseServer();

    // Update the temporary shop to permanent
    const { data: shop, error: shopError } = await supabase
      .from("coffee_shops")
      .update({
        is_temporary: false,
        address: address || null
      })
      .eq("id", shopId)
      .select()
      .single();

    if (shopError) {
      console.error("Error converting temporary shop:", shopError);
      return NextResponse.json({ 
        success: false, 
        message: shopError.message 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "매장이 정식 등록되었습니다!", 
      shop 
    });

  } catch (error) {
    console.error("Convert temporary shop error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
} 