"use client";
import { deleteOrderSelection } from "@/app/shop/[shopId]/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRefreshContext } from "./auto-refresh-wrapper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OrderSelectionDeleteButton({ shopId, selectionId }: { shopId: string, selectionId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // 자동 새로고침 컨텍스트 사용 (가능한 경우)
  let pauseAutoRefresh: (() => void) | null = null;
  let resumeAutoRefresh: (() => void) | null = null;
  
  try {
    const refreshContext = useRefreshContext();
    pauseAutoRefresh = refreshContext.pauseAutoRefresh;
    resumeAutoRefresh = refreshContext.resumeAutoRefresh;
  } catch (error) {
    // AutoRefreshWrapper 외부에서 사용될 때는 무시
  }

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setIsOpen(false);
    
    // 자동 새로고침 일시 중지
    if (pauseAutoRefresh) {
      pauseAutoRefresh();
    }
    
    try {
      const result = await deleteOrderSelection(shopId, selectionId);
      if (result.success) {
        toast({
          title: "삭제 완료",
          description: "주문이 삭제되었습니다.",
        });
        // 즉시 페이지를 새로고침하여 UI 업데이트
        router.refresh();
      } else {
        toast({
          title: "삭제 실패",
          description: result.message || "주문 삭제에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("삭제 중 오류:", error);
      toast({
        title: "오류",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      
      // 자동 새로고침 재개
      if (resumeAutoRefresh) {
        setTimeout(() => {
          resumeAutoRefresh();
        }, 2000); // 2초 후 자동 새로고침 재개
      }
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={isDeleting}
          className="rounded text-red-600 hover:text-red-700 px-2 py-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="삭제"
        >
          {isDeleting ? (
            <span className="animate-spin">⏳</span>
          ) : (
            "🗑️"
          )}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>주문 삭제 확인</AlertDialogTitle>
          <AlertDialogDescription>
            정말로 이 주문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 