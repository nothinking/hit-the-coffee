"use client"
import { useTransition, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"

export function StartNewOrderForm({ shopId, shopName }: { shopId: string; shopName?: string }) {
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const router = useRouter()
  const [expiresInMinutes, setExpiresInMinutes] = useState<string | number>(30);

  useEffect(() => {
    setMounted(true)
  }, [])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal && !isPending && !isSuccess) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showModal, isPending, isSuccess])

  // 성공 후 자동 이동
  useEffect(() => {
    if (isSuccess && shareCode) {
      const timer = setTimeout(() => {
        router.push(`/order/${shareCode}`)
      }, 1500) // 1.5초 후 자동 이동

      return () => clearTimeout(timer)
    }
  }, [isSuccess, shareCode, router])

  // Gemini API를 사용한 세션 이름 자동 생성 함수
  async function generateFunTitle(): Promise<string> {
    try {
      const response = await fetch('/api/generate-session-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName })
      })
      
      const data = await response.json()
      if (data.success) {
        return data.title
      } else {
        throw new Error('Failed to generate title')
      }
    } catch (error) {
      console.error('Title generation error:', error)
      // 폴백: 기본 제목들
      const fallbackTitles = [
        "기분이 좋아서 😊",
        "커피가 땡겨서 ☕", 
        "친구들과 함께 👥",
        "오늘은 특별히 ✨",
        "스트레스 해소 💆‍♂️",
        "커피 한 잔의 여유 ☕",
        "오후의 힐링 🌅",
        "새로운 메뉴 시도 🆕"
      ]
      return fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)]
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setIsSuccess(false)
    setShareCode(null)
    
    startTransition(async () => {
      const minutes = expiresInMinutes === "" ? 30 : Number(expiresInMinutes);
      const now = new Date();
      // UTC 기준으로 expires_at 계산
      const expiresAt = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
      
      // 제목이 비어있으면 Gemini API로 자동 생성
      let finalTitle = title.trim();
      if (!finalTitle) {
        setIsGeneratingTitle(true);
        try {
          finalTitle = await generateFunTitle();
        } finally {
          setIsGeneratingTitle(false);
        }
      }
      
      const res = await fetch("/api/start-new-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, title: finalTitle, expiresInMinutes: minutes })
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message)
      } else {
        setIsSuccess(true)
        setShareCode(data.shareCode)
        setTitle("");
        setExpiresInMinutes(30);
        // 모달은 성공 메시지를 보여주기 위해 유지
      }
    })
  }

  const handleCloseModal = () => {
    if (!isPending && !isSuccess) {
      setShowModal(false)
      setError(null)
      setIsSuccess(false)
      setShareCode(null)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <span>🎯</span>
          주문취합 링크 생성
        </div>
      </Button>

      {/* Modal */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] p-4">
          <div className="min-h-full flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-0">
              {!isSuccess ? (
                <>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">{shopName}에서 쏩니다</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        세션 이름
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="세션 이름 (비워두면 AI가 생성)"
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                        disabled={isPending || isGeneratingTitle}
                      />
                      {!title.trim() && (
                        <p className="text-xs text-gray-500 mt-1">
                          💡 비워두면 AI가 {shopName ? `${shopName}에 맞는` : ''} 재미있는 제목을 만들어줘요!
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>⏰ 만료시간: 30분</span>
                    </div>

                    {error && <span className="text-red-500 text-sm">{error}</span>}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      className="flex-1"
                      disabled={isPending || isGeneratingTitle}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isPending || isGeneratingTitle}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {isPending || isGeneratingTitle ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isGeneratingTitle ? 'AI가 제목을 만들고 있어요...' : '세션 생성 중...'}
                        </div>
                      ) : (
                        '시작하기'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">주문 링크 생성 완료!</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      세션 페이지로 이동합니다...
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>잠시만 기다려주세요</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
} 