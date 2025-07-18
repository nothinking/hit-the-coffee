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
  Clock
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  resetAllMenus, 
  addMultipleMenus 
} from "./actions"

interface MenuItem {
  id?: string
  name: string
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
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>({ name: '', price: '' })
  
  // Image upload states
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load data on component mount
  useEffect(() => {
    loadShopData()
  }, [shopId])

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
  async function startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setShowCamera(true)
    } catch (err) {
      console.error("Camera error:", err)
      toast({
        title: "Camera Error",
        description: "카메라에 접근할 수 없습니다.",
        variant: "destructive"
      })
    }
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

  async function extractMenuInfo() {
    if (!capturedImage) return

    setIsExtracting(true)
    setExtractionError(null)
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
                         // Convert to the format expected by addMultipleMenus
             const menuData = menus.map((menu: any) => ({
               name: menu.name,
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
    if (!newMenuItem.name || !newMenuItem.price) {
      toast({
        title: "입력 오류",
        description: "메뉴 이름과 가격을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    const formData = new FormData()
    formData.append('name', newMenuItem.name)
    formData.append('price', newMenuItem.price)

    const result = await addMenuItem(shopId, formData)
    if (result.success) {
      toast({
        title: "성공",
        description: result.message
      })
      setNewMenuItem({ name: '', price: '' })
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
    if (!editingItem || !editingItem.name || !editingItem.price || !editingItem.id) {
      toast({
        title: "입력 오류",
        description: "메뉴 이름과 가격을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    const formData = new FormData()
    formData.append('name', editingItem.name)
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
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{coffeeShop.name}</h1>
              {coffeeShop.address && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  {coffeeShop.address}
                </p>
              )}
            </div>
            <DeleteShopButton shopId={shopId} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Start New Order Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Start New Order</CardTitle>
            <p className="text-gray-600">새로운 주문 세션을 시작하세요</p>
          </CardHeader>
          <CardContent>
            <StartNewOrderForm shopId={shopId} />
          </CardContent>
        </Card>

        {/* Menu Management Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Menu Management</CardTitle>
                <p className="text-gray-600 mt-1">
                  {menuItems.length > 0 
                    ? `${menuItems.length}개의 메뉴가 등록되어 있습니다` 
                    : "등록된 메뉴가 없습니다"
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {menuItems.length === 0 ? (
                  <Button 
                    onClick={() => setShowImageUpload(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    이미지로 메뉴 추가
                  </Button>
                ) : (
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
            {/* Image Upload Section */}
            {showImageUpload && (
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">메뉴판 이미지 업로드</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    메뉴판 사진을 찍어서 자동으로 메뉴를 등록할 수 있습니다
                  </p>
                </div>

                {!capturedImage ? (
                  <div className="flex gap-2">
                    <Button 
                      onClick={startCamera} 
                      className="flex-1"
                      variant="outline"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      카메라로 촬영
                    </Button>
                    <Button 
                      onClick={() => document.getElementById('file-input')?.click()} 
                      className="flex-1"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      파일 선택
                    </Button>
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
                      >
                        🔍 메뉴 정보 추출하기
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
                          >
                            🔄 다시 시도
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
                      setNewMenuItem({ name: '', price: '' })
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
                     <Label htmlFor="price">가격 (원) *</Label>
                     <Input
                       id="price"
                       value={newMenuItem.price}
                       onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                       placeholder="가격을 입력하세요"
                       required
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
                        setNewMenuItem({ name: '', price: '' })
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
                            <Label>가격 (원) *</Label>
                            <Input
                              value={editingItem?.price || ''}
                              onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                              placeholder="가격을 입력하세요"
                              required
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
                    이미지로 추가
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

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg p-4 max-w-md w-full mx-4">
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
        </div>
      )}
    </main>
  )
}
