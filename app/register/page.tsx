"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as faceapi from "face-api.js";
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
import { Progress } from "@/components/ui/progress";
import { useFaceApiLoader } from "@/hooks/useFaceApiLoader";
import { toast } from "sonner";
import {
  Loader2,
  Video,
  VideoOff,
  Camera,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Face capture configuration
const CAPTURE_COUNT = 10; // Number of images to capture
const CAPTURE_INTERVAL_MS = 500; // Interval between captures (500ms)
const FACE_CONFIDENCE_THRESHOLD = 0.6; // Min confidence for face detection

type DetectionStatus =
  | "idle"
  | "no_face"
  | "multiple_faces"
  | "ready_to_capture"
  | "capturing"
  | "complete"
  | "error";

export default function RegisterPage() {
  const router = useRouter();
  const { loadingState: faceApiLoadingState, error: faceApiError } =
    useFaceApiLoader();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectionStatus, setDetectionStatus] =
    useState<DetectionStatus>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState(
    "Start camera to begin face capture"
  );
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<faceapi.FaceDetection[]>(
    []
  );

  // Add to log with timestamp (for debugging)
  const logMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
  };

  // Take a snapshot from the video feed
  const takeSnapshot = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return null;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw mirrored image onto canvas
    context.save();
    context.scale(-1, 1); // Flip horizontally
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    context.restore();

    // Return as base64 string
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  // Fix for the video display issue in the startCamera function
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      logMessage("Starting camera...");

      // Clear existing captures when starting camera
      setCapturedImages([]);
      setDetectionStatus("idle");
      setFeedbackMessage("Starting camera, please wait...");

      // Stop any existing detection interval
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setDetectedFaces([]); // Reset detected faces array

      // Stop any existing stream first
      if (streamRef.current) {
        logMessage("Stopping existing stream first");
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Request camera with constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      logMessage(`Camera stream obtained: ${stream.id}`);
      logMessage(`Active video tracks: ${stream.getVideoTracks().length}`);

      if (videoRef.current) {
        // Directly set the srcObject
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Important: Set camera as active immediately to show the video
        setCameraActive(true);

        logMessage("Video element setup complete, waiting for metadata");

        // Add event listeners for tracking video readiness
        videoRef.current.onloadedmetadata = async () => {
          logMessage("Video metadata loaded");

          try {
            // Play the video
            await videoRef.current?.play();
            logMessage("Video playback started successfully");

            // Force a repaint to ensure video shows up
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.style.display = "none";
                // Force browser to recalculate layout
                void videoRef.current.offsetHeight;
                videoRef.current.style.display = "";
              }
            }, 50);

            // Initialize detection canvas after video dimensions are known
            if (detectionCanvasRef.current && videoRef.current) {
              const canvas = detectionCanvasRef.current;
              canvas.width = videoRef.current.videoWidth || 640;
              canvas.height = videoRef.current.videoHeight || 480;

              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }

            toast.success("Camera activated successfully");
            setIsLoading(false);
          } catch (error) {
            logMessage(`Error playing video: ${error}`);
            setCameraError("Failed to start video playback");
            toast.error("Failed to start video playback");
            setDetectionStatus("error");
            setIsLoading(false);
          }
        };

        // Handle errors during metadata loading
        videoRef.current.onerror = (event) => {
          logMessage(
            `Video element error: ${
              videoRef.current?.error?.message || "Unknown error"
            }`
          );
          setCameraError("Video initialization failed");
          toast.error("Failed to initialize video");
          setDetectionStatus("error");
          setIsLoading(false);
        };
      }
    } catch (error: any) {
      logMessage(`Camera error: ${error.message}`);
      setCameraError(error.message || "Failed to start camera");
      toast.error(
        `Camera error: ${error.message || "Failed to access camera"}`
      );
      setDetectionStatus("error");
      setIsLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      logMessage("Stopping camera stream...");

      // Clear any running intervals
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }

      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }

      // Clean detection canvas
      if (detectionCanvasRef.current) {
        const ctx = detectionCanvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(
            0,
            0,
            detectionCanvasRef.current.width,
            detectionCanvasRef.current.height
          );
        }
      }

      // Stop all tracks
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        logMessage(`Stopped track: ${track.kind}, state: ${track.readyState}`);
      });
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setCameraActive(false);
      setIsCapturing(false);
      setDetectionStatus("idle");
      setDetectedFaces([]);
      logMessage("Camera stopped");
    } else {
      logMessage("No active stream to stop");
    }
  };

  // Improved startFaceDetection function
  const startFaceDetection = useCallback(() => {
    // Clear any existing detection interval first
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Prerequisites check (still useful)
    if (
      !cameraActive ||
      !videoRef.current ||
      !detectionCanvasRef.current ||
      faceApiLoadingState !== "loaded"
    ) {
      logMessage("Cannot start face detection - prerequisites not met");
      return; // Exit if basic conditions aren't met
    }

    logMessage("Starting face detection loop - video should be ready");
    setDetectionStatus("no_face"); // Set initial status
    setFeedbackMessage("Position your face in the center of the frame");

    // Set up canvas dimensions based on the *now ready* video element
    const videoEl = videoRef.current;
    const canvas = detectionCanvasRef.current;
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Start detection interval
    detectionIntervalRef.current = setInterval(async () => {
      if (
        !videoRef.current ||
        !cameraActive ||
        faceApiLoadingState !== "loaded"
      ) {
        return;
      }

      try {
        // Detect faces in the current frame
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({
            minConfidence: FACE_CONFIDENCE_THRESHOLD,
          })
        );

        logMessage(`Detected ${detections.length} faces`);

        // Store the detected faces for visualization
        setDetectedFaces(detections);

        // Draw detection rectangles
        if (detectionCanvasRef.current && videoRef.current) {
          const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          };

          // Match canvas size to video
          faceapi.matchDimensions(detectionCanvasRef.current, displaySize);

          // Draw detections on canvas
          const ctx = detectionCanvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(
              0,
              0,
              detectionCanvasRef.current.width,
              detectionCanvasRef.current.height
            );

            // Flip context for mirrored video
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-displaySize.width, 0);

            // Draw boxes with different colors based on detection status
            detections.forEach((detection) => {
              // Draw detection box
              ctx.strokeStyle = detections.length === 1 ? "#4ade80" : "#f87171"; // Green for single face, red for multiple
              ctx.lineWidth = 3;
              ctx.strokeRect(
                detection.box.x,
                detection.box.y,
                detection.box.width,
                detection.box.height
              );

              // Add confidence text - fix for mirrored display
              const confidenceText = `${Math.round(detection.score * 100)}%`;
              // Restore context to draw text normally
              ctx.restore();

              // Set text properties
              ctx.fillStyle = "white";
              ctx.font = "28px Arial"; // Keeping this as 28px Arial as requested

              // Calculate correct position in mirrored context
              const textX =
                displaySize.width - detection.box.x - detection.box.width;

              // Draw the text
              ctx.fillText(confidenceText, textX, detection.box.y - 5);

              // Re-save and re-flip for next iteration
              ctx.save();
              ctx.scale(-1, 1);
              ctx.translate(-displaySize.width, 0);
            });

            ctx.restore();
          }
        }

        // Update status based on detection results
        if (detections.length === 0) {
          setDetectionStatus("no_face");
          setFeedbackMessage(
            "No face detected. Please position your face in the center."
          );
        } else if (detections.length > 1) {
          setDetectionStatus("multiple_faces");
          setFeedbackMessage(
            "Multiple faces detected. Please ensure only you are in the frame."
          );
        } else {
          // One face detected - ready to capture
          setDetectionStatus("ready_to_capture");
          setFeedbackMessage(
            "Face detected. Click 'Capture Face' to take photos."
          );
        }
      } catch (error) {
        console.error("Face detection error:", error);
        setDetectionStatus("error");
        setFeedbackMessage("Error during face detection. Please try again.");
      }
    }, 500);
  }, [cameraActive, faceApiLoadingState]); // Add dependencies

  // Start capturing multiple face images
  const startCapturing = async () => {
    logMessage("Starting capture process...");

    if (
      !videoRef.current ||
      !cameraActive ||
      faceApiLoadingState !== "loaded" ||
      isCapturing
    ) {
      toast.warning("Camera not ready for capture");
      return;
    }

    // Reset previous captures if any
    setCapturedImages([]);
    setIsCapturing(true);
    setDetectionStatus("capturing");
    setFeedbackMessage(`Starting capture (0/${CAPTURE_COUNT})...`);

    // Stop detection interval during capture
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Create a local count to track captures within closure
    let currentCount = 0;

    logMessage("Setting up capture interval...");
    captureIntervalRef.current = setInterval(() => {
      logMessage(`Capture iteration: ${currentCount}/${CAPTURE_COUNT}`);

      if (currentCount >= CAPTURE_COUNT) {
        logMessage("Capture count reached, stopping capture process");
        // Capture complete
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current);
          captureIntervalRef.current = null;
        }

        setDetectionStatus("complete");
        setFeedbackMessage(
          `Face capture complete (${CAPTURE_COUNT}/${CAPTURE_COUNT})`
        );
        setIsCapturing(false);
        toast.success("Face capture completed successfully!");
        return;
      }

      // Take snapshot
      const snapshot = takeSnapshot();
      if (snapshot) {
        currentCount++;
        logMessage(`Captured image ${currentCount}/${CAPTURE_COUNT}`);

        setCapturedImages((prev) => {
          const newImages = [...prev, snapshot];
          setFeedbackMessage(
            `Capturing images (${newImages.length}/${CAPTURE_COUNT})...`
          );
          return newImages;
        });
      } else {
        logMessage("Failed to take snapshot");
      }
    }, CAPTURE_INTERVAL_MS);
  };

  // Emergency capture function
  const emergencyCapture = () => {
    if (!cameraActive || isCapturing || faceApiLoadingState !== "loaded") {
      toast.error("Camera must be active and not already capturing");
      return;
    }

    // Properly clean up any existing detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    toast.info("Starting emergency capture - hold still");
    setDetectionStatus("capturing"); // Set the status explicitly
    startCapturing();
  };

  // Updated handle submit to call API
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (detectionStatus !== "complete") {
      toast.error("Please complete the face capture process first.");
      return;
    }

    if (!canSubmit) {
      toast.error("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Submitting registration...");

    // Data to send to API
    const registrationData = {
      name,
      email,
      age,
      address,
      bankAccount,
      images: capturedImages, // Send the array of base64 images
    };

    try {
      console.log("Sending data to /api/register:", {
        ...registrationData,
        images: `${capturedImages.length} images`,
      });

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // Handle API errors (e.g., email exists, server error)
        console.error("API Error Response:", result);
        toast.error(
          `Registration failed: ${
            result.message || `Server error ${response.status}`
          }`
        );
        setIsSubmitting(false);
        return; // Stop execution on failure
      }

      // Success
      console.log("API Success Response:", result);
      toast.success(`Registration successful! User ID: ${result.userId}`);

      // Clear form data for security
      setCapturedImages([]);

      // Redirect after a short delay
      setTimeout(() => router.push("/"), 2500);
    } catch (error) {
      console.error("Error submitting registration:", error);
      toast.error(
        "An unexpected error occurred while submitting. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  // Reset capture - Improved to ensure proper cleanup and reset
  const resetCapture = () => {
    // Always clear captured images
    setCapturedImages([]);
    setDetectionStatus("idle");
    setFeedbackMessage("Face capture reset. Start camera to begin again.");

    // Clean up any existing detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Clear the canvas
    if (detectionCanvasRef.current) {
      const ctx = detectionCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          detectionCanvasRef.current.width,
          detectionCanvasRef.current.height
        );
      }
    }

    // If camera is still active, restart the entire process
    if (cameraActive && streamRef.current) {
      // Stop camera first
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setCameraActive(false);

      // Restart camera after a short delay
      setTimeout(() => {
        startCamera();
      }, 200);
    }
  };

  // Effect to handle Face API errors
  useEffect(() => {
    if (faceApiError) {
      toast.error(`Face API Error: ${faceApiError}`);
    }

    // Cleanup on unmount
    return () => {
      logMessage("Component unmounting - cleaned up");

      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }

      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }

      stopCamera();
    };
  }, [faceApiError]);

  // New useEffect for reliable face detection tracking
  useEffect(() => {
    const videoElement = videoRef.current;

    // Define the handler function separately
    const handleVideoPlaying = () => {
      logMessage("Video 'onplaying' event fired.");
      // Ensure models are loaded before starting detection
      if (faceApiLoadingState === "loaded") {
        logMessage(
          "Conditions met, calling startFaceDetection from onplaying handler."
        );
        startFaceDetection();
      } else {
        logMessage("Models not loaded yet, skipping startFaceDetection call.");
      }
    };

    // Only proceed if camera is intended to be active and video element exists
    if (cameraActive && videoElement) {
      logMessage(
        "useEffect: Camera is active, checking video state and adding 'onplaying' listener."
      );

      // Add the event listener
      videoElement.addEventListener("playing", handleVideoPlaying);

      // Also check if video is *already* playing (e.g., due to autoPlay)
      // readyState >= 3 means enough data is available to start playing
      if (
        !videoElement.paused &&
        videoElement.readyState >= 3 &&
        faceApiLoadingState === "loaded"
      ) {
        logMessage(
          "useEffect: Video already playing/ready, calling startFaceDetection directly."
        );
        startFaceDetection(); // Call immediately if already playing
      }

      // Cleanup function for this effect
      return () => {
        logMessage("useEffect cleanup: Removing 'onplaying' listener.");
        videoElement.removeEventListener("playing", handleVideoPlaying);
      };
    } else {
      // If camera becomes inactive, ensure detection interval is cleared
      if (detectionIntervalRef.current) {
        logMessage(
          "useEffect: Camera not active, clearing detection interval."
        );
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }

    // Dependencies: cameraActive state and model loading state
  }, [cameraActive, faceApiLoadingState, startFaceDetection]); // Added startFaceDetection as dependency

  // Check if form can be submitted
  const canSubmit =
    name &&
    email &&
    age &&
    address &&
    bankAccount &&
    capturedImages.length === CAPTURE_COUNT &&
    faceApiLoadingState === "loaded";

  // Calculate capture progress
  const captureProgress = (capturedImages.length / CAPTURE_COUNT) * 100;

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Register New Account</CardTitle>
          <CardDescription>
            Provide your details and capture your face for secure access. All
            data is mock data for this demo.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting || detectionStatus === "complete"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting || detectionStatus === "complete"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g., 30"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  disabled={isSubmitting || detectionStatus === "complete"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  placeholder="account number"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  required
                  disabled={isSubmitting || detectionStatus === "complete"}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address </Label>
                <Textarea
                  id="address"
                  placeholder="Mock street address, city, country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  disabled={isSubmitting || detectionStatus === "complete"}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <hr className="my-6" />

            {/* Face Capture Section - Enhanced with multiple image capture */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-medium">
                  Face Capture ({capturedImages.length}/{CAPTURE_COUNT})
                </Label>
                <div className="text-sm">
                  <span
                    className={`${
                      faceApiLoadingState === "loaded"
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {faceApiLoadingState === "loading"
                      ? "Loading models..."
                      : faceApiLoadingState === "loaded"
                      ? "Models ready"
                      : "Models not loaded"}
                  </span>
                </div>
              </div>

              <Card className="bg-muted/30 p-4 border">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Video Display Area */}
                  <div className="w-full md:w-1/2">
                    <div
                      className="relative bg-black rounded overflow-hidden mb-3"
                      style={{ aspectRatio: "4/3" }}
                    >
                      {/* Video Element - Updated for better display */}
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        muted
                        playsInline
                        autoPlay
                        style={{
                          transform: "scaleX(-1)",
                          display: cameraActive ? "block" : "none", // Ensure video shows when camera is active
                        }}
                      />

                      {/* Detection Canvas - Add this */}
                      <canvas
                        ref={detectionCanvasRef}
                        className="absolute inset-0 w-full h-full"
                      />

                      {/* Hidden Canvas for Capturing */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Show inactive overlay when camera is not active */}
                      {!cameraActive &&
                        !isCapturing &&
                        detectionStatus !== "complete" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 text-foreground">
                            {cameraError ? (
                              <>
                                <VideoOff className="w-10 h-10 text-destructive mb-2" />
                                <p className="text-center text-sm px-4">
                                  {cameraError}
                                </p>
                              </>
                            ) : faceApiLoadingState === "loading" ? (
                              <>
                                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                                <p>Loading models...</p>
                              </>
                            ) : (
                              <>
                                <Camera className="w-10 h-10 mb-2" />
                                <p>Camera inactive</p>
                              </>
                            )}
                          </div>
                        )}

                      {/* Status Overlays */}
                      {cameraActive &&
                        !isCapturing &&
                        detectionStatus !== "complete" && (
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-primary text-primary-foreground z-10">
                            <p className="text-center text-sm font-medium">
                              {detectionStatus === "no_face" && (
                                <>
                                  <AlertCircle className="w-4 h-4 inline mr-2" />
                                  No face detected. Position your face in frame.
                                </>
                              )}
                              {detectionStatus === "multiple_faces" && (
                                <>
                                  <AlertCircle className="w-4 h-4 inline mr-2" />
                                  Multiple faces detected. Ensure only you are
                                  visible.
                                </>
                              )}
                              {detectionStatus === "ready_to_capture" && (
                                <>
                                  <CheckCircle2 className="w-4 h-4 inline mr-2" />
                                  Face detected! Ready to capture.
                                </>
                              )}
                            </p>
                          </div>
                        )}

                      {/* Loading overlay */}
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-10">
                          <Loader2 className="w-10 h-10 text-primary animate-spin" />
                          <span className="ml-3">Starting camera...</span>
                        </div>
                      )}

                      {/* Capture in progress overlay */}
                      {isCapturing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-10">
                          <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                          <p className="text-center text-lg font-medium">
                            Capturing {capturedImages.length}/{CAPTURE_COUNT}...
                          </p>
                          <div className="w-3/4 mt-4">
                            <Progress value={captureProgress} className="h-2" />
                          </div>
                        </div>
                      )}

                      {/* Success overlay */}
                      {detectionStatus === "complete" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-10">
                          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
                          </div>
                          <p className="font-medium text-lg">
                            Face Capture Complete
                          </p>
                          <p className="text-muted-foreground text-sm mt-1">
                            All {CAPTURE_COUNT} images captured successfully
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Camera Controls */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {detectionStatus !== "complete" && !isCapturing && (
                        <>
                          <Button
                            type="button"
                            onClick={startCamera}
                            disabled={
                              cameraActive ||
                              faceApiLoadingState !== "loaded" ||
                              isLoading
                            }
                            variant={cameraActive ? "outline" : "default"}
                          >
                            Start Camera
                          </Button>

                          <Button
                            type="button"
                            onClick={stopCamera}
                            disabled={!cameraActive}
                            variant="destructive"
                          >
                            Stop Camera
                          </Button>

                          <Button
                            type="button"
                            onClick={startCapturing}
                            disabled={
                              !cameraActive ||
                              detectionStatus !== "ready_to_capture" ||
                              faceApiLoadingState !== "loaded"
                            }
                            variant="secondary"
                          >
                            Capture Face
                          </Button>

                          <Button
                            type="button"
                            onClick={emergencyCapture}
                            disabled={
                              !cameraActive ||
                              isCapturing ||
                              faceApiLoadingState !== "loaded"
                            }
                            variant="secondary"
                          >
                            Emergency Capture
                          </Button>
                        </>
                      )}

                      {detectionStatus === "complete" && (
                        <Button
                          type="button"
                          onClick={resetCapture}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          Reset Capture
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Instructions Area */}
                  <div className="w-full md:w-1/2 space-y-4">
                    <Card className="bg-card p-4">
                      <CardTitle className="text-sm font-medium mb-2">
                        {detectionStatus === "complete"
                          ? "✅ Face Capture Completed"
                          : "Face Capture Instructions"}
                      </CardTitle>

                      {detectionStatus !== "complete" ? (
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
                          <li>
                            Click <strong>Start Camera</strong> to activate your
                            webcam
                          </li>
                          <li>
                            Position your face clearly in the center of the
                            frame
                          </li>
                          <li>
                            Once your face is detected, click{" "}
                            <strong>Capture Face</strong>
                          </li>
                          <li>
                            The system will automatically take {CAPTURE_COUNT}{" "}
                            photos
                          </li>
                          <li>
                            Keep looking at the camera and stay still during the
                            process
                          </li>
                        </ol>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">
                            Your face has been successfully captured with{" "}
                            {CAPTURE_COUNT} images. You can now complete your
                            registration.
                          </p>

                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              These images will be stored securely for
                              verification.
                            </p>
                          </div>
                        </>
                      )}
                    </Card>

                    {/* Status Cards */}
                    {cameraActive &&
                      !isCapturing &&
                      detectionStatus !== "complete" && (
                        <Card className="p-3 border-primary/20 bg-primary/5">
                          <p className="text-sm text-primary flex items-center">
                            <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                            Camera is active! {feedbackMessage}
                          </p>
                        </Card>
                      )}

                    {cameraError && (
                      <Card className="p-3 border-destructive/20 bg-destructive/5">
                        <p className="text-sm text-destructive flex items-center">
                          <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                          {cameraError}
                        </p>
                      </Card>
                    )}

                    {isCapturing && (
                      <Card className="p-3 border-primary/20 bg-primary/5">
                        <p className="text-sm text-primary flex items-center">
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Capturing {capturedImages.length} of {CAPTURE_COUNT}{" "}
                          images...
                        </p>
                        <Progress
                          value={captureProgress}
                          className="mt-2 h-1"
                        />
                      </Card>
                    )}

                    {detectionStatus === "complete" && (
                      <Card className="p-3 border-primary/20 bg-primary/5">
                        <p className="text-sm text-primary flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          All {CAPTURE_COUNT} images captured successfully!
                        </p>
                      </Card>
                    )}

                    {/* Current Progress
                    {capturedImages.length > 0 &&
                      capturedImages.length < CAPTURE_COUNT && (
                        <Card className="p-3">
                          <p className="text-sm mb-1">Capture Progress</p>
                          <Progress value={captureProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1 text-right">
                            {capturedImages.length} of {CAPTURE_COUNT} images
                          </p>
                        </Card>
                      )} */}
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
          <CardFooter>
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting || isCapturing}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
