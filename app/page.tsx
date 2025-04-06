"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { Loader2, RefreshCw, IndianRupee } from "lucide-react";
import { LoanRequestCard } from "@/components/LoanRequestCard";
import { motion } from "framer-motion";

// Define the extended type received from the API
interface PendingRequestResponse extends LoanRequest {
  requesterName: string;
}

// Component for animated number display
const AnimatedNumber = ({ value }: { value: number }) => {
  const [animatedValue, setAnimatedValue] = useState("0");
  const [isAnimating, setIsAnimating] = useState(false);

  // Format number in Indian style (lakhs, crores)
  const formatIndianNumber = (num: string) => {
    // Convert to Indian number format (e.g., 10,00,000 instead of 1,000,000)
    let result = "";
    const numStr = num.toString();
    const length = numStr.length;

    // Handle numbers less than 1000
    if (length <= 3) {
      return numStr;
    }

    // Add the last 3 digits
    result = numStr.substring(length - 3);

    // Add the remaining digits in groups of 2
    let remaining = numStr.substring(0, length - 3);
    while (remaining.length > 0) {
      const chunk = remaining.substring(Math.max(0, remaining.length - 2));
      result = chunk + "," + result;
      remaining = remaining.substring(0, Math.max(0, remaining.length - 2));
    }

    return result;
  };

  useEffect(() => {
    if (!value) return;

    // Start with random shuffling
    setIsAnimating(true);

    // Generate random digits for shuffling effect
    const randomizeDigits = () => {
      return Array.from({ length: String(value).length })
        .map(() => Math.floor(Math.random() * 10))
        .join("");
    };

    let iterations = 0;
    const maxIterations = 20; // Number of random shuffles

    const shuffleInterval = setInterval(() => {
      if (iterations < maxIterations) {
        setAnimatedValue(randomizeDigits());
        iterations++;
      } else {
        // End with the actual value
        setAnimatedValue(String(value));
        setIsAnimating(false);
        clearInterval(shuffleInterval);
      }
    }, 50);

    return () => clearInterval(shuffleInterval);
  }, [value]);

  return (
    <span
      className={`font-mono transition-all ${
        isAnimating ? "text-primary/80" : "text-primary"
      }`}
    >
      ₹{formatIndianNumber(animatedValue)}
    </span>
  );
};

