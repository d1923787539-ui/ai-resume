import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: "AI Resume - Smart Resume Optimization",
  description: "AI-powered resume analysis from an HR perspective",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-50">
        <Header />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  )
}
