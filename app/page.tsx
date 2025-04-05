"use client"; // This page needs client-side hooks and interaction

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useFaceApiLoader } from "@/hooks/useFaceApiLoader";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

export default function Home() {
  const { loadingState: faceApiLoadingState, error: faceApiError } =
    useFaceApiLoader();
  const [globalFund, setGlobalFund] = useState<number | null>(null); // Start as null
  const [isLoadingFund, setIsLoadingFund] = useState(true);

  // Temporary simulation of fetching global fund on client
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingFund(true);
      try {
        // Simulate fetching - In reality, this should call an API route or use server props
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
        setGlobalFund(100000); // Set the initial value
      } catch (error) {
        console.error("Failed to fetch global fund:", error);
      } finally {
        setIsLoadingFund(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleBorrowClick = () => {
    // TODO: Check if logged in, if not redirect to register
    alert("Borrow Money Clicked - Redirect logic needed");
  };

  const handleDepositClick = () => {
    // TODO: Check if logged in, if not redirect to register
    alert("Deposit Money Clicked - Redirect logic needed");
  };

  return (
    <div className="space-y-8">
      {/* Face API Loading Status */}
      {faceApiLoadingState === "loading" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">
              Initializing Face Recognition
            </CardTitle>
            <CardDescription>Loading models, please wait...</CardDescription>
          </CardHeader>
        </Card>
      )}
      {faceApiLoadingState === "error" && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">
              Face Recognition Error
            </CardTitle>
            <CardDescription>
              {faceApiError || "Could not load face models."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {faceApiLoadingState === "loaded" && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">
              Face Recognition Ready
            </CardTitle>
            <CardDescription>Models loaded successfully.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Global Fund Display */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFund ? (
            <Skeleton className="h-6 w-48" /> // Skeleton loader
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
            Choose an action below. You may need to register first.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="flex-1" onClick={handleBorrowClick}>
            Borrow Money
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            onClick={handleDepositClick}
          >
            Deposit Money
          </Button>
        </CardContent>
      </Card>

      {/* Pending Approvals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Community Approvals</CardTitle>
          <CardDescription>
            Review loan and deposit requests from other users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">
            Pending requests will appear here once you are registered and logged
            in.
          </p>
        </CardContent>
      </Card>

      {/* Original Next.js content can go here if you want to keep it */}
      <div className="flex flex-col gap-4 items-center mt-8">
        <p className="text-center text-muted-foreground">
          Made by team SayWinners
        </p>
      </div>
    </div>
  );
}