export default function HomePage() {
  // Use separate selectors to avoid infinite loop issue
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  // Use the global fund store
  const {
    globalFund,
    isLoading: isLoadingFund,
    fetchGlobalFund,
  } = useGlobalFundStore();

  const router = useRouter();
  const [showVerification, setShowVerification] = useState(false);

  // Add state to track if manual scroll is happening
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const [forceReset, setForceReset] = useState(0);

  // Animation states
  const [pageLoaded, setPageLoaded] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // SVG animation ref and state
  const svgRef = useRef<HTMLDivElement>(null);
  const [svgRotation, setSvgRotation] = useState(0);

  // Refs for scroll snapping
  const containerRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);

  // Handle logo click from navbar - expose a method that can be called
  useEffect(() => {
    // Define a global function that can be called from Navbar
    (window as any).resetHomePageScroll = () => {
      if (containerRef.current) {
        // Temporarily disable snap scrolling
        setIsManualScrolling(true);

        // Force reset animations by incrementing state
        setForceReset((prev) => prev + 1);

        // Scroll to top immediately
        window.scrollTo({ top: 0, behavior: "auto" });

        // Re-fetch global fund data
        fetchGlobalFund();

        // Re-enable snap scrolling after animation completes
        setTimeout(() => {
          setIsManualScrolling(false);
        }, 800);

        // Reset animation states
        setPageLoaded(false);
        setTimeout(() => setPageLoaded(true), 100);
      }
    };

    return () => {
      delete (window as any).resetHomePageScroll;
    };
  }, [fetchGlobalFund]);

  // Auto-scroll logic with improved handling
  useEffect(() => {
    if (isManualScrolling) return; // Skip if manual scrolling is happening

    const handleScroll = () => {
      if (!containerRef.current || isManualScrolling) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const section1Top = section1Ref.current?.offsetTop || 0;
      const section2Top = section2Ref.current?.offsetTop || 0;

      // Only snap when user stops scrolling
      clearTimeout((window as any).scrollTimeout);
      (window as any).scrollTimeout = setTimeout(() => {
        // Threshold for snapping (percentage of section height)
        const threshold = windowHeight * 0.3;

        // Snap to section 1 (Numbers)
        if (scrollTop > 0 && scrollTop < threshold) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }

        // Snap to section 2 (Hero)
        if (scrollTop > section1Top + threshold && scrollTop < section2Top) {
          window.scrollTo({ top: section2Top, behavior: "smooth" });
        }

        // If scrolled past section 2, snap to it
        if (
          scrollTop > section2Top - threshold &&
          scrollTop < section2Top + threshold
        ) {
          window.scrollTo({ top: section2Top, behavior: "smooth" });
        }
      }, 100); // Small timeout to wait for scroll to stop
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout((window as any).scrollTimeout);
    };
  }, [isManualScrolling]);

  // Effect to handle SVG rotation - more subtle now
  useEffect(() => {
    if (hoveredButton === "borrow") {
      // Rotate clockwise when borrow button is hovered
      setSvgRotation(6);
    } else if (hoveredButton === "deposit") {
      // Rotate counter-clockwise when deposit button is hovered
      setSvgRotation(-6);
    } else {
      // Reset rotation when no button is hovered
      setSvgRotation(0);
    }
  }, [hoveredButton]);

  const [pendingRequests, setPendingRequests] = useState<
    PendingRequestResponse[]
  >([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [votingState, setVotingState] = useState<{
    [requestId: string]: boolean;
  }>({});

  const fetchPendingRequests = async () => {
    if (!isLoggedIn) {
      setPendingRequests([]);
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
      setPendingRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchGlobalFund();
    setTimeout(() => setPageLoaded(true), 500);
  }, [fetchGlobalFund]);

  useEffect(() => {
    fetchPendingRequests();
  }, [isLoggedIn]);

  const handleActionClick = (action: "borrow" | "deposit") => {
    if (!isLoggedIn) {
      setShowVerification(true);
      return;
    }
    router.push(action === "borrow" ? "/borrow" : "/deposit");
  };

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

      if (result.globalFund !== undefined) {
        useGlobalFundStore.getState().setGlobalFund(result.globalFund);
      }

      if (
        result.userBalance !== undefined &&
        user &&
        user.id === pendingRequests.find((r) => r.id === requestId)?.userId
      ) {
        useAuthStore.getState().updateBalance(result.userBalance);
      }

      fetchPendingRequests();
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      toast.error(`Vote failed: ${error.message}`);
    } finally {
      setVotingState((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div
      key={forceReset} // Add key to force remount when reset
      ref={containerRef}
      className={`h-screen overflow-y-auto ${
        isManualScrolling ? "" : "snap-y snap-mandatory"
      }`}
    >
      {/* Global Fund Display - Full Screen Hero Section */}
      <div
        ref={section1Ref}
        className="h-screen w-full snap-start flex flex-col items-center justify-center relative bg-gradient-to-b from-background to-primary/5"
      >
        <motion.div
          className="flex flex-col items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Number Display - increased size with constraints to keep in frame */}
          <motion.div
            className="text-[8.5rem] md:text-[10rem] lg:text-[12rem] leading-none font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent max-w-[95vw] overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {isLoadingFund ? (
              <Skeleton className="h-48 w-96" />
            ) : (
              <div className="px-2 text-center">
                <AnimatedNumber value={globalFund || 0} />
              </div>
            )}
          </motion.div>

          {/* "COLLECTED SO FAR" text - improved animation */}
          <motion.p
            className="text-muted-foreground text-lg md:text-xl mt-4 tracking-wider uppercase font-light subtle-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
              delay: 1.8,
            }}
          >
            COLLECTED SO FAR
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-10"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <p className="text-muted-foreground text-sm">Scroll Down</p>
            <div className="mt-2 w-6 h-10 border-2 border-muted-foreground rounded-full mx-auto flex justify-center">
              <motion.div
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ y: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Hero Section with Character - Full Screen */}
      <div
        ref={section2Ref}
        className="h-screen w-full snap-start relative overflow-hidden bg-blue-50/5"
      >
        {/* Main SVG with rotation animation - more subtle */}
        <motion.div
          ref={svgRef}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: svgRotation,
            y: hoveredButton ? -10 : 0,
          }}
          transition={{
            duration: 0.7,
            rotate: { type: "spring", stiffness: 150, damping: 20 },
          }}
        >
          <div className="relative w-full h-full translate-y-[8%]">
            <Image
              src="/images/compare.svg"
              alt="DhanSetu Hero"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Action buttons - SWAPPED and ENLARGED 3x */}
        <div className="absolute inset-0 flex items-center justify-between px-8 md:px-16">
          {/* BORROW BUTTON - Now on LEFT side */}
          <motion.div
            animate={{
              x: hoveredButton === "borrow" ? -8 : 0,
              y: hoveredButton === "borrow" ? -8 : 0,
              scale: hoveredButton === "borrow" ? 1.08 : 1,
            }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
          >
            <Button
              size="lg"
              className="text-xl px-8 py-8 bg-primary shadow-md hover:bg-primary/90 h-auto w-auto text-primary-foreground font-bold" // 3x larger
              onClick={() => handleActionClick("borrow")}
              onMouseEnter={() => setHoveredButton("borrow")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Borrow Money
            </Button>
          </motion.div>

          {/* DEPOSIT BUTTON - Now on RIGHT side */}
          <motion.div
            animate={{
              x: hoveredButton === "deposit" ? 8 : 0,
              y: hoveredButton === "deposit" ? -8 : 0,
              scale: hoveredButton === "deposit" ? 1.08 : 1,
            }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
          >
            <Button
              size="lg"
              variant="outline"
              className="text-xl px-8 py-8 bg-background/80 backdrop-blur-sm border-2 border-primary/30 hover:border-primary hover:bg-primary/5 shadow-md h-auto w-auto font-bold" // 3x larger
              onClick={() => handleActionClick("deposit")}
              onMouseEnter={() => setHoveredButton("deposit")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <IndianRupee className="mr-2 h-5 w-5" />
              Deposit Money
            </Button>
          </motion.div>
        </div>

        {/* Login/Verify button for non-logged in users */}
        {!isLoggedIn && (
          <div className="absolute bottom-8 w-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 bg-background/70 backdrop-blur-sm shadow-md"
                onClick={() => setShowVerification(true)}
              >
                Login / Verify Identity
              </Button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="min-h-screen w-full snap-start py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Community Approvals
            </h2>
            <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto">
              Review and vote on loan and deposit requests from members of our
              community.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="border-2 border-primary/10 shadow-xl">
              <CardHeader className="border-b border-border/30">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl">Pending Requests</CardTitle>
                    <CardDescription className="text-lg">
                      Your vote matters in deciding who receives help.
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
                        className={`h-5 w-5 ${
                          isLoadingRequests ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16"
                  >
                    <p className="text-xl text-muted-foreground italic mb-8">
                      Please log in to view and vote on pending requests.
                    </p>
                    <Button size="lg" onClick={() => setShowVerification(true)}>
                      Login / Verify Identity
                    </Button>
                  </motion.div>
                ) : isLoadingRequests ? (
                  <div className="space-y-6 py-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-xl text-muted-foreground italic">
                      No pending requests requiring approval right now.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingRequests.map((req, index) => {
                      const isOwnRequest = user?.id === req.userId;
                      const hasVoted =
                        req.approvedBy.includes(user?.id || "") ||
                        req.rejectedBy.includes(user?.id || "");
                      const canVote = isLoggedIn && !isOwnRequest && !hasVoted;
                      const isVoting = votingState[req.id];

                      return (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                          <LoanRequestCard
                            request={req}
                            isVoting={isVoting}
                            canVote={canVote}
                            isOwnRequest={isOwnRequest}
                            hasVoted={hasVoted}
                            onVote={handleVote}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <FaceVerification
        open={showVerification}
        onOpenChange={setShowVerification}
      />
    </div>
  );
}
