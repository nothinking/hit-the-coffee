"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Camera, X, Loader2 } from "lucide-react"

interface CameraMenuInputProps {
  onMenuExtracted?: (menus: any[]) => void
  onCancel?: () => void
}

export function CameraMenuInput({ onMenuExtracted, onCancel }: CameraMenuInputProps) {
  const { toast } = useToast()
  
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)
    } catch (error) {
      toast({
        title: "카메라 접근 실패",
        description: "카메라 권한을 허용해주세요.",
        variant: "destructive"
      })
    }
  }

  // 카메라 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  // 사진 촬영
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg')
      setCapturedImage(imageData)
      stopCamera()
    }
  }

  // 메뉴 추출
  const extractMenuInfo = async () => {
    if (!capturedImage) return

    setIsExtracting(true)

    try {
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      
      const formData = new FormData()
      formData.append('image', blob, 'menu.jpg')

      const extractResponse = await fetch('/api/extract-menu-info', {
        method: 'POST',
        body: formData
      })

      const result = await extractResponse.json()
      
      if (result.success) {
        try {
          let jsonText = result.text.trim()
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '')
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '')
          }
          
          const menus = JSON.parse(jsonText)
          if (Array.isArray(menus) && menus.length > 0) {
            onMenuExtracted?.(menus)
            toast({
              title: "메뉴 추출 완료",
              description: `${menus.length}개의 메뉴를 추출했습니다.`
            })
          } else {
            toast({
              title: "메뉴 없음",
              description: "추출된 메뉴가 없습니다.",
              variant: "destructive"
            })
          }
        } catch (parseError) {
          toast({
            title: "파싱 오류",
            description: "메뉴 정보를 파싱할 수 없습니다.",
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "추출 실패",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "메뉴 추출 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">메뉴판 촬영</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showCamera && !capturedImage && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              메뉴판을 촬영하여 메뉴 정보를 자동으로 추출합니다
            </p>
            <Button onClick={startCamera} className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              카메라 시작
            </Button>
          </div>
        )}

        {showCamera && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1">
                사진 촬영
              </Button>
              <Button onClick={stopCamera} variant="outline">
                취소
              </Button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="촬영된 메뉴"
                className="w-full rounded-lg"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => setCapturedImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={extractMenuInfo} 
              className="w-full" 
              disabled={isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추출 중...
                </>
              ) : (
                '메뉴 추출하기'
              )}
            </Button>
          </div>
        )}

        {onCancel && (
          <Button onClick={onCancel} variant="outline" className="w-full">
            취소
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 