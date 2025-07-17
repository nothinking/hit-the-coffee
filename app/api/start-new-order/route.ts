import { NextRequest, NextResponse } from "next/server";
import { startNewOrder } from "@/app/shop/[shopId]/actions";

export async function POST(req: NextRequest) {
  const { shopId, title, expiresInMinutes } = await req.json();
  const result = await startNewOrder(shopId, title, expiresInMinutes);
  return NextResponse.json(result);
} 