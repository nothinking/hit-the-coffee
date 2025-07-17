"use client";
import { deleteOrderSelection } from "@/app/shop/[shopId]/actions";
import { useRouter } from "next/navigation";

export default function OrderSelectionDeleteButton({ shopId, selectionId }: { shopId: string, selectionId: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await deleteOrderSelection(shopId, selectionId);
        router.refresh();
      }}
      className="rounded text-red-600 hover:text-red-700 px-2 py-1 transition"
      title="삭제"
    >
      🗑️
    </button>
  );
} 