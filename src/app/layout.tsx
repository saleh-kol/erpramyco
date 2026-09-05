import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP Ramyco | سیستم یکپارچه مدیریت",
  description: "سیستم نگهداری و تعمیرات + حقوق و دستمزد",
};

// ... imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}