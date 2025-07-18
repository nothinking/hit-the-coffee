"use client"
import React, { useEffect, useState } from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";

interface OrderCountdownInfoProps {
  createdAt: string;
  expiresAt?: string;
  title?: string;
  address?: string;
}

export function OrderCountdownInfo({ createdAt, expiresAt, title, address }: OrderCountdownInfoProps) {
  const [remainingText, setRemainingText] = useState<string | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    let timer: NodeJS.Timeout;
    function updateRemaining() {
      const expires = new Date(expiresAt!);
      const now = new Date();
      const diff = expires.getTime() - now.getTime();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setRemainingText(`남은 시간: ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      } else {
        setRemainingText("만료됨");
      }
    }
    updateRemaining();
    timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="text-center">
      {title && <div className="text-2xl font-bold mt-3 mb-2 text-gray-900">{title}</div>}
      {address && <CardDescription className="text-gray-600">{address}</CardDescription>}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div>생성시각: {new Date(createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</div>
        {expiresAt && (
          <>
            <div>만료시각: {new Date(expiresAt!).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</div>
            {remainingText && <div className="text-orange-500 font-medium">{remainingText}</div>}
          </>
        )}
      </div>
    </div>
  );
} 