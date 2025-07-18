import type { Metadata } from 'next'
import './globals.css'
import { GNB } from "@/components/gnb"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <GNB />
        <div className="pt-20">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
