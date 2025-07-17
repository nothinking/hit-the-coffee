"use client"

import { useState, useActionState, useTransition, type FormEvent } from "react"
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
  // Add wrapper to match useActionState signature
  const actionWrapper = async (_prevState: unknown, { orderId, participantName, selections }: { orderId: string, participantName: string, selections: { itemId: string, quantity: number }[] }) => {
    return await submitOrderSelections(_prevState, orderId, participantName, selections)
  }
  // Explicitly type serverState to match the return type
  const [serverState, formAction] = useActionState<
    { success: boolean; message: string } | null,
    { orderId: string; participantName: string; selections: { itemId: string; quantity: number }[] }
  >(actionWrapper, null)
  const [isPending, startTransition] = useTransition() // isPending tracks the transition status

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
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    console.log("1. handleSubmit called.")
    e.preventDefault() // Prevent default form submission (page refresh)

    if (!participantName.trim()) {
      console.log("2. Validation failed: Name required.")
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" })
      return
    }
    const selections = Object.entries(selected).map(([itemId, quantity]) => ({ itemId, quantity }))
    if (selections.length === 0) {
      console.log("3. Validation failed: No items selected.")
      toast({ title: "No items selected", description: "Choose at least one menu item.", variant: "destructive" })
      return
    }

    console.log("4. Starting transition for formAction...")
    startTransition(async () => {
      console.log("5. Inside startTransition. Calling formAction...");
      const result = await formAction({ orderId, participantName: participantName.trim(), selections }) as unknown as { success: boolean; message: string } | null;
      console.log("6. formAction returned:", result);

      if (result && typeof result === "object" && "success" in result) {
        if (result.success) {
          toast({ title: "Order submitted!", description: result.message });
          setSelected({});
        } else {
          toast({
            title: "Submission failed",
            description: result.message ?? "Unknown error",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Submission failed",
          description: "Unknown error",
          variant: "destructive",
        });
      }
      console.log("7. Finished inside startTransition.");
      // Do not return result here; startTransition expects void
    });
    console.log("8. handleSubmit finished (outside startTransition).")
  }

  /* ---------------------------------------------------------------------- */
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {orderClosed ? (
        <p className="text-center text-red-600 font-semibold py-8">
          This order session is closed. You can no longer submit selections.
        </p>
      ) : (
        <>
          {/* Name ---------------------------------------------------------- */}
          <div className="space-y-2">
            <Label htmlFor="participant-name">Your Name</Label>
            <Input
              id="participant-name"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="e.g. Jane"
              required
              disabled={isPending}
            />
          </div>

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
                      <span className="font-semibold">${item.price.toFixed(2)}</span>
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
          <Button type="submit" className="w-full" disabled={isPending || menuItems.length === 0}>
            {isPending ? "Submitting…" : "Submit My Order"}
          </Button>
        </>
      )}
    </form>
  )
}
