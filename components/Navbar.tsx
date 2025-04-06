// components/Navbar.tsx
"use client"; // This component will have client-side interaction

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LogOut,
  LogIn,
  UserPlus,
  Coins,
  Building2,
  Link as ChainLink,
  Wallet,
  IndianRupee,
} from "lucide-react"; // Add these imports
import { useAuthStore } from "@/store/authStore"; // Import auth store
import { useGlobalFundStore } from "@/store/globalFundStore"; // Import global fund store
import { useRouter, usePathname } from "next/navigation"; // Add pathname

export const Navbar: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuthStore();
  const { globalFund, fetchGlobalFund } = useGlobalFundStore();
  const router = useRouter();
  const pathname = usePathname();

  // Format number in Indian style for the navbar display
  const formatIndianNumber = (num: number) => {
    let result = "";
    const numStr = num.toString();
    const length = numStr.length;

    if (length <= 3) {
      return numStr;
    }

    result = numStr.substring(length - 3);

    let remaining = numStr.substring(0, length - 3);
    while (remaining.length > 0) {
      const chunk = remaining.substring(Math.max(0, remaining.length - 2));
      result = chunk + "," + result;
      remaining = remaining.substring(0, Math.max(0, remaining.length - 2));
    }

    return result;
  };

  // Fetch global fund on component mount
  useEffect(() => {
    fetchGlobalFund();
  }, [fetchGlobalFund]);

  // Handle logo click - use the global function exposed by HomePage
  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();

      // Call the global function exposed by HomePage if available
      if (
        typeof window !== "undefined" &&
        (window as any).resetHomePageScroll
      ) {
        (window as any).resetHomePageScroll();
      } else {
        // Fallback if function is not available
        window.scrollTo({
          top: 0,
          behavior: "auto",
        });
        fetchGlobalFund();
      }
    }
  };

  return (
    <nav className="bg-background/80 backdrop-blur border-b-2 border-border sticky top-0 z-50 w-full font-nunito relative overflow-hidden shadow-sm">
      {/* Background Icons */}
      <div className="absolute inset-0 opacity-10 pointer-events-none filter blur-[1px]">
        <Coins className="absolute top-2 left-8 w-4 h-4 text-primary/60" />
        <Building2 className="absolute top-3 left-32 w-4 h-4 text-primary/60" />
        <ChainLink className="absolute top-2 left-56 w-4 h-4 text-primary/60" />
        <Wallet className="absolute bottom-2 left-16 w-4 h-4 text-primary/60" />
        <IndianRupee className="absolute bottom-3 left-40 w-4 h-4 text-primary/60" />

        <Building2 className="absolute top-2 left-[25%] w-4 h-4 text-primary/60" />
        <Coins className="absolute bottom-2 left-[30%] w-4 h-4 text-primary/60" />
        <ChainLink className="absolute top-3 left-[35%] w-4 h-4 text-primary/60" />

        <Building2 className="absolute top-2 left-[45%] w-4 h-4 text-primary/60" />
        <Coins className="absolute bottom-2 left-[50%] w-4 h-4 -translate-x-1/2 text-primary/60" />
        <Wallet className="absolute top-3 left-[55%] w-4 h-4 text-primary/60" />

        <IndianRupee className="absolute top-2 right-[35%] w-4 h-4 text-primary/60" />
        <Building2 className="absolute bottom-2 right-[30%] w-4 h-4 text-primary/60" />
        <ChainLink className="absolute top-3 right-[25%] w-4 h-4 text-primary/60" />

        <Wallet className="absolute top-2 right-8 w-4 h-4 text-primary/60" />
        <Coins className="absolute bottom-2 right-32 w-4 h-4 text-primary/60" />
        <IndianRupee className="absolute top-3 right-56 w-4 h-4 text-primary/60" />

        <Building2 className="absolute top-1/2 left-[20%] w-4 h-4 -translate-y-1/2 text-primary/60" />
        <ChainLink className="absolute top-1/2 right-[20%] w-4 h-4 -translate-y-1/2 text-primary/60" />
      </div>

      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative z-10">
        {/* Left Side - Logo & App Name */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={handleLogoClick}
        >
          <Image
            src="/images/logo.svg"
            alt="DhanSetu Logo"
            width={400}
            height={400}
            className="w-24 h-24 object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex items-center gap-2">
            <span
              className="font-black text-4xl bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent 
              drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] 
              group-hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)] 
              transition-all duration-300 
              font-pt-sans tracking-wider"
            >
              DhanSetu
            </span>
            <Coins className="w-6 h-6 text-primary animate-pulse drop-shadow-md" />
          </div>
        </Link>

        {/* Right Side - Dynamic Fund Display */}
        <div className="flex items-center">
          <div className="hidden sm:flex items-center gap-3">
            {/* Fund Display Container */}
            <div
              className={`flex items-center rounded-lg overflow-hidden
              bg-background/40 backdrop-blur-sm border border-border/80
              shadow-[0_2px_8px_rgba(0,0,0,0.1)]
              transition-all duration-300 ease-in-out
              ${isLoggedIn ? "px-4 py-2" : "px-3 py-1.5"}`}
            >
              {/* Global Fund Section */}
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground">
                    Global Fund
                  </span>
                  <span className="font-semibold text-xs text-foreground">
                    ₹
                    {globalFund ? formatIndianNumber(globalFund) : "Loading..."}
                  </span>
                </div>
              </div>

              {isLoggedIn && (
                <>
                  {/* Animated Separator */}
                  <div
                    className="mx-3 h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent
                    animate-appear transition-all duration-300"
                  />

                  {/* User Balance Section */}
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground">
                        My Balance
                      </span>
                      <span className="font-semibold text-xs text-foreground">
                        ₹{user ? formatIndianNumber(user.accountBalance) : "0"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Controls */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {user?.name}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={logout}
                  className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="h-7 px-3 text-xs bg-primary/90 hover:bg-primary text-primary-foreground"
                >
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Login
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/register")}
                  className="h-7 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
