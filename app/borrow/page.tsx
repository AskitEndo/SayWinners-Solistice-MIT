"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

// Define loan categories
const LOAN_CATEGORIES = [
  "Home Improvement",
  "Wedding Expenses",
  "Business Startup",
  "Agricultural Needs",
  "Medical Emergency",
  "Education Fees",
  "Debt Consolidation",
  "Vehicle Purchase",
  "Travel",
  "Other",
];

export default function BorrowPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(""); // Keep as string for easier input handling
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // State to handle initial auth check

  // Effect to check authentication status on load
  useEffect(() => {
    // Give Zustand store a moment to hydrate on the client
    const checkAuth = () => {
      if (!isLoggedIn) {
        toast.error("Please log in to request a loan.");
        router.push("/login"); // Redirect to login page if not logged in
      } else {
        setIsCheckingAuth(false); // Auth confirmed, allow rendering
      }
    };
    // Use setTimeout to avoid race condition with store hydration
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer); // Cleanup timer
  }, [isLoggedIn, router]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only non-negative numbers (optional decimal support)
    const value = e.target.value;
    // Regex allows digits, optional single decimal point, then more digits
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Form submission handler
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Re-check user auth just before submitting
    if (!user) {
      toast.error("Authentication error. Please log in again.");
      router.push("/login");
      return;
    }

    const numericAmount = parseFloat(amount);
    // Client-side validation
    if (
      !title.trim() ||
      !category ||
      !amount ||
      isNaN(numericAmount) ||
      numericAmount <= 0 ||
      !details.trim()
    ) {
      toast.error("Please fill in all fields with valid values.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Submitting loan request...");

    const requestData = {
      userId: user.id, // Get user ID from the logged-in user state
      type: "loan", // Specify the request type
      title: title.trim(),
      category: category,
      amount: numericAmount, // Send the parsed number
      details: details.trim(),
    };

    try {
      console.log("Submitting Loan Request:", requestData);

      const response = await fetch("/api/requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Use error message from API if available
        throw new Error(
          result.message || `Request failed (${response.status})`
        );
      }

      // Success
      toast.success("Loan request submitted for approval!");
      console.log("Loan Request Submitted:", result);

      // Navigate away
      router.push("/");
    } catch (error: any) {
      console.error("Error submitting loan request:", error);
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

  // Main component render (only if authenticated)
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
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
          <CardTitle>Request a New Loan</CardTitle>
          <CardDescription>
            Fill out the details below. Your request will be reviewed by the
            community.
            <br />
            Logged in as: {user?.name} ({user?.email})
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Loan Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Loan Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Emergency Medical Fund, Farm Equipment Purchase"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                A brief, descriptive title (max 100 chars).
              </p>
            </div>

            {/* Category and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a loan category" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Loan Amount (INR) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="text" // Keep text for flexible input
                  inputMode="decimal" // Hint for mobile keyboards
                  placeholder="e.g., 50000"
                  value={amount}
                  onChange={handleAmountChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label htmlFor="details">
                Details & Justification{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="details"
                placeholder="Explain why you need the loan, how you plan to use it, and any relevant background information for the community to consider..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                disabled={isSubmitting}
                className="min-h-[150px]" // Increased height
                maxLength={1500} // Increased length
              />
              <p className="text-xs text-muted-foreground">
                Provide clear details (max 1500 chars).
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
                "Submit Loan Request"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
