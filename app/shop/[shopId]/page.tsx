"use client"

import { notFound } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { OrderSessionCard } from "@/components/order-session-card"
import { StartNewOrderForm } from "@/components/start-new-order-form"
import { DeleteShopButton } from "@/components/delete-shop-button"

import { useToast } from "@/hooks/use-toast"
import { 
  Camera, 
  Upload, 
  X, 
  Edit3, 
  Loader2, 
  Plus, 
  Trash2, 
  RotateCcw,
  Save,
  Coffee,
  Users,
  Clock,
  Mic,
  MicOff,
  ArrowLeft
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  resetAllMenus, 
  addMultipleMenus 
} from "./actions"

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
  id?: string
  name: string
  description: string
  price: string
}

interface CoffeeShopDetailPageProps {
  params: {
    shopId: string
  }
}

export default function CoffeeShopDetailPage({ params }: CoffeeShopDetailPageProps) {
  const { shopId } = params
  const { toast } = useToast()
  
  // State management
  const [coffeeShop, setCoffeeShop] = useState<any>(null)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [orderSessions, setOrderSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Menu management states
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>({ name: '', description: '', price: '' })
  
  // Image upload states
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const [textInputCompleted, setTextInputCompleted] = useState(false)
  const [inputMethod, setInputMethod] = useState<'camera' | 'text' | 'voice' | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [voiceError, setVoiceError] = useState<string | null>(null)
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false)
  const [mounted, setMounted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Load data on component mount
  useEffect(() => {
    loadShopData()
  }, [shopId])

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

  async function loadShopData() {
    try {
      const supabase = createSupabaseBrowser()
      
      // Fetch coffee shop details
      const { data: shop, error: shopError } = await supabase
        .from("coffee_shops")
        .select("*")
        .eq("id", shopId)
        .single()

      if (shopError || !shop) {
        console.error("Error fetching coffee shop:", shopError)
        notFound()
      }
      setCoffeeShop(shop)

      // Fetch menu items
      const { data: menus, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("coffee_shop_id", shopId)
        .order("name", { ascending: true })

      if (menuError) {
        console.error("Error fetching menu items:", menuError)
      } else {
        setMenuItems(menus || [])
      }

      // Fetch order sessions
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          order_selections (
            id,
            participant_name,
            quantity,
            menu_item_id,
            menu_items (
              name,
              price
            )
          )
        `)
        .eq("coffee_shop_id", shopId)
        .order("created_at", { ascending: false })

      if (orderError) {
        console.error("Error fetching order sessions:", orderError)
      } else {
        setOrderSessions(orders || [])
      }
    } catch (error) {
      console.error("Error loading shop data:", error)
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
                         // Convert to the format expected by addMultipleMenus
             const menuData = menus.map((menu: any) => ({
               name: menu.name,
               description: menu.description || '',
               price: menu.price || "0"
             }))
            
            const result = await addMultipleMenus(shopId, menuData)
            if (result.success) {
              toast({
                title: "메뉴 추가 완료",
                description: `${menus.length}개의 메뉴를 추가했습니다.`
              })
              setCapturedImage(null)
              setShowImageUpload(false)
              loadShopData() // Reload data
            } else {
              toast({
                title: "메뉴 추가 실패",
                description: result.message,
                variant: "destructive"
              })
            }
          } else {
            setExtractionError("추출된 메뉴가 없습니다.")
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError)
          setExtractionError("메뉴 정보를 파싱할 수 없습니다.")
        }
      } else {
        setExtractionError(result.message)
      }
    } catch (err) {
      setExtractionError("메뉴 추출 중 오류가 발생했습니다.")
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleAddMenuItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newMenuItem.name) {
      toast({
        title: "입력 오류",
        description: "메뉴 이름을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    const formData = new FormData()
    formData.append('name', newMenuItem.name)
    formData.append('description', newMenuItem.description)
    formData.append('price', newMenuItem.price)

    const result = await addMenuItem(shopId, formData)
    if (result.success) {
      toast({
        title: "성공",
        description: result.message
      })
      setNewMenuItem({ name: '', description: '', price: '' })
      setShowAddForm(false)
      loadShopData()
    } else {
      toast({
        title: "오류",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  async function handleUpdateMenuItem(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem || !editingItem.name || !editingItem.id) {
      toast({
        title: "입력 오류",
        description: "메뉴 이름을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    const formData = new FormData()
    formData.append('name', editingItem.name)
    formData.append('description', editingItem.description || '')
    formData.append('price', editingItem.price)

    console.log('Updating menu item:', editingItem.id, editingItem.name, editingItem.price)
    const result = await updateMenuItem(shopId, editingItem.id, formData)
    if (result.success) {
      toast({
        title: "성공",
        description: result.message
      })
      setEditingItem(null)
      loadShopData()
    } else {
      toast({
        title: "오류",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  async function handleDeleteMenuItem(itemId: string) {
    const result = await deleteMenuItem(shopId, itemId)
    if (result.success) {
      toast({
        title: "성공",
        description: result.message
      })
      loadShopData()
    } else {
      toast({
        title: "오류",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  async function handleResetAllMenus() {
    if (!confirm("모든 메뉴를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return
    }

    const result = await resetAllMenus(shopId)
    if (result.success) {
      toast({
        title: "성공",
        description: result.message
      })
      loadShopData()
    } else {
      toast({
        title: "오류",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!coffeeShop) {
    return notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b pt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{coffeeShop.name}</h1>
              </div>
              {coffeeShop.address && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  {coffeeShop.address}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <DeleteShopButton shopId={shopId} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Start New Order Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="text-center">
            <p className="text-gray-600">새로운 주문 세션을 시작하세요</p>
          </CardHeader>
          <CardContent>
            <StartNewOrderForm shopId={shopId} shopName={coffeeShop.name} />
          </CardContent>
        </Card>

        {/* Menu Management Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
              </div>
              <div className="flex gap-2">
                {menuItems.length > 0 && (
                  <>
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      메뉴 추가
                    </Button>
                    <Button 
                      onClick={handleResetAllMenus}
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      전체 리셋
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Menu Input Section */}
            {showImageUpload && (
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <h3 className="text-lg font-semibold mb-2">메뉴 입력 방법 선택</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      카메라 촬영, 텍스트 입력, 또는 음성 입력으로 메뉴를 입력할 수 있습니다
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowImageUpload(false)
                      setInputMethod(null)
                      setCapturedImage(null)
                      setTextInput("")
                      setTextInputCompleted(false)
                      setVoiceText("")
                      resetVoiceInput()
                    }}
                    className="ml-4"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {!inputMethod ? (
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
                ) : inputMethod === 'camera' && !capturedImage ? (
                  <div className="space-y-4">
                    <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">메뉴판 촬영</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        카메라 앱으로 촬영하거나 갤러리에서 사진을 선택해주세요
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={startCamera} 
                          className="flex-1"
                          size="lg"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          카메라 앱으로 촬영
                        </Button>
                        <Button 
                          onClick={() => document.getElementById('file-input')?.click()} 
                          className="flex-1"
                          variant="outline"
                          size="lg"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          갤러리에서 선택
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

                    {!isExtracting && !extractionError && (
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
                    )}

                    {extractionError && (
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-600 mb-4">{extractionError}</p>
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
                            onClick={() => {
                              setExtractionError(null)
                              setCapturedImage(null)
                            }} 
                            variant="ghost"
                            className="flex-1"
                          >
                            취소
                          </Button>
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
            )}

            {/* Add Menu Form */}
            {showAddForm && (
              <div className="p-6 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">새 메뉴 추가</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewMenuItem({ name: '', description: '', price: '' })
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handleAddMenuItem} className="space-y-4">
                  <div>
                    <Label htmlFor="name">메뉴 이름 *</Label>
                    <Input
                      id="name"
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                      placeholder="예: 아메리카노"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                      placeholder="메뉴에 대한 설명을 입력하세요"
                      rows={3}
                    />
                  </div>

                                                       <div>
                    <Label htmlFor="price">가격 (원)</Label>
                    <Input
                      id="price"
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                      placeholder="가격을 입력하세요"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      메뉴 추가
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowAddForm(false)
                        setNewMenuItem({ name: '', description: '', price: '' })
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Menu Items List */}
            {menuItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">등록된 메뉴</h3>
                <div className="grid gap-4">
                  {menuItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      {editingItem?.id === item.id ? (
                        <form onSubmit={handleUpdateMenuItem} className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">메뉴 편집</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div>
                            <Label>메뉴 이름 *</Label>
                            <Input
                              value={editingItem?.name || ''}
                              onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label>설명</Label>
                            <Textarea
                              value={editingItem?.description || ''}
                              onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                              rows={2}
                            />
                          </div>

                          <div>
                            <Label>가격 (원)</Label>
                            <Input
                              value={editingItem?.price || ''}
                              onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                              placeholder="가격을 입력하세요"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm">
                              <Save className="w-4 h-4 mr-1" />
                              저장
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingItem(null)}
                            >
                              취소
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{item.name}</h4>
                            {item.description && (
                              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                            )}
                            <p className="text-blue-600 font-semibold mt-2">
                              {item.price}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteMenuItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {menuItems.length === 0 && !showAddForm && !showImageUpload && (
              <div className="text-center py-12">
                <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">메뉴가 없습니다</h3>
                <p className="text-gray-600 mb-6">첫 번째 메뉴를 추가해보세요!</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => setShowImageUpload(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    스마트 추가
                  </Button>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    직접 추가
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Sessions Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">Order Sessions</CardTitle>
            </div>
            <p className="text-gray-600">
              {orderSessions.length > 0 
                ? `${orderSessions.length}개의 주문 세션이 있습니다` 
                : "아직 주문 세션이 없습니다"
              }
            </p>
          </CardHeader>
          <CardContent>
            {orderSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orderSessions.map((order) => (
                  <OrderSessionCard
                    key={order.id}
                    shopId={shopId}
                    order={order}
                    orderSelections={order.order_selections || []}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">주문 세션이 없습니다</h3>
                <p className="text-gray-600">위에서 새로운 주문 세션을 시작해보세요!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </main>
  )
}
