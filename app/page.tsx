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
import { Loader2, ThumbsUp, ThumbsDown, Info, RefreshCw } from "lucide-react";

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
                const isVoting = votingState[req.id]; // Check if voting is in progress for this req

                const approvedVotes = req.approvedBy.length;
                const rejectedVotes = req.rejectedBy.length;
                const votesNeeded = req.votesRequired;

                return (
                  <Card key={req.id} className="border shadow-sm">
                    <CardHeader className="flex flex-row justify-between items-start pb-3">
                      <div>
                        <CardTitle className="text-base font-semibold mb-1 line-clamp-1">
                          {req.type === "loan" ? req.title : "Deposit Request"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          By: {req.requesterName} | Req ID: ...
                          {req.id.slice(-6)}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={req.type === "loan" ? "default" : "secondary"}
                        className="capitalize text-xs h-5"
                      >
                        {req.type}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-3 text-sm">
                      {req.type === "loan" && req.category && (
                        <p>
                          <span className="font-medium">Category:</span>{" "}
                          {req.category}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Amount:</span> ₹
                        {req.amount.toLocaleString("en-IN")}
                      </p>
                      <Separator className="my-1" />
                      <details className="group text-xs">
                        <summary className="cursor-pointer text-muted-foreground group-open:mb-1 list-none flex items-center">
                          <Info className="w-3 h-3 mr-1 inline" /> Details
                        </summary>
                        <p className="pl-4 text-muted-foreground border-l-2 ml-1 pl-2">
                          {req.details}
                        </p>
                      </details>
                      <Separator className="my-1" />
                      <div className="text-xs text-muted-foreground flex justify-between items-center">
                        <span>
                          Votes: {approvedVotes} 👍 / {rejectedVotes} 👎
                        </span>
                        <span>
                          {votesNeeded > 0
                            ? `(${approvedVotes}/${votesNeeded} needed)`
                            : "(No votes needed)"}
                        </span>
                      </div>
                    </CardContent>
                    {/* --- Voting Footer --- */}
                    {canVote && (
                      <CardFooter className="flex justify-end gap-2 bg-muted/50 py-2 px-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 h-7 px-2"
                          onClick={() => handleVote(req.id, "reject")}
                          disabled={isVoting}
                        >
                          {isVoting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ThumbsDown className="mr-1 h-3 w-3" />
                          )}{" "}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 h-7 px-2"
                          onClick={() => handleVote(req.id, "approve")}
                          disabled={isVoting}
                        >
                          {isVoting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ThumbsUp className="mr-1 h-3 w-3" />
                          )}{" "}
                          Approve
                        </Button>
                      </CardFooter>
                    )}
                    {/* --- Footer if cannot vote --- */}
                    {!canVote && (
                      <CardFooter className="bg-muted/30 py-1 px-3 text-center">
                        <p className="text-xs text-muted-foreground italic w-full">
                          {isOwnRequest
                            ? "This is your own request."
                            : hasVoted
                            ? "You have already voted."
                            : "Cannot vote."}
                        </p>
                      </CardFooter>
                    )}
                  </Card>
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
