"use client"

import { useState, type FormEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, X, Edit3, Loader2 } from "lucide-react"

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
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractedMenus, setExtractedMenus] = useState<MenuItem[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [editingMenus, setEditingMenus] = useState<MenuItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
  async function startCamera() {
    try {
      // 모바일에서는 후면 카메라를 우선적으로 사용
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
        description: "카메라에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.",
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
      // Convert base64 to blob
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
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Register Coffee Shop</CardTitle>
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

            {!capturedImage ? (
              <div className="space-y-4">
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
                      >
                        🔍 메뉴 정보 추출하기
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
                        >
                        🔄 다시 시도
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
      {showCamera && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
        </div>
      )}
    </main>
  )
}
