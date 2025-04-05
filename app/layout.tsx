import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster as Sonner } from "@/components/ui/sonner"; // Import Sonner Toaster

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "DhanSetu",
  description: "P2P Emergecny Fund",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // --- Placeholder Data ---
  const placeholderGlobalFund = 100000;
  const placeholderIsLoggedIn = false;
  const placeholderUserName = null;
  const placeholderUserBalance = null;
  // --- End Placeholder Data ---

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${ptSans.variable} antialiased relative bg-background text-foreground font-nunito`}
      >
        <div className="texture fixed inset-0 opacity-5 z-[-1]" />
        <Navbar
          globalFund={placeholderGlobalFund}
          isLoggedIn={placeholderIsLoggedIn}
          userName={placeholderUserName}
          userBalance={placeholderUserBalance}
        />
        <main className="container mx-auto px-4 py-8">{children}</main>
        <Sonner richColors closeButton /> {/* Add Sonner Toaster here */}
      </body>
    </html>
  );
}
