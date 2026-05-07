import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ProjectsProvider } from "@/hooks/use-projects"
import { TimeEntriesProvider } from "@/hooks/use-time-entries"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Timesheet App",
  description: "A lightweight timesheet app for solo consultants",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProjectsProvider>
          <TimeEntriesProvider>{children}</TimeEntriesProvider>
        </ProjectsProvider>
      </body>
    </html>
  )
}
