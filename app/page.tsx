"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/authStore";
import { useGlobalFundStore } from "@/store/globalFundStore";
import { FaceVerification } from "@/components/FaceVerification";
import { Request as LoanRequest } from "@/lib/types";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { LoanRequestCard } from "@/components/LoanRequestCard";

// Define the extended type received from the API
interface PendingRequestResponse extends LoanRequest {
  requesterName: string;
}

export default function HomePage() {
  // Use separate selectors to avoid infinite loop issue
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  // Use the global fund store instead of local state
  const {
    globalFund,
    isLoading: isLoadingFund,
    fetchGlobalFund,
  } = useGlobalFundStore();

  const router = useRouter();
  const [showVerification, setShowVerification] = useState(false);

  // State for pending requests and voting
  const [pendingRequests, setPendingRequests] = useState<
    PendingRequestResponse[]
  >([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [votingState, setVotingState] = useState<{
    [requestId: string]: boolean;
  }>({});

  // Fetch pending requests function
  const fetchPendingRequests = async () => {
    if (!isLoggedIn) {
      setPendingRequests([]); // Clear if logged out
      return;
    }

    setIsLoadingRequests(true);
    console.log("HomePage: Fetching pending requests...");
    try {
      const response = await fetch("/api/requests/pending");
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch pending requests" }));
        throw new Error(
          errorData.message || "Failed to fetch pending requests"
        );
      }
      const data: PendingRequestResponse[] = await response.json();
      setPendingRequests(data);
      console.log("HomePage: Pending requests loaded:", data.length);
    } catch (error: any) {
      console.error("HomePage: Error fetching pending requests:", error);
      toast.error(`Error loading pending requests: ${error.message}`);
      setPendingRequests([]); // Clear requests on error
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Fetch on initial load/login state change
  useEffect(() => {
    fetchGlobalFund();
  }, [fetchGlobalFund]);

  useEffect(() => {
    fetchPendingRequests();
  }, [isLoggedIn]);

  const handleActionClick = (action: "borrow" | "deposit") => {
    if (!isLoggedIn) {
      setShowVerification(true);
      return;
    }
    // Navigate if logged in
    router.push(action === "borrow" ? "/borrow" : "/deposit");
  };

  // --- Voting Logic ---
  const handleVote = async (
    requestId: string,
    voteType: "approve" | "reject"
  ) => {
    if (!user) return;

    setVotingState((prev) => ({ ...prev, [requestId]: true }));
    toast.info(`Submitting ${voteType} vote...`);

    try {
      const response = await fetch("/api/requests/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, voteType, voterId: user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Vote failed (${response.status})`);
      }

      toast.success(
        `Vote (${voteType}) submitted successfully! ${result.message || ""}`
      );
      console.log("Vote successful:", result);

      // Update global fund state after successful vote
      if (result.globalFund !== undefined) {
        useGlobalFundStore.getState().setGlobalFund(result.globalFund);
      }

      // If this is the user's own request and their balance was updated, refresh auth store
      if (
        result.userBalance !== undefined &&
        user &&
        user.id === pendingRequests.find((r) => r.id === requestId)?.userId
      ) {
        useAuthStore.getState().updateBalance(result.userBalance);
      }

      fetchPendingRequests(); // Re-fetch to update list
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      toast.error(`Vote failed: ${error.message}`);
    } finally {
      setVotingState((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Global Fund Display (Card) */}
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

      {/* Action Buttons (Card) */}
      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            {isLoggedIn
              ? `Welcome back, ${user?.name}! Choose an action.`
              : "Log in or verify your identity to participate."}
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
          {!isLoggedIn && (
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowVerification(true)}
            >
              Login / Verify Identity
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Pending Approvals Section (Card) - Updated */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pending Community Approvals</CardTitle>
              <CardDescription>
                Review and vote on loan and deposit requests.
              </CardDescription>
            </div>
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchPendingRequests}
                disabled={isLoadingRequests}
                title="Refresh Requests"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isLoadingRequests ? "animate-spin" : ""
                  }`}
                />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isLoggedIn ? (
            <p className="text-muted-foreground italic text-center py-4">
              Please log in to view and vote on pending requests.
            </p>
          ) : isLoadingRequests ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-muted-foreground italic text-center py-4">
              No pending requests requiring approval right now.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => {
                const isOwnRequest = user?.id === req.userId;
                const hasVoted =
                  req.approvedBy.includes(user?.id || "") ||
                  req.rejectedBy.includes(user?.id || "");
                const canVote = isLoggedIn && !isOwnRequest && !hasVoted;
                const isVoting = votingState[req.id];

                return (
                  <LoanRequestCard
                    key={req.id}
                    request={req}
                    isVoting={isVoting}
                    canVote={canVote}
                    isOwnRequest={isOwnRequest}
                    hasVoted={hasVoted}
                    onVote={handleVote}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Modal */}
      <FaceVerification
        open={showVerification}
        onOpenChange={setShowVerification}
      />
    </div>
  );
}
