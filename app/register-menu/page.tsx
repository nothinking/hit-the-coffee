"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { MenuInputForm } from "@/components/menu-input-form"
import { ArrowLeft } from "lucide-react"

interface MenuItem {
  name: string
  description: string
  price: string
}

export default function RegisterMenuPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [extractedMenus, setExtractedMenus] = useState<MenuItem[]>([])

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

    // 매장 이름 입력 받기
    const shopName = prompt("매장 이름을 입력해주세요:")
    if (!shopName || shopName.trim() === '') {
      toast({
        title: "매장 이름 필요",
        description: "매장 이름을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    // 주문 제목 입력 받기 (선택사항)
    const orderTitle = prompt("주문 제목을 입력해주세요 (선택사항):") || ""

    // 주문 마감 시간 입력 받기
    const expiresInMinutes = prompt("주문 마감 시간을 분 단위로 입력해주세요 (기본값: 30분):") || "30"

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
    }
  }

  const handleMenusExtracted = (menus: MenuItem[]) => {
    setExtractedMenus(menus)
  }

  const handleReset = () => {
    setExtractedMenus([])
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
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
                onClick={createQuickOrder} 
                className="w-full"
                size="lg"
              >
                🚀 주문 링크 생성하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 