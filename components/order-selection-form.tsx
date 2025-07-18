"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { submitOrderSelections } from "@/app/order/[shareCode]/actions"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
}

interface OrderSelectionFormProps {
  orderId: string
  menuItems: MenuItem[]
  orderStatus: string
}

export function OrderSelectionForm({ orderId, menuItems, orderStatus }: OrderSelectionFormProps) {
  const { toast } = useToast()

  /* UI state */
  const [participantName, setParticipantName] = useState("")
  const [selected, setSelected] = useState<Record<string, number>>({}) // itemId → qty
  const [isPending, startTransition] = useTransition() // isPending tracks the transition status
  const [showNamePopup, setShowNamePopup] = useState(false)

  const orderClosed = orderStatus === "closed"

  /* Helpers -------------------------------------------------------------- */
  const toggleItem = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev }
      checked ? (next[id] = 1) : delete next[id]
      return next
    })

  const setQty = (id: string, qty: number) =>
    setSelected((prev) => {
      const next = { ...prev }
      qty > 0 ? (next[id] = qty) : delete next[id]
      return next
    })

  /* Submit ---------------------------------------------------------------- */
  function handleOrderButtonClick() {
    const selections = Object.entries(selected).map(([itemId, quantity]) => ({ itemId, quantity }))
    if (selections.length === 0) {
      toast({ title: "No items selected", description: "Choose at least one menu item.", variant: "destructive" })
      return
    }
    setShowNamePopup(true)
  }

  async function handleSubmitOrder() {
    if (!participantName.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" })
      return
    }

    const selections = Object.entries(selected).map(([itemId, quantity]) => ({ itemId, quantity }))
    
    console.log("4. Starting transition for submitOrderSelections...")
    startTransition(async () => {
      console.log("5. Inside startTransition. Calling submitOrderSelections...");
      try {
        const result = await submitOrderSelections(null, orderId, participantName.trim(), selections);
        console.log("6. submitOrderSelections returned:", result);

        if (result && result.success) {
          toast({ title: "Order submitted!", description: result.message });
          setSelected({}); // 체크내역 리셋
          setParticipantName(""); // 이름 입력란도 리셋
          setShowNamePopup(false); // 팝업 닫기
        } else {
          toast({
            title: "Submission failed",
            description: result?.message ?? "Unknown error",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error in submitOrderSelections:", error);
        toast({
          title: "Submission failed",
          description: "An error occurred while submitting your order.",
          variant: "destructive",
        });
      }
      console.log("7. Finished inside startTransition.");
    });
    console.log("8. handleSubmit finished (outside startTransition).")
  }

  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {orderClosed ? (
        <div className="flex flex-col items-center justify-center py-8">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#FFD600"/>
            <path d="M40 20 L44 36 L60 36 L46 44 L50 60 L40 50 L30 60 L34 44 L20 36 L36 36 Z" fill="#FF5252"/>
            <text x="40" y="75" textAnchor="middle" fontSize="18" fill="#333" fontWeight="bold">끝!</text>
          </svg>
          <div className="mt-4 text-lg font-bold text-red-600">주문이 마감되었습니다!</div>
        </div>
      ) : (
        <>
          {/* Menu list ---------------------------------------------------- */}
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">메뉴를 골라보세요! 🍽️</h3>
              <p className="text-gray-600">원하는 메뉴를 체크하고 수량을 선택하세요</p>
            </div>
            {menuItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">☕</div>
                <p className="text-gray-500 text-lg">메뉴가 준비 중입니다...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {menuItems.map((item) => (
                  <Card key={item.id} className="flex items-center justify-between p-4 hover:shadow-md transition-all duration-200 border-2 hover:border-blue-200">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={item.id in selected}
                        onCheckedChange={(c) => toggleItem(item.id, c as boolean)}
                        disabled={isPending}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div className="leading-tight">
                        <Label htmlFor={`item-${item.id}`} className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors">
                          {item.name}
                        </Label>
                        {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-blue-600">{item.price.toFixed(2)}</span>
                      {item.id in selected && (
                        <Input
                          type="number"
                          min={1}
                          value={selected[item.id]}
                          onChange={(e) => setQty(item.id, Number(e.target.value))}
                          className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
                          disabled={isPending}
                        />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submit -------------------------------------------------------- */}
          <div className="mt-8">
            <Button 
              onClick={handleOrderButtonClick}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={isPending || menuItems.length === 0}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  주문 처리 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>🎯</span>
                  주문하기!
                </div>
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-2">
              버튼을 누르면 이름을 입력할 수 있어요
            </p>
          </div>
        </>
      )}

      {/* Name Input Popup */}
      {showNamePopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border-0">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">이름을 알려주세요!</h3>
              <p className="text-gray-600">주문에 사용할 이름을 입력해주세요</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="popup-participant-name" className="text-sm font-medium text-gray-700 mb-2 block">
                  이름
                </Label>
                <Input
                  id="popup-participant-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSubmitOrder()
                    }
                  }}
                  placeholder="예: 김철수"
                  autoFocus
                  disabled={isPending}
                  className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleSubmitOrder}
                  className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      주문 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>🚀</span>
                      주문 완료!
                    </div>
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    setShowNamePopup(false)
                    setParticipantName("")
                  }}
                  variant="outline"
                  className="flex-1 h-12 text-lg"
                  disabled={isPending}
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
