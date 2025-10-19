import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "@/components/providers";
import { BRAND_FULL } from "@/lib/config";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";


export const metadata: Metadata = {
  title: BRAND_FULL,
  description: "内部相册平台 · 让创作与资料协同更高效",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background font-sans antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
