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
import { MenuInputForm } from "@/components/menu-input-form"
import Link from "next/link"

import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Trash2, 
  RotateCcw,
  Save,
  Coffee,
  Users,
  Clock,
  X,
  Edit3
} from "lucide-react"
import { useState, useEffect } from "react"
import { 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  resetAllMenus, 
  addMultipleMenus 
} from "./actions"
import { formatPrice } from "@/lib/utils"

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
  const [showSmartAdd, setShowSmartAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>({ name: '', description: '', price: '' })

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

  async function handleAddMenuItem(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newMenuItem.name.trim()) {
      toast({
        title: "입력 오류",
        description: "메뉴 이름을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('name', newMenuItem.name)
      formData.append('description', newMenuItem.description)
      formData.append('price', newMenuItem.price)
      
      const result = await addMenuItem(shopId, formData)
      
      if (result.success) {
        toast({
          title: "메뉴 추가 완료",
          description: "새 메뉴가 추가되었습니다."
        })
        
        // Reload menu items
        await loadShopData()
        
        // Reset form
        setNewMenuItem({ name: '', description: '', price: '' })
        setShowAddForm(false)
      } else {
        toast({
          title: "메뉴 추가 실패",
          description: result.message || "메뉴 추가 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "메뉴 추가 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  async function handleUpdateMenuItem(e: React.FormEvent) {
    e.preventDefault()
    
    if (!editingItem?.id || !editingItem.name.trim()) {
      toast({
        title: "입력 오류",
        description: "메뉴 이름을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('name', editingItem.name)
      formData.append('description', editingItem.description)
      formData.append('price', editingItem.price)
      
      const result = await updateMenuItem(shopId, editingItem.id, formData)
      
      if (result.success) {
        toast({
          title: "메뉴 수정 완료",
          description: "메뉴가 수정되었습니다."
        })
        
        // Reload menu items
        await loadShopData()
        
        // Reset editing state
        setEditingItem(null)
      } else {
        toast({
          title: "메뉴 수정 실패",
          description: result.message || "메뉴 수정 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "메뉴 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  async function handleDeleteMenuItem(itemId: string) {
    try {
      const result = await deleteMenuItem(shopId, itemId)
      
      if (result.success) {
        toast({
          title: "메뉴 삭제 완료",
          description: "메뉴가 삭제되었습니다."
        })
        
        // Reload menu items
        await loadShopData()
      } else {
        toast({
          title: "메뉴 삭제 실패",
          description: result.message || "메뉴 삭제 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "메뉴 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  async function handleResetAllMenus() {
    if (!confirm("모든 메뉴를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return
    }

    try {
      const result = await resetAllMenus(shopId)
      
      if (result.success) {
        toast({
          title: "메뉴 초기화 완료",
          description: "모든 메뉴가 삭제되었습니다."
        })
        
        // Reload menu items
        await loadShopData()
      } else {
        toast({
          title: "메뉴 초기화 실패",
          description: result.message || "메뉴 초기화 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "메뉴 초기화 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleMenusExtracted = (menus: MenuItem[]) => {
    // 메뉴 추출 완료 시 호출 (여기서는 추가 작업 없음)
  }

  const handleMenusAdded = (menus: MenuItem[]) => {
    // 매장에 메뉴 추가 완료 시 호출
    loadShopData() // 메뉴 목록 새로고침
    setShowSmartAdd(false) // 스마트 추가 UI 닫기
  }

  const handleReset = () => {
    // 메뉴 입력 초기화 시 호출
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!coffeeShop) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pt-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{coffeeShop.name}</h1>
            <div className="flex flex-row items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Coffee className="w-4 h-4" />
                <span>{menuItems.length}개 메뉴</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{orderSessions.length}개 주문</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(coffeeShop.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <DeleteShopButton shopId={shopId} />
        </div>
      </div>

      {/* Quick Order Section */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">🚀 주문 취합 시작하기</h2>
              <p className="text-blue-100 mb-6">팀원들과 함께 주문할 수 있는 링크를 생성하세요</p>
              <div className="flex justify-center">
                <StartNewOrderForm shopId={shopId} shopName={coffeeShop.name} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Menu Management Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                </CardTitle>
              </div>
              <div className="flex flex-row gap-2">
                {menuItems.length > 0 && (
                  <>
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      variant="outline"
                      className="w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      메뉴 추가
                    </Button>
                    <Button 
                      onClick={handleResetAllMenus}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 w-auto"
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
            {/* Smart Menu Add Section */}
            {showSmartAdd && (
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-end mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSmartAdd(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <MenuInputForm 
                  onMenusExtracted={handleMenusExtracted}
                  onReset={handleReset}
                  shopId={shopId}
                  onMenusAdded={handleMenusAdded}
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
                      type="number"
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
            {menuItems.length === 0 ? (
              <div className="text-center py-12">
                <Coffee className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">메뉴가 없습니다</h3>
                <p className="text-gray-600 mb-4">첫 번째 메뉴를 추가해보세요</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    메뉴 추가
                  </Button>
                  <Button onClick={() => setShowSmartAdd(true)} variant="outline" className="w-full sm:w-auto">
                    <Edit3 className="w-4 h-4 mr-2" />
                    스마트 추가
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.price && (
                          <span className="text-sm font-semibold text-green-600">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Sessions Link */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              주문 세션 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">주문 세션 관리</h3>
              <p className="text-gray-600 mb-6">이 매장의 모든 주문 세션을 확인하고 관리할 수 있습니다</p>
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href={`/shop/${shopId}/orders`}>
                    <Users className="w-4 h-4 mr-2" />
                    주문 세션 보기 ({orderSessions.length}개)
                  </Link>
                </Button>
                <div className="text-sm text-gray-500">
                  최근 주문: {orderSessions.length > 0 ? new Date(orderSessions[0].created_at).toLocaleDateString() : '없음'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Menu Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>메뉴 수정</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateMenuItem} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">메뉴 이름 *</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    placeholder="예: 아메리카노"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description">설명</Label>
                  <Textarea
                    id="edit-description"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    placeholder="메뉴에 대한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-price">가격 (원)</Label>
                  <Input
                    id="edit-price"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                    placeholder="가격을 입력하세요"
                    type="number"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    수정 완료
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditingItem(null)}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
