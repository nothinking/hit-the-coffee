"use client"

import { useState, type FormEvent, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, X, Edit3, Loader2, ArrowLeft, ArrowRight, Link as LinkIcon, Mic, MicOff } from "lucide-react"
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

type Step = 'input' | 'menu' | 'order'

export default function QuickOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>('input')
  const [shopName, setShopName] = useState("")
  const [orderTitle, setOrderTitle] = useState("")
  const [expiresInMinutes, setExpiresInMinutes] = useState("30")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Input and menu extraction states
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
      const minutes = expiresInMinutes === "" ? 30 : Number(expiresInMinutes);
      
      const response = await fetch("/api/quick-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          title: orderTitle,
          expiresInMinutes: minutes,
          menus: editingMenus.map(menu => ({
            name: menu.name,
            description: menu.description,
            price: menu.price || "0"
          }))
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        setError(data.message)
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
            setCurrentStep('menu')
          } else {
            setExtractionError("추출된 메뉴가 없습니다. 다시 촬영해주세요.")
            toast({
              title: "메뉴 없음",
              description: "추출된 메뉴가 없습니다. 다시 촬영해주세요.",
              variant: "destructive"
            })
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError)
          setExtractionError("메뉴 정보를 파싱할 수 없습니다. 다시 촬영해주세요.")
          toast({
            title: "파싱 오류",
            description: "메뉴 정보를 파싱할 수 없습니다. 다시 촬영해주세요.",
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
      setExtractionError("메뉴 추출 중 오류가 발생했습니다. 다시 촬영해주세요.")
      toast({
        title: "오류",
        description: "메뉴 추출 중 오류가 발생했습니다. 다시 촬영해주세요.",
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

  function goToNextStep() {
    if (currentStep === 'input' && extractedMenus.length > 0) {
      setCurrentStep('menu')
    } else if (currentStep === 'menu' && editingMenus.length > 0) {
      setCurrentStep('order')
    }
  }

  function goToPreviousStep() {
    if (currentStep === 'menu') {
      // 메뉴 단계에서 입력 단계로 돌아갈 때 상태 초기화
      setCurrentStep('input')
      // 추출된 메뉴는 유지하되, 입력 상태는 초기화
      setExtractedMenus([])
      setEditingMenus([])
      setExtractionError(null)
      setIsExtracting(false)
    } else if (currentStep === 'order') {
      setCurrentStep('menu')
    }
  }

  function resetInput() {
    setCapturedImage(null)
    setTextInput("")
    setTextInputCompleted(false)
    setInputMethod(null)
    setExtractedMenus([])
    setEditingMenus([])
    setExtractionError(null)
    setCurrentStep('input')
  }

  const steps = [
    { id: 'input', title: '메뉴 입력', description: '카메라 촬영 또는 텍스트로 메뉴를 입력합니다' },
    { id: 'menu', title: '메뉴 확인', description: '추출된 메뉴를 확인하고 편집합니다' },
    { id: 'order', title: '주문 링크 생성', description: '주문 링크를 생성합니다' }
  ]

  return (
    <main className="flex items-center justify-center min-h-screen p-4 pt-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">빠른 주문 링크 생성</CardTitle>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep === step.id 
                    ? 'bg-blue-600 text-white' 
                    : steps.findIndex(s => s.id === currentStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {steps.findIndex(s => s.id === currentStep) > index ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    steps.findIndex(s => s.id === currentStep) > index ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-4">
            <h3 className="text-lg font-medium text-gray-900">
              {steps.find(s => s.id === currentStep)?.title}
            </h3>
            <p className="text-sm text-gray-600">
              {steps.find(s => s.id === currentStep)?.description}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Input */}
          {currentStep === 'input' && (
            <div className="space-y-4">
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
                        onClick={() => setInputMethod(null)} 
                        variant="outline"
                        className="flex-1"
                      >
                        뒤로 가기
                      </Button>
                      <Button 
                        onClick={() => {
                          if (textInput.trim()) {
                            // 텍스트 입력 완료 후 다음 단계로
                            setTextInput(textInput.trim())
                            setTextInputCompleted(true)
                          }
                        }} 
                        className="flex-1"
                        disabled={!textInput.trim()}
                        size="lg"
                      >
                        입력 완료
                      </Button>
                    </div>
                  </div>
                </div>
              ) : inputMethod === 'text' && textInputCompleted && !extractedMenus.length ? (
                <div className="space-y-4">
                  {isExtracting ? (
                    <div className="text-center p-8 bg-blue-50 rounded-lg">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                      <p className="text-sm text-gray-600 mb-2">메뉴 정보를 추출하고 있습니다...</p>
                      <p className="text-xs text-gray-500">잠시만 기다려주세요</p>
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-green-50 rounded-lg border-2 border-dashed border-green-200">
                      <Edit3 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">입력된 텍스트 확인</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        입력한 텍스트를 확인하고 메뉴 정보를 추출합니다
                      </p>
                      <div className="p-4 bg-white rounded-lg border border-green-200 text-left">
                        <h4 className="font-medium text-green-900 mb-2">입력된 텍스트:</h4>
                        <pre className="text-sm text-green-800 whitespace-pre-wrap">{textInput}</pre>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => {
                            setTextInput("")
                            setTextInputCompleted(false)
                          }} 
                          variant="outline"
                          className="flex-1"
                        >
                          다시 입력
                        </Button>
                        <Button 
                          onClick={extractMenuInfo} 
                          className="flex-1"
                          size="lg"
                        >
                          🔍 메뉴 정보 추출하기
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {capturedImage && (
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
                        onClick={resetInput}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {!isExtracting && extractedMenus.length === 0 && !extractionError && (
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-4">
                        {inputMethod === 'camera' 
                          ? '촬영한 사진에서 메뉴 정보를 자동으로 추출합니다'
                          : '입력한 텍스트에서 메뉴 정보를 자동으로 추출합니다'
                        }
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
                  )}

                  {extractionError && (
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-600 mb-4">
                          {extractionError}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={resetInput} 
                            variant="outline"
                            className="flex-1"
                          >
                            📸 다시 입력
                          </Button>
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
                </div>
              )}
            </div>
          )}

          {/* Step 2: Menu */}
          {currentStep === 'menu' && (
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
                  <li>• 메뉴 편집이 완료되면 다음 단계로 진행해주세요</li>
                  <li>• 메뉴 이름은 필수 입력 항목입니다</li>
                  <li>• 모든 메뉴가 올바르게 입력되었는지 확인해주세요</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Order Link Generation */}
          {currentStep === 'order' && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <LinkIcon className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium text-green-900 mb-2">주문 링크 생성</h3>
                <p className="text-sm text-green-700">
                  추출된 메뉴 {editingMenus.length}개로 주문 링크를 생성합니다
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="shopName">매장 이름 *</Label>
                  <Input 
                    id="shopName" 
                    value={shopName} 
                    onChange={(e) => setShopName(e.target.value)} 
                    placeholder="예: 스타벅스 강남점"
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="orderTitle">주문 제목 (선택사항)</Label>
                  <Input 
                    id="orderTitle" 
                    value={orderTitle} 
                    onChange={(e) => setOrderTitle(e.target.value)} 
                    placeholder="예: 오후 커피 타임"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="expiresInMinutes">주문 마감 시간 (분)</Label>
                  <Input 
                    id="expiresInMinutes" 
                    type="number"
                    min="1"
                    max="1440"
                    value={expiresInMinutes} 
                    onChange={(e) => setExpiresInMinutes(e.target.value)} 
                    placeholder="30"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 text-center" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {currentStep !== 'input' && (
              <Button 
                onClick={goToPreviousStep} 
                variant="outline" 
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                이전
              </Button>
            )}
            
            {currentStep === 'input' && extractedMenus.length > 0 && (
              <Button 
                onClick={goToNextStep} 
                className="flex-1"
              >
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 'menu' && editingMenus.length > 0 && (
              <Button 
                onClick={goToNextStep} 
                className="flex-1"
              >
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 'order' && (
              <Button 
                className="flex-1" 
                disabled={loading || !shopName}
                onClick={(e) => {
                  e.preventDefault()
                  handleSubmit(e as any)
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    링크 생성 중...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    주문 링크 생성하기
                  </>
                )}
              </Button>
            )}
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