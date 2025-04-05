"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [globalFund, setGlobalFund] = useState<number | null>(null);
  const [isLoadingFund, setIsLoadingFund] = useState(true);

  // Simulate fetching global fund
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingFund(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setGlobalFund(100000);
      } catch (error) {
        console.error("Failed to fetch global fund:", error);
      } finally {
        setIsLoadingFund(false);
      }
    };
    fetchInitialData();
  }, []);

  // Handle action button clicks
  const handleActionClick = (action: "borrow" | "deposit") => {
    if (!isLoggedIn) {
      // Redirect to login page instead of showing dialog
      router.push("/login");
      return;
    }

    // Handle logged-in user actions
    if (action === "borrow") {
      router.push("/borrow");
    } else {
      router.push("/deposit");
    }
  };

  return (
    <div className="space-y-8">
      {/* Global Fund Display */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFund ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <p className="text-lg">
              Current Global Fund:{" "}
              <span className="font-semibold">
                ₹{globalFund?.toLocaleString("en-IN") ?? "N/A"}
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            {isLoggedIn
              ? `Welcome back, ${user?.name}! Choose an action below.`
              : "Choose an action below or sign in to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => handleActionClick("borrow")}
          >
            Borrow Money
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            onClick={() => handleActionClick("deposit")}
          >
            Deposit Money
          </Button>
        </CardContent>
      </Card>

      {/* Account Access Section
      {!isLoggedIn && (
        <Card>
          <CardHeader>
            <CardTitle>Account Access</CardTitle>
            <CardDescription>
              Create an account or log in to access platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => router.push("/login")} className="flex-1">
              Login with Face ID
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/register")}
              className="flex-1"
            >
              Register New Account
            </Button>
          </CardContent>
        </Card>
      )} */}

      {/* Pending Approvals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Community Approvals</CardTitle>
          <CardDescription>
            Review loan and deposit requests from other users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoggedIn ? (
            <p className="text-muted-foreground italic">
              Loading pending requests... (Feature for later step)
            </p>
          ) : (
            <p className="text-muted-foreground italic">
              Please{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => router.push("/login")}
              >
                log in
              </Button>{" "}
              to see pending requests.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
