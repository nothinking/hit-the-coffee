"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { MenuInputForm } from "@/components/menu-input-form"
import { ArrowLeft } from "lucide-react"
import { createPortal } from "react-dom"

interface MenuItem {
  name: string
  description: string
  price: string
}

export default function RegisterMenuPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [extractedMenus, setExtractedMenus] = useState<MenuItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shopName, setShopName] = useState("")
  const [orderTitle, setOrderTitle] = useState("")
  const [expiresInMinutes, setExpiresInMinutes] = useState("30")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showModal])

  // 빠른 주문 링크 생성
  const createQuickOrder = async () => {
    if (extractedMenus.length === 0) {
      toast({
        title: "메뉴 없음",
        description: "추출된 메뉴가 없습니다.",
        variant: "destructive"
      })
      return
    }

    if (!shopName.trim()) {
      toast({
        title: "매장 이름 필요",
        description: "매장 이름을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/quick-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shopName.trim(),
          title: orderTitle.trim(),
          expiresInMinutes: parseInt(expiresInMinutes) || 30,
          menus: extractedMenus.map(menu => ({
            name: menu.name,
            description: menu.description || '',
            price: menu.price || '0'
          }))
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        toast({
          title: "주문 링크 생성 실패",
          description: data.message || "주문 링크 생성 중 오류가 발생했습니다.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "주문 링크 생성 완료!",
        description: "주문 링크가 성공적으로 생성되었습니다."
      })

      // 모달 닫기
      setShowModal(false)
      setShopName("")
      setOrderTitle("")
      setExpiresInMinutes("30")

      // 주문 페이지로 바로 이동
      if (data.shareCode) {
        router.push(`/order/${data.shareCode}`)
      }
    } catch (error: any) {
      toast({
        title: "주문 링크 생성 오류",
        description: error.message || "주문 링크 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMenusExtracted = (menus: MenuItem[]) => {
    setExtractedMenus(menus)
  }

  const handleReset = () => {
    setExtractedMenus([])
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
      {/* 헤더 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로 가기
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">🚀 빠른 주문</h1>
          <p className="text-muted-foreground mt-2">
            메뉴판을 촬영하고 바로 주문 링크를 생성하세요
          </p>
        </div>
      </div>

      {/* 메뉴 입력 폼 */}
      <MenuInputForm 
        onMenusExtracted={handleMenusExtracted}
        onReset={handleReset}
      />

      {/* 주문 링크 생성 버튼 */}
      {extractedMenus.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-center">주문 링크 생성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                추출된 메뉴 {extractedMenus.length}개로 주문 링크를 생성합니다
              </p>
              <Button 
                onClick={() => setShowModal(true)} 
                className="w-full"
                size="lg"
              >
                🚀 주문 링크 생성하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] p-4">
          <div className="min-h-full flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-0">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">🚀 빠른 주문 링크 생성</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    매장 이름 *
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="예: 스타벅스 강남점"
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    세션 이름 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={orderTitle}
                    onChange={e => setOrderTitle(e.target.value)}
                    placeholder="비워두면 AI가 생성해줘요"
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  {!orderTitle.trim() && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 비워두면 AI가 재미있는 제목을 만들어줘요!
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    만료 시간 (분)
                  </label>
                  <input
                    type="number"
                    value={expiresInMinutes}
                    onChange={e => setExpiresInMinutes(e.target.value)}
                    placeholder="30"
                    min="1"
                    max="1440"
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⏰ 기본값: 30분 (최대 24시간)
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    📋 추출된 메뉴: {extractedMenus.length}개
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={createQuickOrder}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      생성 중...
                    </div>
                  ) : (
                    '링크 생성하기'
                  )}
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