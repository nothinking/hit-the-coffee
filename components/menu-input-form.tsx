"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  ArrowLeft, 
  Edit3, 
  Upload, 
  Mic, 
  MicOff,
  Loader2,
  CheckCircle,
  X,
  Camera,
  Plus
} from "lucide-react"

interface MenuItem {
  name: string
  description: string
  price: string
}

type InputMethod = 'camera' | 'text' | 'voice' | 'file' | null

interface MenuInputFormProps {
  onMenusExtracted: (menus: MenuItem[]) => void
  onReset?: () => void
  shopId?: string // 매장 ID가 있으면 해당 매장에 메뉴 추가
  onMenusAdded?: (menus: MenuItem[]) => void // 매장에 메뉴 추가 완료 콜백
}

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

export function MenuInputForm({ onMenusExtracted, onReset, shopId, onMenusAdded }: MenuInputFormProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  const [inputMethod, setInputMethod] = useState<InputMethod>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedMenus, setExtractedMenus] = useState<MenuItem[]>([])
  const [isAddingToShop, setIsAddingToShop] = useState(false)
  
  // 텍스트 입력
  const [textInput, setTextInput] = useState("")
  const [textInputCompleted, setTextInputCompleted] = useState(false)
  
  // 파일 업로드
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  
  // 음성 입력
  const [isListening, setIsListening] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)
  const [lastFinalTranscript, setLastFinalTranscript] = useState("")
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // 음성 인식 지원 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setIsVoiceSupported(!!SpeechRecognition)
    }
  }, [])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  // 음성 인식 시작
  const startVoiceRecognition = () => {
    if (!isVoiceSupported) {
      toast({
        title: "음성 인식 지원 안됨",
        description: "이 브라우저는 음성 인식을 지원하지 않습니다.",
        variant: "destructive"
      })
      return
    }
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = false // 모바일에서 중복 방지를 위해 false로 설정
      recognitionInstance.lang = 'ko-KR'
      recognitionInstance.maxAlternatives = 1 // 대안 결과 수를 1개로 제한
      
      recognitionInstance.onstart = () => {
        setIsListening(true)
        setVoiceText("")
        setVoiceError(null)
        setLastFinalTranscript("")
        // 기존 타이머 정리
        if (debounceTimer) {
          clearTimeout(debounceTimer)
          setDebounceTimer(null)
        }
        toast({
          title: "음성 인식 시작",
          description: "이제 말씀해주세요!",
        })
      }
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          // 중복 방지를 위한 디바운싱 및 중복 체크
          const normalizedFinal = finalTranscript.trim()
          
          // 기존 타이머가 있다면 정리
          if (debounceTimer) {
            clearTimeout(debounceTimer)
          }
          
          // 디바운싱으로 중복 방지 (500ms)
          const timer = setTimeout(() => {
            // 마지막으로 추가된 텍스트와 동일한지 확인
            if (normalizedFinal !== lastFinalTranscript && normalizedFinal.length > 0) {
              setVoiceText(prev => {
                // 기존 텍스트에 이미 포함되어 있는지 확인
                const lines = prev.split('\n').filter(line => line.trim())
                const isDuplicate = lines.some(line => 
                  line.trim() === normalizedFinal || 
                  normalizedFinal.includes(line.trim()) ||
                  line.trim().includes(normalizedFinal)
                )
                
                if (!isDuplicate) {
                  setLastFinalTranscript(normalizedFinal)
                  return prev + normalizedFinal + "\n"
                }
                return prev
              })
            }
          }, 500)
          
          setDebounceTimer(timer)
        }
      }
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        let errorMessage = "음성 인식 중 오류가 발생했습니다."
        switch (event.error) {
          case 'no-speech':
            errorMessage = "음성이 감지되지 않았습니다. 다시 시도해주세요."
            break
          case 'audio-capture':
            errorMessage = "마이크에 접근할 수 없습니다. 마이크 권한을 확인해주세요."
            break
          case 'not-allowed':
            errorMessage = "마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요."
            break
          case 'network':
            errorMessage = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요."
            break
          default:
            errorMessage = `음성 인식 오류: ${event.error}`
        }
        
        setVoiceError(errorMessage)
        toast({
          title: "음성 인식 오류",
          description: errorMessage,
          variant: "destructive"
        })
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
      recognitionInstance.start()
    } catch (error) {
      console.error('Speech recognition initialization error:', error)
      toast({
        title: "음성 인식 초기화 실패",
        description: "음성 인식을 시작할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  // 음성 인식 중지
  const stopVoiceRecognition = () => {
    if (recognition) {
      try {
        recognition.stop()
        setIsListening(false)
        // 타이머 정리
        if (debounceTimer) {
          clearTimeout(debounceTimer)
          setDebounceTimer(null)
        }
        toast({
          title: "음성 인식 중지",
          description: "음성 인식이 중지되었습니다.",
        })
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
  }

  // 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 파일 삭제
  const removeFile = () => {
    setUploadedFile(null)
    setFilePreview(null)
    // 파일 입력 필드 초기화
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // 모바일 카메라 촬영 (갤러리 선택 옵션 포함)
  const openCamera = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // 카메라 앱이 먼저 나오도록 설정
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setUploadedFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
        setInputMethod('file')
      }
    }
    
    input.click()
  }

  // 메뉴 추출
  const extractMenuInfo = async () => {
    let inputData: string | File | null = null
    
    if (inputMethod === 'text' && textInput.trim()) {
      inputData = textInput.trim()
    } else if (inputMethod === 'file' && uploadedFile) {
      inputData = uploadedFile
    } else if (inputMethod === 'voice' && voiceText.trim()) {
      inputData = voiceText.trim()
    }
    
    if (!inputData) {
      toast({
        title: "입력 오류",
        description: "메뉴 정보를 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    setIsExtracting(true)

    try {
      const formData = new FormData()
      
      if (inputData instanceof File) {
        formData.append('image', inputData)
      } else {
        formData.append('textInput', inputData)
      }

      const response = await fetch('/api/extract-menu-info', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
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
            onMenusExtracted(menus)
            toast({
              title: "메뉴 추출 완료",
              description: `${menus.length}개의 메뉴를 추출했습니다.`
            })
          } else {
            toast({
              title: "메뉴 없음",
              description: "추출된 메뉴가 없습니다. 다시 촬영해주세요.",
              variant: "destructive"
            })
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError)
          toast({
            title: "파싱 오류",
            description: "메뉴 정보를 파싱할 수 없습니다. 다시 촬영해주세요.",
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
    } catch (err) {
      toast({
        title: "오류",
        description: "메뉴 추출 중 오류가 발생했습니다. 다시 촬영해주세요.",
        variant: "destructive"
      })
    } finally {
      setIsExtracting(false)
    }
  }

  // 매장에 메뉴 추가
  const addMenusToShop = async () => {
    if (!shopId || extractedMenus.length === 0) return

    setIsAddingToShop(true)

    try {
      const response = await fetch("/api/menu/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shopId,
          menus: extractedMenus.map(menu => ({
            name: menu.name,
            description: menu.description || '',
            price: menu.price || '0'
          }))
        })
      })

      if (!response.ok) {
        throw new Error('메뉴 추가에 실패했습니다.')
      }

      toast({
        title: "메뉴 추가 완료",
        description: `${extractedMenus.length}개의 메뉴가 매장에 추가되었습니다.`
      })

      if (onMenusAdded) {
        onMenusAdded(extractedMenus)
      }

      // 성공 후 초기화
      resetInputMethod()
    } catch (error: any) {
      toast({
        title: "메뉴 추가 실패",
        description: error.message || "메뉴 추가 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsAddingToShop(false)
    }
  }

  const resetInputMethod = () => {
    setInputMethod(null)
    setTextInput("")
    setUploadedFile(null)
    setFilePreview(null)
    setVoiceText("")
    setExtractedMenus([])
    setLastFinalTranscript("")
    // 타이머 정리
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
    if (recognition) {
      recognition.stop()
    }
    setIsListening(false)
    if (onReset) {
      onReset()
    }
  }

  return (
    <div className="space-y-6">
      {/* 입력 방법 선택 */}
      {!inputMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {shopId ? "스마트 메뉴 추가" : "메뉴 입력 방법 선택"}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {shopId 
                ? "메뉴판을 입력하고 매장에 바로 추가할 수 있습니다"
                : "메뉴판을 입력하고 바로 주문 링크를 생성할 수 있습니다"
              }
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {isMobile && (
                <Button
                  onClick={openCamera}
                  className="h-16 flex items-center justify-start gap-4"
                  variant="outline"
                >
                  <Camera className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-medium">카메라 촬영</div>
                    <div className="text-sm text-muted-foreground">카메라로 메뉴판 촬영</div>
                  </div>
                </Button>
              )}
              
              <Button
                onClick={() => setInputMethod('text')}
                className="h-16 flex items-center justify-start gap-4"
                variant="outline"
              >
                <Edit3 className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">텍스트 입력</div>
                  <div className="text-sm text-muted-foreground">메뉴 정보를 직접 입력</div>
                </div>
              </Button>
              
              <Button
                onClick={() => setInputMethod('file')}
                className="h-16 flex items-center justify-start gap-4"
                variant="outline"
              >
                <Upload className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">파일 업로드</div>
                  <div className="text-sm text-muted-foreground">메뉴판 이미지 업로드</div>
                </div>
              </Button>
              
              {isVoiceSupported && (
                <Button
                  onClick={() => setInputMethod('voice')}
                  className="h-16 flex items-center justify-start gap-4"
                  variant="outline"
                >
                  <Mic className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-medium">음성 입력</div>
                    <div className="text-sm text-muted-foreground">음성으로 메뉴 정보 입력</div>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 텍스트 입력 */}
      {inputMethod === 'text' && !textInputCompleted ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>텍스트 입력</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetInputMethod}>
                다른 방법 선택
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>메뉴 정보 입력</Label>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="각 줄에 하나의 메뉴를 입력하세요:

아메리카노 - 진한 커피 - 4500원
카페라떼 - 우유가 들어간 부드러운 커피 - 5000원
카푸치노 - 우유 거품이 있는 커피 - 5000원"
                rows={8}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                💡 입력 형식: 메뉴명 - 설명 - 가격원
              </p>
            </div>
            
            <Button 
              onClick={() => setTextInputCompleted(true)} 
              className="w-full"
              disabled={!textInput.trim()}
            >
              텍스트 입력 완료
            </Button>
          </CardContent>
        </Card>
      ) : inputMethod === 'text' && textInputCompleted ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>텍스트 입력 완료</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetInputMethod}>
                다시 입력
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 whitespace-pre-wrap">{textInput}</p>
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
          </CardContent>
        </Card>
      ) : inputMethod === 'file' && !filePreview ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>파일 업로드</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetInputMethod}>
                다른 방법 선택
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  메뉴판 이미지를 업로드하여 메뉴 정보를 자동으로 추출합니다
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : inputMethod === 'file' && filePreview ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>파일 업로드</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetInputMethod}>
                다른 방법 선택
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={filePreview}
                  alt="업로드된 메뉴"
                  className="w-full rounded-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={removeFile} 
                  variant="outline" 
                  className="flex-1"
                >
                  파일 삭제
                </Button>
                <Button 
                  onClick={extractMenuInfo} 
                  className="flex-1" 
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
            </div>
          </CardContent>
        </Card>
      ) : inputMethod === 'voice' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>음성 입력</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetInputMethod}>
                다른 방법 선택
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  음성으로 메뉴 정보를 입력하세요
                </p>
                
                {/* 음성 인식 상태 표시 */}
                {isListening && (
                  <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">음성 인식 중...</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                    variant={isListening ? "destructive" : "default"}
                    size="lg"
                    className={isListening ? "animate-pulse" : ""}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        음성 인식 중지
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        음성 인식 시작
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {voiceError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{voiceError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>인식된 텍스트</Label>
                <Textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  rows={6}
                  className="w-full"
                  placeholder="음성 인식 시작 버튼을 누르면 여기에 텍스트가 나타납니다..."
                />
              </div>

              {voiceText.trim() && (
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
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 추출된 메뉴 결과 */}
      {extractedMenus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              추출된 메뉴 ({extractedMenus.length}개)
            </CardTitle>
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
            
            <div className="mt-4 flex gap-2">
              {shopId ? (
                <Button 
                  onClick={addMenusToShop} 
                  className="flex-1" 
                  disabled={isAddingToShop}
                >
                  {isAddingToShop ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      매장에 추가 중...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      매장에 메뉴 추가
                    </>
                  )}
                </Button>
              ) : null}
              <Button onClick={resetInputMethod} variant="outline" className="flex-1">
                다시 입력
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 