// app/deposit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Use for navigation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore"; // To check login status and get user ID
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export default function DepositPage() {
  const router = useRouter();

  // FIX: Use separate selectors to avoid object creation on each render
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  // Form state
  const [amount, setAmount] = useState(""); // Keep as string for easier input handling
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // State to handle initial auth check

  // Effect to check authentication status on load
  useEffect(() => {
    const checkAuth = () => {
      if (!isLoggedIn) {
        toast.error("Please log in to make a deposit.");
        router.push("/login"); // Redirect to login page if not logged in
      } else {
        setIsCheckingAuth(false); // Auth confirmed, allow rendering
      }
    };
    const timer = setTimeout(checkAuth, 100); // Delay for store hydration
    return () => clearTimeout(timer);
  }, [isLoggedIn, router]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only non-negative numbers (optional decimal support)
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Form submission handler
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.error("Authentication error. Please log in again.");
      router.push("/login");
      return;
    }

    const numericAmount = parseFloat(amount);
    // Client-side validation
    if (
      !amount ||
      isNaN(numericAmount) ||
      numericAmount <= 0 ||
      !details.trim()
    ) {
      toast.error("Please enter a valid positive amount and provide details.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Submitting deposit request...");

    const requestData = {
      userId: user.id,
      type: "deposit",
      amount: numericAmount,
      details: details.trim(),
    };

    try {
      console.log("Submitting Deposit Request:", requestData);

      const response = await fetch("/api/requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `Request failed (${response.status})`
        );
      }

      // Success
      toast.success("Deposit request submitted for approval!");
      console.log("Deposit Request Submitted:", result);

      // Navigate away
      router.push("/"); // Redirect to home page after success
    } catch (error: any) {
      console.error("Error submitting deposit request:", error);
      toast.error(`Submission failed: ${error.message}`);
      setIsSubmitting(false); // Keep form active on error
    }
  };

  // Render loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  // Main component render
  return (
    <div className="container mx-auto max-w-xl py-8 px-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Deposit Funds</CardTitle>
          <CardDescription>
            Submit a request to deposit funds into the global pool. This will
            require community approval.
            <br />
            Logged in as: {user?.name} ({user?.email})
            {/* Display current balance */}
            {user && (
              <span>
                {" "}
                | Current Balance: ₹
                {user.accountBalance?.toLocaleString("en-IN") ?? "N/A"}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Deposit Amount (INR) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 10000"
                value={amount}
                onChange={handleAmountChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label htmlFor="details">Reason / Details (Optional)</Label>
              <Textarea
                id="details"
                placeholder="You can add optional details about this deposit..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[100px]"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                Provide any context for the community.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                "Submit Deposit Request"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
