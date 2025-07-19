"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function SimpleCameraTestPage() {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      console.log("카메라 시작 시도...")
      
      // 기존 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      console.log("카메라 스트림 획득 성공:", stream)
      streamRef.current = stream
      
      if (videoRef.current) {
        // 비디오 요소 초기화
        videoRef.current.srcObject = null
        
        // 새로운 스트림 설정
        videoRef.current.srcObject = stream
        
        // 이벤트 리스너 설정
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          console.log("비디오 메타데이터 로드 완료")
          setIsCameraOn(true)
          video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        }
        
        const handleCanPlay = () => {
          console.log("비디오 재생 가능")
          video.removeEventListener('canplay', handleCanPlay)
        }
        
        const handleError = (e: Event) => {
          console.error("비디오 오류:", e)
          setError("비디오 로드 오류")
          video.removeEventListener('error', handleError)
        }
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('canplay', handleCanPlay)
        video.addEventListener('error', handleError)
        
        // 비디오 재생 시도
        try {
          await video.play()
          console.log("비디오 재생 시작")
        } catch (playError) {
          console.error("비디오 재생 오류:", playError)
          setError(`비디오 재생 오류: ${playError}`)
        }
      }
    } catch (err) {
      console.error("카메라 오류:", err)
      setError(`카메라 오류: ${err}`)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOn(false)
    setError(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">간단한 카메라 테스트</h1>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={startCamera} disabled={isCameraOn}>
            카메라 시작
          </Button>
          <Button onClick={stopCamera} disabled={!isCameraOn}>
            카메라 중지
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 p-4 bg-gray-100 rounded">
          <p className="font-medium mb-2">카메라가 작동하지 않는 경우:</p>
          <p>• 브라우저에서 카메라 권한을 허용했는지 확인</p>
          <p>• HTTPS 환경에서 접속했는지 확인</p>
          <p>• 다른 브라우저로 시도해보세요 (Chrome 권장)</p>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            오류: {error}
          </div>
        )}

        <div className="border rounded-lg overflow-hidden bg-black relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
            style={{ minHeight: '256px' }}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-2xl mb-2">📷</div>
                <div>카메라 대기 중...</div>
              </div>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p>상태: {isCameraOn ? "카메라 활성화" : "카메라 비활성화"}</p>
          <p>브라우저: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'}</p>
          <p>HTTPS: {typeof window !== 'undefined' ? window.location.protocol === 'https:' : 'Unknown'}</p>
        </div>
      </div>
    </div>
  )
} 