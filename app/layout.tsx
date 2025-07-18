import type { Metadata } from 'next'
import './globals.css'
import { GNB } from "@/components/gnb"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: '주문취합앱 - 팀 주문 취합 서비스',
  description: '팀원들과 함께 주문할 때 복잡한 계산과 정산을 간편하게 해주는 실시간 주문 취합 서비스입니다.',
  keywords: '주문, 취합, 팀, 실시간, 공유, 계산',
  authors: [{ name: '주문취합앱' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <GNB />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
