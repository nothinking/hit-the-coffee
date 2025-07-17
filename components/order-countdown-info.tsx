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
      {title && <div className="text-xl font-semibold mt-2">{title}</div>}
      {address && <CardDescription className="text-gray-600">{address}</CardDescription>}
      <div className="mt-2 text-sm text-gray-700">
        생성시각: {new Date(createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
        {expiresAt && (
          <>
            <span className="mx-2">|</span>
            <span className="text-red-600 font-semibold">만료시각: {new Date(expiresAt!).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span>
            {remainingText && <span className="ml-2 font-semibold text-orange-600">{remainingText}</span>}
          </>
        )}
      </div>
    </div>
  );
} 