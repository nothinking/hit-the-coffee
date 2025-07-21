"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { submitOrderSelections } from "@/app/order/[shareCode]/actions"
import { X, Plus, Minus, ShoppingCart, Trash2 } from "lucide-react"
import { createPortal } from "react-dom"
import { formatPrice } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
  const isMobile = useIsMobile()
  const router = useRouter()

  /* UI state */
  const [participantName, setParticipantName] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>({}) // itemId → quantity
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
  const addToCart = (itemId: string) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }))
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return
    
    setQuantities(prev => {
      const next = { ...prev }
      if (newQuantity === 0) {
        delete next[itemId]
      } else {
        next[itemId] = newQuantity
      }
      return next
    })
  }

  const incrementQuantity = (itemId: string) => {
    updateQuantity(itemId, (quantities[itemId] || 0) + 1)
  }

  const decrementQuantity = (itemId: string) => {
    updateQuantity(itemId, (quantities[itemId] || 0) - 1)
  }

  const removeFromCart = (itemId: string) => {
    updateQuantity(itemId, 0)
  }

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
  }

  const getTotalPrice = () => {
    return Object.entries(quantities).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find(m => m.id === itemId)
      return sum + (item?.price || 0) * qty
    }, 0)
  }

  const getCartItems = () => {
    return Object.entries(quantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const item = menuItems.find(m => m.id === itemId)
        if (!item) return null
        return { ...item, quantity }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }

  /* Submit ---------------------------------------------------------------- */
  function handleOrderButtonClick() {
    const selectedItems = Object.keys(quantities).filter(id => quantities[id] > 0)
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

    const selections = Object.entries(quantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }))
    
    console.log("4. Starting transition for submitOrderSelections...")
    startTransition(async () => {
      console.log("5. Inside startTransition. Calling submitOrderSelections...");
      try {
        const result = await submitOrderSelections(null, orderId, participantName.trim(), selections);
        console.log("6. submitOrderSelections returned:", result);

        if (result && result.success) {
          toast({ title: "주문 완료!", description: result.message });
          setQuantities({}); // 수량 내역 리셋
          setParticipantName(""); // 이름 입력란도 리셋
          setShowNamePopup(false); // 팝업 닫기
          setShowMenuPopup(false); // 메뉴 팝업도 닫기
          
          // 주문 완료 후 즉시 페이지 새로고침하여 주문 현황 업데이트
          router.refresh();
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
                <span>🛒</span>
                장바구니에 담기!
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
          <div className={`bg-white rounded-2xl shadow-2xl border-0 flex flex-col ${
            isMobile ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-4xl max-h-[90vh]'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
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

            <div className={`flex flex-1 overflow-hidden ${
              isMobile ? 'flex-col' : ''
            }`}>
              {/* Menu List */}
              <div className={`overflow-y-auto ${
                isMobile 
                  ? 'flex-1 pb-24' // 하단 장바구니 박스 공간 확보
                  : 'flex-1 px-6 pb-4 border-r border-gray-100'
              }`}>
                {!isMobile && <h4 className="font-semibold text-gray-900 mb-4 mt-6">메뉴 목록</h4>}
                <div className={`space-y-3 ${
                  isMobile ? 'p-4' : ''
                }`}>
                  {menuItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">☕</div>
                      <p className="text-gray-500">메뉴가 준비 중입니다...</p>
                    </div>
                  ) : (
                    menuItems.map((item) => {
                      const quantity = quantities[item.id] || 0
                      
                      return (
                        <Card 
                          key={item.id} 
                          className="p-4 hover:shadow-md transition-all duration-200 border-2 hover:border-blue-200 cursor-pointer"
                          onClick={() => addToCart(item.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-900">{item.name}</h4>
                              {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="font-bold text-lg text-blue-600">{formatPrice(item.price)}</span>
                              </div>
                              {quantity > 0 && (
                                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {quantity}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Desktop Cart */}
              {!isMobile && (
                <div className="w-80 flex flex-col">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">장바구니</h4>
                    </div>
                    
                    {getCartItems().length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🛒</div>
                        <p className="text-gray-500">장바구니가 비어있습니다</p>
                        <p className="text-sm text-gray-400 mt-1">메뉴를 클릭해서 담아보세요!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {getCartItems().map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 truncate">{item.name}</h5>
                              <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  decrementQuantity(item.id)
                                }}
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full"
                                disabled={isPending}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              
                              <span className="min-w-[20px] text-center font-semibold">{item.quantity}</span>
                              
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  incrementQuantity(item.id)
                                }}
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full"
                                disabled={isPending}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFromCart(item.id)
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                disabled={isPending}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Desktop Cart Summary */}
                  {getCartItems().length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">총 {getTotalItems()}개</span>
                          <span className="font-bold text-lg text-blue-600">{formatPrice(getTotalPrice())}</span>
                        </div>
                        
                        <Button
                          onClick={handleOrderButtonClick}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          disabled={isPending}
                        >
                          주문하기 ({getTotalItems()}개)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Bottom Cart Box */}
            {isMobile && getCartItems().length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-10">
                <div className="space-y-3">
                  {/* Cart Items Summary */}
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {getCartItems().map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate text-sm">{item.name}</h5>
                          <p className="text-xs text-gray-600">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              decrementQuantity(item.id)
                            }}
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-full"
                            disabled={isPending}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          
                          <span className="min-w-[20px] text-center font-semibold text-sm">{item.quantity}</span>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              incrementQuantity(item.id)
                            }}
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-full"
                            disabled={isPending}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromCart(item.id)
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            disabled={isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Button */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      총 {getTotalItems()}개 • {formatPrice(getTotalPrice())}
                    </div>
                    <Button
                      onClick={handleOrderButtonClick}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                      disabled={isPending}
                    >
                      주문하기
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
            
            {/* Order Summary in Name Popup */}
            {getCartItems().length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">주문 내역</h4>
                <div className="space-y-2">
                  {getCartItems().map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{item.name} × {item.quantity}</span>
                      <span className="font-semibold text-blue-600">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center font-bold">
                      <span>총 {getTotalItems()}개</span>
                      <span className="text-blue-600">{formatPrice(getTotalPrice())}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
