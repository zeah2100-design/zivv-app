import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "zivv - منصة التواصل الاجتماعي الذكية",
  description: "منصة تواصل اجتماعي آمنة، ذكية، واحترافية",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
