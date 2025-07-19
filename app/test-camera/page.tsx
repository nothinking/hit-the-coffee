"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraMenuInput } from "@/components/camera-menu-input"
import { ArrowLeft } from "lucide-react"

interface MenuItem {
  name: string
  description: string
  price: string
}

export default function TestCameraPage() {
  const router = useRouter()
  const [extractedMenus, setExtractedMenus] = useState<MenuItem[]>([])

  const handleMenuExtracted = (menus: MenuItem[]) => {
    setExtractedMenus(menus)
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
          <h1 className="text-3xl font-bold">카메라 메뉴 입력 테스트</h1>
          <p className="text-muted-foreground mt-2">
            카메라로 메뉴판을 촬영하여 메뉴를 추출해보세요
          </p>
        </div>
      </div>

      {/* 카메라 입력 컴포넌트 */}
      <div className="mb-8">
        <CameraMenuInput
          onMenuExtracted={handleMenuExtracted}
          onCancel={() => router.back()}
        />
      </div>

      {/* 추출된 메뉴 결과 */}
      {extractedMenus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>추출된 메뉴 ({extractedMenus.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extractedMenus.map((menu, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{menu.name}</p>
                    {menu.description && (
                      <p className="text-sm text-muted-foreground">
                        {menu.description}
                      </p>
                    )}
                  </div>
                  {menu.price && (
                    <p className="font-semibold text-green-600">
                      {Number(menu.price).toLocaleString()}원
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 