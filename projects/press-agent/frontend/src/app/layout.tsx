import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CopilotKit } from "@copilotkit/react-core"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Press Agent - AI-Powered Press Release Platform",
  description: "Automated press release creation and distribution with AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          agent="cl001"
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  )
}
