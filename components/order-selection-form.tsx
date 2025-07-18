"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { submitOrderSelections } from "@/app/order/[shareCode]/actions"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
}

interface OrderSelectionFormProps {
  orderId: string
  menuItems: MenuItem[]
  orderStatus: string
}

export function OrderSelectionForm({ orderId, menuItems, orderStatus }: OrderSelectionFormProps) {
  const { toast } = useToast()

  /* UI state */
  const [participantName, setParticipantName] = useState("")
  const [selected, setSelected] = useState<Record<string, number>>({}) // itemId → qty
  const [isPending, startTransition] = useTransition() // isPending tracks the transition status
  const [showNamePopup, setShowNamePopup] = useState(false)

  const orderClosed = orderStatus === "closed"

  /* Helpers -------------------------------------------------------------- */
  const toggleItem = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev }
      checked ? (next[id] = 1) : delete next[id]
      return next
    })

  const setQty = (id: string, qty: number) =>
    setSelected((prev) => {
      const next = { ...prev }
      qty > 0 ? (next[id] = qty) : delete next[id]
      return next
    })

  /* Submit ---------------------------------------------------------------- */
  function handleOrderButtonClick() {
    const selections = Object.entries(selected).map(([itemId, quantity]) => ({ itemId, quantity }))
    if (selections.length === 0) {
      toast({ title: "No items selected", description: "Choose at least one menu item.", variant: "destructive" })
      return
    }
    setShowNamePopup(true)
  }

  async function handleSubmitOrder() {
    if (!participantName.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" })
      return
    }

    const selections = Object.entries(selected).map(([itemId, quantity]) => ({ itemId, quantity }))
    
    console.log("4. Starting transition for submitOrderSelections...")
    startTransition(async () => {
      console.log("5. Inside startTransition. Calling submitOrderSelections...");
      try {
        const result = await submitOrderSelections(null, orderId, participantName.trim(), selections);
        console.log("6. submitOrderSelections returned:", result);

        if (result && result.success) {
          toast({ title: "Order submitted!", description: result.message });
          setSelected({}); // 체크내역 리셋
          setParticipantName(""); // 이름 입력란도 리셋
          setShowNamePopup(false); // 팝업 닫기
        } else {
          toast({
            title: "Submission failed",
            description: result?.message ?? "Unknown error",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error in submitOrderSelections:", error);
        toast({
          title: "Submission failed",
          description: "An error occurred while submitting your order.",
          variant: "destructive",
        });
      }
      console.log("7. Finished inside startTransition.");
    });
    console.log("8. handleSubmit finished (outside startTransition).")
  }

  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {orderClosed ? (
        <div className="flex flex-col items-center justify-center py-8">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#FFD600"/>
            <path d="M40 20 L44 36 L60 36 L46 44 L50 60 L40 50 L30 60 L34 44 L20 36 L36 36 Z" fill="#FF5252"/>
            <text x="40" y="75" textAnchor="middle" fontSize="18" fill="#333" fontWeight="bold">끝!</text>
          </svg>
          <div className="mt-4 text-lg font-bold text-red-600">주문이 마감되었습니다!</div>
        </div>
      ) : (
        <>
          {/* Menu list ---------------------------------------------------- */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Select Your Items</h3>
            {menuItems.length === 0 ? (
              <p className="text-gray-500">No menu items available.</p>
            ) : (
              <div className="grid gap-4">
                {menuItems.map((item) => (
                  <Card key={item.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={item.id in selected}
                        onCheckedChange={(c) => toggleItem(item.id, c as boolean)}
                        disabled={isPending}
                      />
                      <div className="leading-tight">
                        <Label htmlFor={`item-${item.id}`} className="font-medium cursor-pointer">
                          {item.name}
                        </Label>
                        {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.price.toFixed(2)}</span>
                      {item.id in selected && (
                        <Input
                          type="number"
                          min={1}
                          value={selected[item.id]}
                          onChange={(e) => setQty(item.id, Number(e.target.value))}
                          className="w-20 text-center"
                          disabled={isPending}
                        />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submit -------------------------------------------------------- */}
          <Button 
            onClick={handleOrderButtonClick}
            className="w-full" 
            disabled={isPending || menuItems.length === 0}
          >
            {isPending ? "Submitting…" : "Submit My Order"}
          </Button>
        </>
      )}

      {/* Name Input Popup */}
      {showNamePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Enter Your Name</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="popup-participant-name">Your Name</Label>
                <Input
                  id="popup-participant-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSubmitOrder()
                    }
                  }}
                  placeholder="e.g. Jane"
                  autoFocus
                  disabled={isPending}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitOrder}
                  className="flex-1"
                  disabled={isPending}
                >
                  {isPending ? "Submitting…" : "Submit Order"}
                </Button>
                <Button 
                  onClick={() => {
                    setShowNamePopup(false)
                    setParticipantName("")
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
