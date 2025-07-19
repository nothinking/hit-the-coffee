"use client"

import { useState, type FormEvent, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, X, Edit3, Loader2, Mic, MicOff, ArrowLeft } from "lucide-react"
import { createPortal } from "react-dom"

// Web Speech API 타입 정의
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

interface MenuItem {
  name: string
  description: string
  price: string
}

export default function RegisterShopPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Camera and menu extraction states
  const [showCamera, setShowCamera] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const [textInputCompleted, setTextInputCompleted] = useState(false)
  const [inputMethod, setInputMethod] = useState<'camera' | 'text' | 'voice' | null>(null)
  const [extractedMenus, setExtractedMenus] = useState<MenuItem[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [editingMenus, setEditingMenus] = useState<MenuItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [voiceError, setVoiceError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // 음성 인식 지원 확인
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsVoiceSupported(true)
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'ko-KR'
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            }
          }
          if (finalTranscript) {
            setVoiceText(prev => prev + finalTranscript)
          }
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setVoiceError(`음성 인식 오류: ${event.error}`)
          setIsListening(false)
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  // ESC 키로 카메라 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCamera) {
        stopCamera()
      }
    }

    if (showCamera) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showCamera])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowser()
      const { data, error: supabaseError } = await supabase
        .from("coffee_shops")
        .insert({ name })
        .select()
        .single()

      if (supabaseError) throw supabaseError

      // If there are menus to add, add them
      if (editingMenus.length > 0) {
        const menuResponse = await fetch("/api/menu/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: data.id,
            menus: editingMenus.map(menu => ({
              name: menu.name,
              description: menu.description,
              price: menu.price || "0"
            }))
          })
        })

        if (!menuResponse.ok) {
          console.error("Failed to add menus")
        }
      }

      // Navigate to the management page for the new shop
      router.push(`/shop/${data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Camera functions
  function openCameraApp() {
    // 모바일에서 카메라 앱 열기
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // 카메라 권한 요청 후 카메라 앱 열기
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          // 권한이 허용되면 카메라 앱 열기 시도
          if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
            // 카메라 앱 열기 시도
            window.open('camera://', '_blank')
          } else {
            // 대안: 파일 선택으로 카메라 앱 열기
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.capture = 'environment'
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                  setCapturedImage(e.target?.result as string)
                  setInputMethod('camera')
                }
                reader.readAsDataURL(file)
              }
            }
            input.click()
          }
        })
        .catch((err) => {
          console.error("카메라 권한 오류:", err)
          // 권한이 거부되면 파일 선택으로 대체
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.capture = 'environment'
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = (e) => {
                setCapturedImage(e.target?.result as string)
                setInputMethod('camera')
              }
              reader.readAsDataURL(file)
            }
          }
          input.click()
        })
    } else {
      // 브라우저가 카메라를 지원하지 않으면 파일 선택
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setCapturedImage(e.target?.result as string)
            setInputMethod('camera')
          }
          reader.readAsDataURL(file)
        }
      }
      input.click()
    }
  }

  async function startCamera() {
    // 기존 카메라 함수는 유지하되, 기본적으로는 카메라 앱 열기 사용
    openCameraApp()
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const imageData = canvasRef.current.toDataURL('image/jpeg')
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }

  // Voice recognition functions
  const startVoiceRecognition = () => {
    if (!recognitionRef.current) return
    
    setVoiceError(null)
    setVoiceText("")
    setIsListening(true)
    
    try {
      recognitionRef.current.start()
      toast({
        title: "음성 인식 시작",
        description: "메뉴 정보를 말씀해주세요. 완료되면 '음성 입력 완료' 버튼을 눌러주세요."
      })
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      setVoiceError("음성 인식을 시작할 수 없습니다.")
      setIsListening(false)
    }
  }

  const stopVoiceRecognition = () => {
    if (!recognitionRef.current) return
    
    try {
      recognitionRef.current.stop()
      setIsListening(false)
      toast({
        title: "음성 인식 완료",
        description: "음성 입력이 완료되었습니다."
      })
    } catch (error) {
      console.error('Failed to stop speech recognition:', error)
    }
  }

  const resetVoiceInput = () => {
    setVoiceText("")
    setVoiceError(null)
    setIsListening(false)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Failed to stop speech recognition:', error)
      }
    }
  }

  async function extractMenuInfo() {
    // 음성 인식 텍스트가 있으면 그것을 사용, 없으면 textInput 사용
    const textToExtract = voiceText || textInput
    
    if (!capturedImage && !textToExtract) return

    setIsExtracting(true)
    setExtractionError(null)
    try {
      const formData = new FormData()
      
      if (capturedImage && !textToExtract.trim()) {
        // Convert base64 to blob
        const response = await fetch(capturedImage)
        const blob = await response.blob()
        formData.append('image', blob, 'menu.jpg')
      } else if (textToExtract.trim()) {
        formData.append('textInput', textToExtract)
      }

      const extractResponse = await fetch('/api/extract-menu-info', {
        method: 'POST',
        body: formData
      })

      const result = await extractResponse.json()
      
      if (result.success) {
        try {
          // JSON 코드블록이 있는 경우 제거
          let jsonText = result.text.trim()
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '')
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '')
          }
          
          const menus = JSON.parse(jsonText)
          if (Array.isArray(menus) && menus.length > 0) {
            setExtractedMenus(menus)
            setEditingMenus(menus)
            setExtractionError(null)
            toast({
              title: "메뉴 추출 완료",
              description: `${menus.length}개의 메뉴를 추출했습니다.`
            })
          } else {
            setExtractionError("추출된 메뉴가 없습니다.")
            toast({
              title: "메뉴 없음",
              description: "추출된 메뉴가 없습니다.",
              variant: "destructive"
            })
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError)
          console.error("Raw text:", result.text)
          setExtractionError("메뉴 정보를 파싱할 수 없습니다.")
          toast({
            title: "파싱 오류",
            description: "메뉴 정보를 파싱할 수 없습니다. 다시 시도해주세요.",
            variant: "destructive"
          })
        }
      } else {
        setExtractionError(result.message)
        toast({
          title: "추출 실패",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      setExtractionError("메뉴 추출 중 오류가 발생했습니다.")
      toast({
        title: "오류",
        description: "메뉴 추출 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsExtracting(false)
    }
  }

  function updateMenuItem(index: number, field: keyof MenuItem, value: string) {
    const updatedMenus = [...editingMenus]
    updatedMenus[index] = { ...updatedMenus[index], [field]: value }
    setEditingMenus(updatedMenus)
  }

  function removeMenuItem(index: number) {
    setEditingMenus(editingMenus.filter((_, i) => i !== index))
  }

  function addMenuItem() {
    setEditingMenus([...editingMenus, { name: '', description: '', price: '' }])
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4 pt-24">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">매장등록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Shop Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Shop Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Shop Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </form>

            {error && (
              <p className="text-sm text-red-600 text-center" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Menu Setup Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Menu Setup (Optional)</h2>
            <p className="text-sm text-gray-600">
              메뉴판 사진을 찍어서 자동으로 메뉴를 등록할 수 있습니다.
            </p>

            {!inputMethod ? (
              <div className="space-y-4">
                <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">메뉴 입력 방법 선택</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    카메라 촬영, 텍스트 입력, 또는 음성 입력으로 메뉴를 입력할 수 있습니다
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button 
                      onClick={() => setInputMethod('camera')} 
                      className="flex-1"
                      size="lg"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      카메라 촬영
                    </Button>
                    <Button 
                      onClick={() => setInputMethod('text')} 
                      className="flex-1"
                      variant="outline"
                      size="lg"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      텍스트 입력
                    </Button>
                    {isVoiceSupported && (
                      <Button 
                        onClick={() => setInputMethod('voice')} 
                        className="flex-1"
                        variant="outline"
                        size="lg"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        음성 입력
                      </Button>
                    )}

                  </div>
                </div>
                

              </div>
            ) : inputMethod === 'camera' && !capturedImage ? (
              <div className="space-y-4">
                <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">메뉴판 촬영</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    메뉴판이 잘 보이도록 촬영해주세요
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={startCamera} 
                      className="flex-1"
                      size="lg"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      카메라로 촬영
                    </Button>
                    <Button 
                      onClick={() => document.getElementById('file-input')?.click()} 
                      className="flex-1"
                      variant="outline"
                      size="lg"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      파일 선택
                    </Button>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={() => {
                        setInputMethod(null)
                        setCapturedImage(null)
                      }} 
                      variant="ghost"
                      size="sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      다른 방법 선택
                    </Button>
                  </div>
                </div>
                
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        setCapturedImage(e.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
            ) : inputMethod === 'text' && !textInputCompleted ? (
              <div className="space-y-4">
                <div className="text-center p-8 bg-green-50 rounded-lg border-2 border-dashed border-green-200">
                  <Edit3 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">메뉴 텍스트 입력</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    각 줄에 하나의 메뉴를 입력해주세요. 줄바꿈으로 메뉴를 구분합니다.
                  </p>
                  <div className="text-xs text-gray-500 mb-2 bg-blue-50 p-2 rounded">
                    💡 <strong>입력 형식:</strong><br/>
                    • 메뉴명 - 설명 - 가격원<br/>
                    • 메뉴명 가격원 (설명 없음)<br/>
                    • 메뉴명 설명 가격원
                  </div>
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="각 줄에 하나의 메뉴를 입력하세요:

아메리카노 - 진한 커피 - 4500원
카페라떼 - 우유가 들어간 부드러운 커피 - 5000원
카푸치노 - 우유 거품이 있는 커피 - 5000원
에스프레소 - 강한 커피 - 3500원"
                    rows={10}
                    className="w-full"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => setTextInputCompleted(true)} 
                      className="flex-1"
                      disabled={!textInput.trim()}
                    >
                      텍스트 입력 완료
                    </Button>
                    <Button 
                      onClick={() => {
                        setInputMethod(null)
                        setTextInput("")
                        setTextInputCompleted(false)
                      }} 
                      variant="outline"
                    >
                      다른 방법 선택
                    </Button>
                  </div>
                </div>
              </div>
            ) : inputMethod === 'voice' && !voiceText ? (
              <div className="space-y-4">
                <div className="text-center p-8 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
                  <Mic className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">음성으로 메뉴 입력</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    메뉴 정보를 말씀해주세요. 예: "아메리카노 4500원, 카페라떼 5000원"
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={startVoiceRecognition} 
                      className="flex-1"
                      disabled={isListening}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {isListening ? "음성 인식 중..." : "음성 인식 시작"}
                    </Button>
                    <Button 
                      onClick={() => {
                        setInputMethod(null)
                        resetVoiceInput()
                      }} 
                      variant="outline"
                    >
                      다른 방법 선택
                    </Button>
                  </div>
                  {voiceError && (
                    <p className="text-sm text-red-600 mt-2">{voiceError}</p>
                  )}
                </div>
              </div>
            ) : inputMethod === 'voice' && voiceText ? (
              <div className="space-y-4">
                <div className="text-center p-8 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
                  <Mic className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">음성 입력 결과</h3>
                  <div className="bg-white p-4 rounded-lg border text-left">
                    <p className="text-sm text-gray-700">{voiceText}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={stopVoiceRecognition} 
                      className="flex-1"
                      disabled={!isListening}
                    >
                      <MicOff className="w-4 h-4 mr-2" />
                      음성 입력 완료
                    </Button>
                    <Button 
                      onClick={resetVoiceInput} 
                      variant="outline"
                    >
                      다시 녹음
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={capturedImage} 
                    alt="Captured menu" 
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

                {!isExtracting && extractedMenus.length === 0 && !extractionError && (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-4">
                        촬영한 사진에서 메뉴 정보를 자동으로 추출합니다
                      </p>
                      <Button 
                        onClick={extractMenuInfo} 
                        className="w-full"
                        size="lg"
                        disabled={isExtracting}
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            추출 중...
                          </>
                        ) : (
                          '🔍 메뉴 정보 추출하기'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {extractionError && (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600 mb-4">
                        {extractionError}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={extractMenuInfo} 
                          variant="outline"
                          className="flex-1"
                          disabled={isExtracting}
                        >
                          {isExtracting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              추출 중...
                            </>
                          ) : (
                            '🔄 다시 시도'
                          )}
                        </Button>
                        <Button 
                          onClick={() => setExtractionError(null)} 
                          variant="ghost"
                          className="flex-1"
                        >
                        취소
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isExtracting && (
                  <div className="text-center p-8 bg-blue-50 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-sm text-gray-600 mb-2">메뉴 정보를 추출하고 있습니다...</p>
                    <p className="text-xs text-gray-500">잠시만 기다려주세요</p>
                  </div>
                )}

                {extractedMenus.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">추출된 메뉴 ({editingMenus.length}개)</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          {isEditing ? "편집 완료" : "메뉴 편집"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addMenuItem}
                          disabled={!isEditing}
                        >
                          + 메뉴 추가
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {editingMenus.map((menu, index) => (
                        <Card key={index} className={isEditing ? "ring-2 ring-blue-200" : ""}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <Label className="text-sm font-medium">메뉴 {index + 1}</Label>
                              </div>
                              {isEditing && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeMenuItem(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                                                            <div>
                                <Label className="text-sm font-medium">메뉴 이름 *</Label>
                                <Input
                                  value={menu.name}
                                  onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                                  disabled={!isEditing}
                                  placeholder="예: 아메리카노"
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium">설명</Label>
                                <Textarea
                                  value={menu.description}
                                  onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                                  disabled={!isEditing}
                                  rows={2}
                                  placeholder="메뉴에 대한 설명을 입력하세요"
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                                
                                <div>
                                <Label className="text-sm font-medium">가격 (원)</Label>
                                                                   <Input
                                     value={menu.price}
                                     onChange={(e) => updateMenuItem(index, 'price', e.target.value)}
                                     disabled={!isEditing}
                                     placeholder="가격을 입력하세요"
                                     className={!isEditing ? "bg-gray-50" : ""}
                                   />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium mb-1">💡 안내사항</p>
                      <ul className="text-xs space-y-1">
                        <li>• 메뉴 편집이 완료되면 아래 "Create Shop" 버튼을 눌러주세요</li>
                        <li>• 숍 정보와 메뉴를 함께 등록합니다</li>
                        <li>• 메뉴 이름은 필수 입력 항목입니다</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t">
            <Button 
              className="w-full" 
              disabled={loading || !name}
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e as any)
              }}
            >
              {loading ? "Saving..." : "Create Shop"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Modal */}
      {showCamera && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-0">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">메뉴판 촬영</h3>
              <p className="text-sm text-gray-600">메뉴판이 잘 보이도록 촬영해주세요</p>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* 촬영 가이드 */}
              <div className="absolute inset-0 border-2 border-white border-dashed rounded-lg m-2 pointer-events-none">
                <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  메뉴판 영역
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={capturePhoto} className="flex-1" size="lg">
                📸 사진 촬영
              </Button>
              <Button onClick={stopCamera} variant="outline" className="flex-1">
                취소
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}
