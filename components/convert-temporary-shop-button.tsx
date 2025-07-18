"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Store, Loader2 } from "lucide-react"
import { createPortal } from "react-dom"

interface ConvertTemporaryShopButtonProps {
  shopId: string
  shopName: string
  isTemporary: boolean
}

export function ConvertTemporaryShopButton({ shopId, shopName, isTemporary }: ConvertTemporaryShopButtonProps) {
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isTemporary) {
    return null
  }

  const handleConvert = async () => {
    if (!address.trim()) {
      toast({
        title: "주소 입력 필요",
        description: "매장 주소를 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/convert-temporary-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          address: address.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "정식 등록 완료!",
          description: `${shopName}이 정식 매장으로 등록되었습니다.`
        })
        setShowModal(false)
        setAddress("")
        // 페이지 새로고침
        window.location.reload()
      } else {
        toast({
          title: "등록 실패",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "정식 등록 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="outline"
        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
      >
        <Store className="w-4 h-4 mr-2" />
        정식 매장으로 등록
      </Button>

      {/* Modal */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] p-4">
          <div className="min-h-full flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-0">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                정식 매장 등록
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>{shopName}</strong>을 정식 매장으로 등록하시겠습니까?
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    정식 등록하면 매장 목록에서 관리할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">매장 주소 *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="예: 서울시 강남구 테헤란로 123"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleConvert}
                  disabled={loading || !address.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      등록 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      정식 등록
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
} 