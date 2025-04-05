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

  // Start camera - Using the working camcheck pattern
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      logMessage("Starting camera...");

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
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for metadata to load
        await new Promise<void>((resolve) => {
          if (!videoRef.current) {
            resolve();
            return;
          }

          videoRef.current.onloadedmetadata = () => {
            logMessage("Video metadata loaded");
            resolve();
          };
        });

        // Start playing
        await videoRef.current.play();
        logMessage("Video playback started");
        setCameraActive(true);

        // Log video element state
        const videoEl = videoRef.current;
        logMessage(
          `Video state: ${videoEl.readyState}, paused: ${videoEl.paused}, width: ${videoEl.videoWidth}x${videoEl.videoHeight}`
        );

        toast.success("Camera activated successfully");

        // Start face detection
        startFaceDetection();
      }
    } catch (error: any) {
      logMessage(`Camera error: ${error.message}`);
      setCameraError(error.message || "Failed to start camera");
      toast.error(
        `Camera error: ${error.message || "Failed to access camera"}`
      );
      setDetectionStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Stop camera - Direct from camcheck
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
      logMessage("Camera stopped");
    } else {
      logMessage("No active stream to stop");
    }
  };

  // Start face detection loop
  const startFaceDetection = () => {
    if (!cameraActive || detectionIntervalRef.current) return;

    setDetectionStatus("no_face");
    setFeedbackMessage("Position your face in the center of the frame");

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
  };

  // Start capturing multiple face images
  const startCapturing = async () => {
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

    // Start interval for capturing multiple images
    let captureCount = 0;
    captureIntervalRef.current = setInterval(() => {
      if (captureCount >= CAPTURE_COUNT) {
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
        captureCount++;
        setCapturedImages((prev) => [...prev, snapshot]);
        setFeedbackMessage(
          `Capturing images (${captureCount}/${CAPTURE_COUNT})...`
        );
        logMessage(`Captured image ${captureCount}/${CAPTURE_COUNT}`);
      }
    }, CAPTURE_INTERVAL_MS);
  };

  // Form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (capturedImages.length < CAPTURE_COUNT) {
      toast.error("Please complete the face capture process");
      return;
    }

    if (!canSubmit) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    toast.info("Submitting registration...");

    // Prepare registration data
    const registrationData = {
      name,
      email,
      age,
      address,
      bankAccount,
      faceImagesCaptured: true, // Flag for User type
      images: capturedImages, // The array of base64 images
    };

    console.log("Form Data for Submission:", {
      ...registrationData,
      images: `${capturedImages.length} images captured`, // Don't log actual images
    });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Registration successful! Redirecting...");
    setIsSubmitting(false);

    // Redirect after delay
    setTimeout(() => router.push("/"), 2000);
  };

  // Reset face capture
  const resetCapture = () => {
    setCapturedImages([]);
    setDetectionStatus("idle");
    setFeedbackMessage("Face capture reset. Start camera to begin again.");

    // Don't automatically restart camera - let user decide
    if (cameraActive) {
      startFaceDetection();
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
                <Label htmlFor="bankAccount">Bank Account Number (Mock)</Label>
                <Input
                  id="bankAccount"
                  placeholder="Mock account number"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  required
                  disabled={isSubmitting || detectionStatus === "complete"}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address (Mock)</Label>
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
                      {/* Video Element */}
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        playsInline
                        autoPlay
                        style={{ transform: "scaleX(-1)" }}
                      />

                      {/* Hidden Canvas for Capturing */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Show inactive overlay when camera is not active */}
                      {!cameraActive &&
                        !isCapturing &&
                        detectionStatus !== "complete" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                            {cameraError ? (
                              <>
                                <VideoOff className="w-10 h-10 text-red-500 mb-2" />
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
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-blue-800 bg-opacity-90 z-10">
                            <p className="text-white text-center text-sm font-medium">
                              {detectionStatus === "no_face" && (
                                <>
                                  <AlertCircle className="w-4 h-4 inline mr-2 text-yellow-300" />
                                  No face detected. Position your face in frame.
                                </>
                              )}
                              {detectionStatus === "multiple_faces" && (
                                <>
                                  <AlertCircle className="w-4 h-4 inline mr-2 text-orange-300" />
                                  Multiple faces detected. Ensure only you are
                                  visible.
                                </>
                              )}
                              {detectionStatus === "ready_to_capture" && (
                                <>
                                  <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-300" />
                                  Face detected! Ready to capture.
                                </>
                              )}
                            </p>
                          </div>
                        )}

                      {/* Loading overlay */}
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                          <span className="text-white ml-3">
                            Starting camera...
                          </span>
                        </div>
                      )}

                      {/* Capture in progress overlay */}
                      {isCapturing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
                          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
                          <p className="text-white text-center text-lg font-medium">
                            Capturing {capturedImages.length}/{CAPTURE_COUNT}...
                          </p>
                          <Progress
                            value={captureProgress}
                            className="w-3/4 h-2 mt-4 bg-gray-600"
                          />
                        </div>
                      )}

                      {/* Success overlay */}
                      {detectionStatus === "complete" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-2">
                            <svg
                              className="w-10 h-10 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <p className="text-white font-medium text-lg">
                            Face Capture Complete
                          </p>
                          <p className="text-white/80 text-sm mt-1">
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
                            className={`px-4 py-2 ${
                              cameraActive
                                ? "bg-gray-400"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                          >
                            Start Camera
                          </Button>

                          <Button
                            type="button"
                            onClick={stopCamera}
                            disabled={!cameraActive}
                            className={`px-4 py-2 ${
                              !cameraActive
                                ? "bg-gray-400"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
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
                            className={`px-4 py-2 ${
                              !cameraActive ||
                              detectionStatus !== "ready_to_capture"
                                ? "bg-gray-400"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                          >
                            Capture Face
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
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                      <h3 className="font-medium text-blue-800 mb-2">
                        {detectionStatus === "complete"
                          ? "✅ Face Capture Completed"
                          : "Face Capture Instructions"}
                      </h3>

                      {detectionStatus !== "complete" ? (
                        <ol className="text-sm text-blue-700 space-y-2 list-decimal pl-4">
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
                          <p className="text-sm text-blue-700 mb-2">
                            Your face has been successfully captured with{" "}
                            {CAPTURE_COUNT} images. You can now complete your
                            registration.
                          </p>

                          <div className="mt-3 pt-3 border-t border-blue-100">
                            <p className="text-xs text-blue-600 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              These images will be stored securely for
                              verification.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Status Cards */}
                    {cameraActive &&
                      !isCapturing &&
                      detectionStatus !== "complete" && (
                        <div className="bg-green-50 border border-green-100 p-3 rounded-md">
                          <p className="text-sm text-green-700">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Camera is active! {feedbackMessage}
                          </p>
                        </div>
                      )}

                    {cameraError && (
                      <div className="bg-red-50 border border-red-100 p-3 rounded-md">
                        <p className="text-sm text-red-700">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {cameraError}
                        </p>
                      </div>
                    )}

                    {isCapturing && (
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-md">
                        <p className="text-sm text-blue-700 flex items-center">
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Capturing {capturedImages.length} of {CAPTURE_COUNT}{" "}
                          images...
                        </p>
                        <Progress
                          value={captureProgress}
                          className="mt-2 h-1"
                        />
                      </div>
                    )}

                    {detectionStatus === "complete" && (
                      <div className="bg-green-50 border border-green-100 p-3 rounded-md">
                        <p className="text-sm text-green-700 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          All {CAPTURE_COUNT} images captured successfully!
                        </p>
                      </div>
                    )}
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
