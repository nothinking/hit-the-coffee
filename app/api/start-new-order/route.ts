import { NextRequest, NextResponse } from "next/server";
import { startNewOrder } from "@/app/shop/[shopId]/actions";

export async function POST(req: NextRequest) {
  const { shopId, title } = await req.json();
  const result = await startNewOrder(shopId, title);
  return NextResponse.json(result);
} 