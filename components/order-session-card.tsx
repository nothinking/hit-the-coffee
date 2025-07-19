"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { terminateOrder, deleteOrderSelection, deleteOrderSession } from "@/app/shop/[shopId]/actions"
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Trash2, MessageCircle } from "lucide-react" // Import icons
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useRouter } from "next/navigation"
import Link from "next/link";

interface OrderSessionCardProps {
  shopId: string
  order: {
    id: string
    share_code: string
    status: string
    created_at: string
    closed_at?: string | null
    title?: string // Added title to the interface
  }
  orderSelections: Array<{
    id: string
    participant_name: string
    quantity: number
    menu_item_id: string
    menu_items: { name: string; price: number } // Joined data
  }>
  onOrderDeleted?: () => void // 주문 삭제 후 콜백
}

export function OrderSessionCard({ shopId, order, orderSelections, onOrderDeleted }: OrderSessionCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loadingTerminate, setLoadingTerminate] = React.useState(false)
  const [loadingDeleteSelection, setLoadingDeleteSelection] = React.useState<string | null>(null) // Track loading for each selection
  const [loadingDelete, setLoadingDelete] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [orderLink, setOrderLink] = useState("");
  useEffect(() => {
    setOrderLink(`${window.location.origin}/order/${order.share_code}`);
  }, [order.share_code]);

  async function handleTerminate() {
    setLoadingTerminate(true)
    const result = await terminateOrder(shopId, order.id)
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
    setLoadingTerminate(false)
  }

  async function handleDeleteSelection(selectionId: string) {
    setLoadingDeleteSelection(selectionId)
    const result = await deleteOrderSelection(shopId, selectionId)
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
    setLoadingDeleteSelection(null)
  }

  async function handleDeleteSession() {
    if (!confirm("정말로 이 주문 세션을 삭제하시겠습니까?")) return;
    setLoadingDelete(true)
    const result = await deleteOrderSession(shopId, order.id)
    if (result.success) {
      toast({
        title: "주문 세션 삭제 완료",
        description: "주문 세션이 삭제되었습니다."
      })
      // 부모 컴포넌트에 삭제 완료 알림
      if (onOrderDeleted) {
        onOrderDeleted()
      }
    } else {
      toast({
        title: "주문 세션 삭제 실패",
        description: result.message,
        variant: "destructive"
      })
    }
    setLoadingDelete(false)
  }

  // Group selections by participant name
  const groupedSelections = orderSelections.reduce(
    (acc, selection) => {
      const name = selection.participant_name || "Anonymous"
      if (!acc[name]) {
        acc[name] = []
      }
      acc[name].push(selection)
      return acc
    },
    {} as Record<string, typeof orderSelections>,
  )

  const totalSelectionsCount = orderSelections.reduce((sum, sel) => sum + sel.quantity, 0)
  const totalOrderPrice = orderSelections.reduce((sum, sel) => sum + sel.quantity * sel.menu_items.price, 0)

  // 남은 시간 실시간 카운트다운
  const [remainingText, setRemainingText] = useState<string | null>(null);
  useEffect(() => {
    if (!(order as any).expires_at) return;
    let timer: NodeJS.Timeout;
    function updateRemaining() {
      const expiresAt = new Date((order as any).expires_at);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setRemainingText(`남은 시간: ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      } else {
        setRemainingText("만료됨");
      }
    }
    updateRemaining();
    timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [(order as any).expires_at]);

  let expiresAtText = null;
  if ((order as any).expires_at) {
    const expiresAt = new Date((order as any).expires_at);
    expiresAtText = `만료 시각: ${expiresAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/\./g, "-")}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link href={orderLink} className="hover:underline">
            {order.title ? (
              <span>{order.title}</span>
            ) : (
              <span>Order Code: {order.share_code}</span>
            )}
          </Link>
          {order.status === "open" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto"
            onClick={handleDeleteSession}
            disabled={loadingDelete}
          >
            {loadingDelete ? "Deleting..." : "Delete"}
          </Button>
        </CardTitle>
        <CardDescription>
          Created: {new Date(order.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
          {order.closed_at && ` | Closed: ${new Date(order.closed_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`}
          {remainingText && (
            <span className="ml-2 font-semibold text-orange-600">{remainingText}</span>
          )}
          {expiresAtText && (
            <span className="ml-2 text-xs text-gray-500">{expiresAtText}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`order-link-${order.id}`}>Share Link</Label>
          <div className="flex items-center space-x-2">
            <Input id={`order-link-${order.id}`} value={orderLink} readOnly />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(orderLink)
                toast({ title: "Copied!", description: "Order link copied to clipboard." })
              }}
            >
              Copy
            </Button>
          </div>
        </div>
        {order.status === "open" && (
          <Button variant="destructive" className="w-full" onClick={handleTerminate} disabled={loadingTerminate}>
            {loadingTerminate ? "중지 중..." : "중지"}
          </Button>
        )}

        {/* Order Selections Section */}
        {orderSelections.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2 mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-4">
                <span className="font-semibold">
                  View Selections ({totalSelectionsCount} items, {totalOrderPrice.toFixed(2)})
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 p-2 border rounded-md bg-gray-50">
              {Object.entries(groupedSelections).map(([participantName, selections]) => (
                <div key={participantName} className="border-b pb-2 last:border-b-0 last:pb-0">
                  <h4 className="font-bold text-md mb-2">{participantName}</h4>
                  <ul className="space-y-1">
                    {selections.map((selection) => (
                      <li key={selection.id} className="flex justify-between items-center text-sm">
                        <span>
                          {selection.quantity}x {selection.menu_items.name} ({selection.menu_items.price.toFixed(2)}{" "}
                          each)
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSelection(selection.id)}
                          disabled={loadingDeleteSelection === selection.id}
                          className="h-6 w-6"
                        >
                          {loadingDeleteSelection === selection.id ? (
                            <span className="animate-spin">...</span>
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                          <span className="sr-only">Delete selection</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}
