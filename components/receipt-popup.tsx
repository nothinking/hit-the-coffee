"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Receipt } from "lucide-react"
import { createPortal } from "react-dom"

interface ReceiptPopupProps {
  mergedMenu: { name: string; price: number; quantity: number }[]
  coffeeShopName: string
  orderTitle?: string
}

export function ReceiptPopup({ mergedMenu, coffeeShopName, orderTitle }: ReceiptPopupProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPopup) {
        setShowPopup(false)
      }
    }

    if (showPopup) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showPopup])

  const totalAmount = mergedMenu.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalQuantity = mergedMenu.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      {/* Receipt Button */}
      <div className="text-center mt-6">
        <Button
          onClick={() => setShowPopup(true)}
          variant="outline"
          className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
          disabled={mergedMenu.length === 0}
        >
          <Receipt className="w-4 h-4 mr-2" />
          주문취합 보기
        </Button>
      </div>

      {/* Receipt Popup */}
      {showPopup && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">주문서</h3>
              <Button
                onClick={() => setShowPopup(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Receipt Content */}
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <div className="text-center text-lg font-bold mb-3 tracking-widest">RECEIPT</div>
              
              {/* Shop Info */}
              <div className="text-center mb-4 pb-2 border-b border-gray-300">
                <div className="font-semibold text-gray-800">{coffeeShopName}</div>
                {orderTitle && <div className="text-sm text-gray-600 mt-1">{orderTitle}</div>}
                <div className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                </div>
              </div>

              {/* Menu Items */}
              <div className="grid grid-cols-[1fr_40px_70px] gap-x-2 mb-2 text-xs font-semibold text-gray-600">
                <span>메뉴</span>
                <span>수량</span>
                <span>금액</span>
              </div>
              
              {mergedMenu.length > 0 ? (
                <>
                  {mergedMenu.map((item, idx) => (
                    <div key={item.name + item.price} className="grid grid-cols-[1fr_40px_70px] gap-x-2 py-1 items-center text-sm">
                      <span className="truncate text-left">{item.name}</span>
                      <span className="text-center">{item.quantity}</span>
                      <span className="text-right">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <hr className="my-3 border-gray-300" />
                  
                  {/* Total */}
                  <div className="flex justify-between font-bold text-base mb-2">
                    <span>TOTAL</span>
                    <span>{totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-end text-xs text-gray-600 mb-4">
                    총 수량: {totalQuantity}
                  </div>

                  {/* Barcode */}
                  <div className="flex flex-col items-center mt-4 pt-4 border-t border-gray-300">
                    <svg width="180" height="40" viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0" y="0" width="180" height="40" fill="#fff" />
                      <rect x="10" y="10" width="2" height="20" fill="#222" />
                      <rect x="16" y="10" width="1" height="20" fill="#222" />
                      <rect x="20" y="10" width="3" height="20" fill="#222" />
                      <rect x="26" y="10" width="2" height="20" fill="#222" />
                      <rect x="32" y="10" width="1" height="20" fill="#222" />
                      <rect x="36" y="10" width="2" height="20" fill="#222" />
                      <rect x="42" y="10" width="3" height="20" fill="#222" />
                      <rect x="48" y="10" width="1" height="20" fill="#222" />
                      <rect x="52" y="10" width="2" height="20" fill="#222" />
                      <rect x="58" y="10" width="3" height="20" fill="#222" />
                      <rect x="64" y="10" width="1" height="20" fill="#222" />
                      <rect x="68" y="10" width="2" height="20" fill="#222" />
                      <rect x="74" y="10" width="3" height="20" fill="#222" />
                      <rect x="80" y="10" width="1" height="20" fill="#222" />
                      <rect x="84" y="10" width="2" height="20" fill="#222" />
                      <rect x="90" y="10" width="3" height="20" fill="#222" />
                      <rect x="96" y="10" width="1" height="20" fill="#222" />
                      <rect x="100" y="10" width="2" height="20" fill="#222" />
                      <rect x="106" y="10" width="3" height="20" fill="#222" />
                      <rect x="112" y="10" width="1" height="20" fill="#222" />
                      <rect x="116" y="10" width="2" height="20" fill="#222" />
                      <rect x="122" y="10" width="3" height="20" fill="#222" />
                      <rect x="128" y="10" width="1" height="20" fill="#222" />
                      <rect x="132" y="10" width="2" height="20" fill="#222" />
                      <rect x="138" y="10" width="3" height="20" fill="#222" />
                      <rect x="144" y="10" width="1" height="20" fill="#222" />
                      <rect x="148" y="10" width="2" height="20" fill="#222" />
                      <rect x="154" y="10" width="3" height="20" fill="#222" />
                      <rect x="160" y="10" width="1" height="20" fill="#222" />
                      <rect x="164" y="10" width="2" height="20" fill="#222" />
                    </svg>
                    <div className="mt-2 text-base font-bold tracking-widest">THANK YOU</div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-center py-8">No orders submitted yet.</div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6">
              <Button
                onClick={() => setShowPopup(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
} 