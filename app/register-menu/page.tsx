"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Camera
} from "lucide-react"

interface MenuItem {
  name: string
  description: string
  price: string
}

type InputMethod = 'text' | 'file' | 'voice' | null

export default function RegisterMenuPage() {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  const [inputMethod, setInputMethod] = useState<InputMethod>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedMenus, setExtractedMenus] = useState<MenuItem[]>([])
  
  // 텍스트 입력
  const [textInput, setTextInput] = useState("")
  
  // 파일 업로드
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  
  // 음성 입력
  const [isListening, setIsListening] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [recognition, setRecognition] = useState<any>(null)

  // 음성 인식 지원 확인
  useState(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setIsVoiceSupported(!!SpeechRecognition)
    }
  })

  // 음성 인식 시작
  const startVoiceRecognition = () => {
    if (!isVoiceSupported) return
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognitionInstance = new SpeechRecognition()
    
    recognitionInstance.continuous = true
    recognitionInstance.interimResults = true
    recognitionInstance.lang = 'ko-KR'
    
    recognitionInstance.onstart = () => {
      setIsListening(true)
      setVoiceText("")
    }
    
    recognitionInstance.onresult = (event: any) => {
      let finalTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        setVoiceText(prev => prev + finalTranscript + "\n")
      }
    }
    
    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }
    
    recognitionInstance.onend = () => {
      setIsListening(false)
    }
    
    setRecognition(recognitionInstance)
    recognitionInstance.start()
  }

  // 음성 인식 중지
  const stopVoiceRecognition = () => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
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

  // 입력 방법 초기화
  const resetInputMethod = () => {
    setInputMethod(null)
    setTextInput("")
    setUploadedFile(null)
    setFilePreview(null)
    setVoiceText("")
    if (recognition) {
      recognition.stop()
    }
    setIsListening(false)
  }

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

             {/* 입력 방법 선택 */}
       {!inputMethod && (
         <Card>
           <CardHeader>
             <CardTitle className="text-center">메뉴 입력 방법 선택</CardTitle>
             <p className="text-sm text-muted-foreground text-center">
               메뉴판을 입력하고 바로 주문 링크를 생성할 수 있습니다
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
      {inputMethod === 'text' && (
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
              onClick={extractMenuInfo} 
              className="w-full" 
              disabled={isExtracting || !textInput.trim()}
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
      )}

      {/* 파일 업로드 */}
      {inputMethod === 'file' && (
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

                             {filePreview && (
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
               )}
            </div>
          </CardContent>
        </Card>
      )}

             {/* 음성 입력 */}
       {inputMethod === 'voice' && (
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
       )}

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
               <Button onClick={resetInputMethod} variant="outline" className="flex-1">
                 다시 입력
               </Button>
               <Button onClick={createQuickOrder} className="flex-1">
                 🚀 주문 링크 생성
               </Button>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 