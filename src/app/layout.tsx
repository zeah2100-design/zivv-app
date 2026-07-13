import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/db/auth-server";

export const metadata: Metadata = {
  title: "zivv · منصة التواصل الذكية",
  description:
    "zivv — منصة تواصل اجتماعي آمنة، ذكية، واحترافية مع مساعد MiniMax الذكي.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
