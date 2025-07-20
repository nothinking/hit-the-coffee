"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { submitOrderSelections } from "@/app/order/[shareCode]/actions"
import { X } from "lucide-react"
import { createPortal } from "react-dom"
import { formatPrice } from "@/lib/utils"

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
  const [selected, setSelected] = useState<Record<string, boolean>>({}) // itemId → selected
  const [isPending, startTransition] = useTransition() // isPending tracks the transition status
  const [showMenuPopup, setShowMenuPopup] = useState(false)
  const [showNamePopup, setShowNamePopup] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showMenuPopup) {
          setShowMenuPopup(false)
        } else if (showNamePopup) {
          setShowNamePopup(false)
          setParticipantName("")
        }
      }
    }

    if (showMenuPopup || showNamePopup) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showMenuPopup, showNamePopup])

  const orderClosed = orderStatus === "closed"

  /* Helpers -------------------------------------------------------------- */
  const toggleItem = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev }
      checked ? (next[id] = true) : delete next[id]
      return next
    })

  /* Submit ---------------------------------------------------------------- */
  function handleOrderButtonClick() {
    const selectedItems = Object.keys(selected).filter(id => selected[id])
    if (selectedItems.length === 0) {
      toast({ title: "메뉴를 선택해주세요", description: "최소 하나의 메뉴를 선택해야 합니다.", variant: "destructive" })
      return
    }
    setShowNamePopup(true)
  }

  async function handleSubmitOrder() {
    if (!participantName.trim()) {
      toast({ title: "이름을 입력해주세요", description: "이름을 입력해주세요.", variant: "destructive" })
      return
    }

    const selections = Object.keys(selected)
      .filter(id => selected[id])
      .map(itemId => ({ itemId, quantity: 1 })) // Always quantity 1
    
    console.log("4. Starting transition for submitOrderSelections...")
    startTransition(async () => {
      console.log("5. Inside startTransition. Calling submitOrderSelections...");
      try {
        const result = await submitOrderSelections(null, orderId, participantName.trim(), selections);
        console.log("6. submitOrderSelections returned:", result);

        if (result && result.success) {
          toast({ title: "주문 완료!", description: result.message });
          setSelected({}); // 체크내역 리셋
          setParticipantName(""); // 이름 입력란도 리셋
          setShowNamePopup(false); // 팝업 닫기
          setShowMenuPopup(false); // 메뉴 팝업도 닫기
        } else {
          toast({
            title: "주문 실패",
            description: result?.message ?? "알 수 없는 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error in submitOrderSelections:", error);
        toast({
          title: "주문 실패",
          description: "주문 처리 중 오류가 발생했습니다.",
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
          {/* Order Button */}
          <div className="text-center">
            <Button 
              onClick={() => setShowMenuPopup(true)}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={isPending || menuItems.length === 0}
            >
              <div className="flex items-center gap-2">
                <span>🎯</span>
                주문하기!
              </div>
            </Button>
            <p className="text-center text-sm text-gray-500 mt-2">
              버튼을 누르면 메뉴를 선택할 수 있어요
            </p>
          </div>
        </>
      )}

      {/* Menu Selection Popup */}
      {showMenuPopup && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-0 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="text-xl font-bold text-gray-900">메뉴 선택</h3>
              <Button
                onClick={() => setShowMenuPopup(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Menu List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-3">
                {menuItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">☕</div>
                    <p className="text-gray-500">메뉴가 준비 중입니다...</p>
                  </div>
                ) : (
                  menuItems.map((item) => (
                    <Card key={item.id} className="flex items-center justify-between p-4 hover:shadow-md transition-all duration-200 border-2 hover:border-blue-200">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={selected[item.id] || false}
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
                      <div className="text-right">
                        <span className="font-bold text-lg text-blue-600">{formatPrice(item.price)}</span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-6 pt-4 border-t border-gray-100 bg-white rounded-b-2xl">
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowMenuPopup(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button
                  onClick={handleOrderButtonClick}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  disabled={isPending || Object.keys(selected).filter(id => selected[id]).length === 0}
                >
                  주문하기
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Name Input Popup */}
      {showNamePopup && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
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
        </div>,
        document.body
      )}
    </div>
  )
}
