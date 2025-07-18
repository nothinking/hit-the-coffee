"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareSessionButtonProps {
  shareCode: string
  orderTitle?: string
  shopName: string
}

export function ShareSessionButton({ shareCode, orderTitle, shopName }: ShareSessionButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  
  const sessionUrl = `${window.location.origin}/order/${shareCode}`
  const shareText = orderTitle 
    ? `${shopName}에서 ${orderTitle} - 주문 세션에 참여해주세요!`
    : `${shopName}에서 주문 세션에 참여해주세요!`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl)
      setCopied(true)
      toast({
        title: "링크 복사됨",
        description: "세션 링크가 클립보드에 복사되었습니다.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "복사 실패",
        description: "링크 복사에 실패했습니다. 수동으로 복사해주세요.",
        variant: "destructive"
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: sessionUrl,
        })
      } catch (err) {
        // User cancelled sharing
        console.log('Share cancelled')
      }
    } else {
      // Fallback to copy link
      handleCopyLink()
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleShare}
        variant="outline"
        className="flex-1 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
      >
        <Share2 className="w-4 h-4 mr-2" />
        공유하기
      </Button>
      
      <Button
        onClick={handleCopyLink}
        variant="outline"
        size="sm"
        className={`px-3 transition-all duration-200 ${
          copied 
            ? 'bg-green-50 border-green-300 text-green-700' 
            : 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
        }`}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
} 