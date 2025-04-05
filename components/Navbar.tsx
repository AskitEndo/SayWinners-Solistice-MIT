// components/Navbar.tsx
"use client"; // This component will have client-side interaction eventually

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"; // Import Separator

// Temporary props - these will be replaced with real data later
interface NavbarProps {
  globalFund: number;
  userBalance: number | null; // Null if not logged in
  userName: string | null; // Null if not logged in
  isLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  globalFund,
  userBalance,
  userName,
  isLoggedIn,
}) => {
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
              ₹{globalFund.toLocaleString("en-IN")}
            </span>
          </div>

          {isLoggedIn && userName && userBalance !== null && (
            <>
              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />
              {/* User Balance */}
              <div className="text-sm hidden sm:block">
                <span className="text-muted-foreground">My Balance:</span>{" "}
                <span className="font-semibold">
                  ₹{userBalance.toLocaleString("en-IN")}
                </span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              {/* User Name */}
              <span className="text-sm font-medium hidden md:block">
                {userName}
              </span>
              {/* We can add a logout button or user dropdown here later */}
            </>
          )}

          {!isLoggedIn && (
            <Link href="/register">
              {" "}
              {/* Link to registration page (we'll create this later) */}
              <Button size="sm" variant="default">
                {" "}
                {/* Use Shadcn Button */}
                Login / Register
              </Button>
            </Link>
          )}
          {/* Add Logout button or similar later */}
        </div>
      </div>
    </nav>
  );
};
