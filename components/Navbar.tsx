// components/Navbar.tsx
"use client"; // This component will have client-side interaction

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, LogIn, UserPlus } from "lucide-react"; // Added UserPlus icon for registration
import { useAuthStore } from "@/store/authStore"; // Import auth store
import { useGlobalFundStore } from "@/store/globalFundStore"; // Import global fund store
import { useRouter } from "next/navigation"; // Add router for navigation

export const Navbar: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuthStore();
  const { globalFund, fetchGlobalFund } = useGlobalFundStore();
  const router = useRouter();

  // Fetch global fund on component mount
  useEffect(() => {
    fetchGlobalFund();
    // Consider adding an interval refresh if you want real-time updates
    // const intervalId = setInterval(fetchGlobalFund, 60000); // Refresh every minute
    // return () => clearInterval(intervalId);
  }, [fetchGlobalFund]);

  return (
    <nav className="bg-background/80 backdrop-blur border-b border-border sticky top-0 z-50 w-full font-nunito">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side - App Name/Logo */}
        <Link href="/" className="font-bold text-xl text-primary font-pt-sans">
          DhanSetu
        </Link>

        {/* Right Side - Funds & User Info */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Global Fund */}
          <div className="text-sm hidden sm:block">
            <span className="text-muted-foreground">Global Fund:</span>{" "}
            <span className="font-semibold">
              ₹{globalFund?.toLocaleString("en-IN") ?? "Loading..."}
            </span>
          </div>

          {isLoggedIn && user ? (
            <>
              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />
              {/* User Balance */}
              <div className="text-sm hidden sm:block">
                <span className="text-muted-foreground">My Balance:</span>{" "}
                <span className="font-semibold">
                  ₹{user.accountBalance.toLocaleString("en-IN")}
                </span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              {/* User Name */}
              <span className="text-sm font-medium hidden md:block">
                {user.name}
              </span>
              {/* Logout Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={logout}
                title="Logout"
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />
              {/* Login Button - Navigates to dedicated login page */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => router.push("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Button>
              {/* Register Button - Navigates to dedicated register page */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/register")}
                className="ml-2"
              >
                <UserPlus className="mr-2 h-4 w-4" /> Register
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
