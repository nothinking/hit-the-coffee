"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { UploadCloud, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface MenuItem {
  name: string;
  price: number;
}

interface MenuItemFormProps {
  shopId: string
}

export function MenuItemForm({ shopId }: MenuItemFormProps) {
  const { toast } = useToast()
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([{ name: "", price: 0 }]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setLoadingImage(true);
      const formData = new FormData();
      formData.append("image", file);
      fetch("/api/extract-menu-info", {
        method: "POST",
        body: formData,
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.text) {
            // Gemini 결과에서 JSON 추출 시도 (코드블록 제거)
            try {
              let text = data.text.trim();
              if (text.startsWith("```")) {
                text = text.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
              }
              const arr = JSON.parse(text);
              if (Array.isArray(arr) && arr.length > 0) {
                setMenuItems(arr.map((item: any) => ({
                  name: item.name || "",
          
                  price: Number(item.price) || 0
                })));
              }
            } catch {
              // 파싱 실패 시 무시
            }
          }
        })
        .finally(() => setLoadingImage(false));
    }
  }

  function handleMenuItemChange(idx: number, field: keyof MenuItem, value: string | number) {
    setMenuItems(items => items.map((item, i) =>
      i === idx ? { ...item, [field]: field === "price" ? Number(value) : value } : item
    ));
  }

  function handleAddMenuItem() {
    setMenuItems(items => [...items, { name: "", price: 0 }]);
  }

  function handleRemoveMenuItem(idx: number) {
    setMenuItems(items => items.length === 1 ? items : items.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // 유효성 검사
    if (!menuItems.every(item => item.name.trim())) {
      toast({ title: "Error", description: "모든 메뉴 이름을 입력하세요.", variant: "destructive" });
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/menu/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, menus: menuItems })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "메뉴가 등록되었습니다." });
        setMenuItems([{ name: "", price: 0 }]);
        setImageFile(null);
        formRef.current?.reset();
        router.refresh();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "등록 실패", variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="image-upload" className="block cursor-pointer select-none">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-10 px-6 w-full max-w-xl mx-auto bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-100 transition-colors">
            <UploadCloud className="w-12 h-12 text-blue-500 mb-2" />
            <span className="font-semibold text-lg text-blue-700 mb-1">메뉴판 이미지로 자동 등록하기</span>
            <span className="text-sm text-blue-600">여기에 이미지를 드래그하거나 클릭해서 업로드하세요</span>
          </div>
          <input
            id="image-upload"
            name="image"
            type="file"
            accept="image/*"
            capture="environment"
            disabled={loading || loadingImage}
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
        {loadingImage && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground justify-center">
            <Loader2 className="animate-spin w-4 h-4" />
            이미지에서 메뉴 추출 중...
          </div>
        )}
      </div>
      {menuItems.map((item, idx) => (
        <div key={idx} className="border p-4 rounded-md space-y-2 relative">
          <div className="space-y-1">
            <Label>Item Name</Label>
            <Input
              required
              disabled={loading}
              value={item.name}
              onChange={e => handleMenuItemChange(idx, "name", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Price</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              disabled={loading}
              value={item.price}
              onChange={e => handleMenuItemChange(idx, "price", e.target.value)}
            />
          </div>
          {menuItems.length > 1 && (
            <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => handleRemoveMenuItem(idx)}>
              삭제
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={handleAddMenuItem} disabled={loading}>
        + 메뉴 추가
      </Button>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "등록 중..." : "메뉴 등록"}
      </Button>
    </form>
  )
}
