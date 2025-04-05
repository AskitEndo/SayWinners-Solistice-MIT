"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useFaceApiLoader } from "@/hooks/useFaceApiLoader";
import {
  isFaceDetected,
  startWebcam,
  stopWebcam,
  findUserByCredentials,
} from "@/lib/face-api-utils";
import { useAuthStore } from "@/store/authStore";
import {
  Loader2,
  Camera,
  AlertCircle,
  CheckCircle,
  UserPlus,
  VideoOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, login } = useAuthStore();
  const { loadingState: faceApiLoadingState, error: faceApiError } =
    useFaceApiLoader();

  // Form state - change email to userId
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(""); // Changed from email to userId

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "preparing" | "failed" | "success"
  >("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Enter your credentials and enable camera to verify"
  );
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  // Handle face API errors
  useEffect(() => {
    if (faceApiError) {
      toast.error(`Face recognition error: ${faceApiError}`);
    }
  }, [faceApiError]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stopWebcam(stream, videoRef.current);
      }
    };
  }, [stream]);

  // Start camera when face API is loaded
  const handleStartCamera = async () => {
    if (faceApiLoadingState !== "loaded") {
      toast.error("Face recognition models are still loading. Please wait.");
      return;
    }

    try {
      setCameraError(null);
      setStatusMessage("Starting camera...");
      setVerificationStatus("preparing");

      if (videoRef.current) {
        const newStream = await startWebcam(videoRef.current);
        setStream(newStream);
        setStatusMessage("Camera active. Enter credentials and verify.");
      }
    } catch (error: any) {
      console.error("Error starting camera:", error);
      setCameraError(error.message || "Failed to start camera");
      toast.error(
        "Could not access camera. Please ensure you've granted permission."
      );
      setVerificationStatus("failed");
      setStatusMessage(
        "Camera access failed. Please check permissions and try again."
      );
    }
  };

  // Stop camera
  const handleStopCamera = () => {
    if (stream && videoRef.current) {
      stopWebcam(stream, videoRef.current);
      setStream(null);
      setVerificationStatus("idle");
      setStatusMessage("Camera stopped. Click 'Start Camera' to try again.");
    }
  };

  // Verify identity - updated to use userId
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !userId) {
      toast.error("Please enter your name and user ID"); // Updated error message
      return;
    }

    if (!stream || !videoRef.current) {
      toast.error("Camera is not active. Please start your camera first.");
      return;
    }

    try {
      setIsVerifying(true);
      setStatusMessage("Checking for your face...");

      // Debug - show entered credentials
      console.log("Login attempt with:", { name, userId }); // Log updated params

      // 1. Check if user exists with provided credentials - now using userId
      const user = await findUserByCredentials(name, userId);
      console.log("User lookup result:", user);

      if (!user) {
        setVerificationStatus("failed");
        setStatusMessage("No user found with these credentials");
        toast.error("Invalid credentials. Please try again or register.");
        setIsVerifying(false);
        return;
      }

      // 2. Detect if there's a face in the video
      console.log("Checking for face...");
      const faceDetected = await isFaceDetected(videoRef.current);
      console.log("Face detection result:", faceDetected);

      if (!faceDetected) {
        setVerificationStatus("failed");
        setStatusMessage("No face detected. Please look at the camera.");
        toast.error(
          "No face detected. Please ensure good lighting and positioning."
        );
        setIsVerifying(false);
        return;
      }

      // Success! User credentials match and a face is detected
      setVerificationStatus("success");
      setStatusMessage("Login successful!");
      toast.success(`Welcome back, ${user.name}!`);

      // Login the user
      login(user);
      console.log("User logged in successfully:", user);

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationStatus("failed");
      setStatusMessage("An error occurred during verification");
      toast.error("Verification failed. Please try again.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="container max-w-md py-8 justify-center mx-auto flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Facial Identity Verification</CardTitle>
          <CardDescription>
            Please verify your identity using your face to log in.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {/* Credentials Section - Updated to use userId instead of email */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-name">Full Name</Label>
                <Input
                  id="login-name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-userId">User ID</Label>
                <Input
                  id="login-userId"
                  placeholder="Enter your user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is the unique ID assigned during registration
                </p>
              </div>
            </div>

            {/* Model Status */}
            <div
              className={`p-3 rounded-md ${
                faceApiLoadingState === "loading"
                  ? "bg-yellow-50"
                  : faceApiLoadingState === "error"
                  ? "bg-red-50"
                  : "bg-green-50"
              }`}
            >
              <p className="text-sm font-medium flex items-center">
                {faceApiLoadingState === "loading" && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {faceApiLoadingState === "error" && (
                  <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                )}
                {faceApiLoadingState === "loaded" && (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                )}

                {faceApiLoadingState === "loading"
                  ? "Loading face recognition models..."
                  : faceApiLoadingState === "error"
                  ? "Error loading face recognition models"
                  : "Face recognition ready"}
              </p>
            </div>

            {/* Video Feed */}
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
              <video
                ref={videoRef}
                className="h-full w-full object-cover mirror"
                muted
                playsInline
              />

              {/* Hidden Canvas for Capturing */}
              <canvas ref={canvasRef} className="hidden" />

              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                  <p className="text-center px-4">
                    {cameraError ? (
                      <>
                        <VideoOff className="h-8 w-8 mx-auto mb-2 text-red-500" />
                        <span className="text-center text-sm px-4">
                          {cameraError}
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 mx-auto mb-2" />
                        {faceApiLoadingState !== "loaded"
                          ? "Waiting for face recognition to initialize..."
                          : "Start camera to begin verification"}
                      </>
                    )}
                  </p>
                </div>
              )}

              {isVerifying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-center font-medium">{statusMessage}</p>
                </div>
              )}

              {verificationStatus === "success" && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/70 text-white">
                  <p className="text-center px-4">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    Identity Verified! Redirecting...
                  </p>
                </div>
              )}

              {verificationStatus === "failed" && !isVerifying && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 text-white">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="mb-4">{statusMessage}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setVerificationStatus("idle")}
                      className="bg-white/20 hover:bg-white/30"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Status Message */}
            <p className="text-sm text-muted-foreground">{statusMessage}</p>

            {/* Camera Controls */}
            <div className="flex gap-3">
              {!stream ? (
                <Button
                  type="button"
                  disabled={faceApiLoadingState !== "loaded"}
                  onClick={handleStartCamera}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleStopCamera}
                  className="flex-1"
                >
                  Stop Camera
                </Button>
              )}

              <Button
                type="submit"
                disabled={
                  !stream ||
                  isVerifying ||
                  !name ||
                  !userId ||
                  faceApiLoadingState !== "loaded"
                }
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </Button>
            </div>

            {/* Registration Link */}
            <div className="text-sm text-center mt-4 bg-muted p-4 rounded-md">
              <p className="mb-2 font-medium">New to DhanSetu?</p>
              <Button
                type="button"
                variant="outline"
                className="flex items-center justify-center w-full"
                onClick={() => router.push("/register")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register with Face ID
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
