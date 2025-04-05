"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function CamCheck() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [log, setLog] = useState([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef(null);

  // Add to log with timestamp
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Load face-api models
  const loadModels = async () => {
    try {
      addLog("Loading face-api.js models...");

      const MODEL_URL = "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      addLog("✅ Models loaded successfully");
      setModelLoaded(true);
    } catch (error) {
      addLog(`❌ Error loading models: ${error.message}`);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      addLog("Starting camera...");

      // Stop any existing stream
      if (streamRef.current) {
        addLog("Stopping existing stream first");
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

      addLog(`✅ Camera stream obtained: ${stream.id}`);
      addLog(`Active video tracks: ${stream.getVideoTracks().length}`);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for metadata to load
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            addLog("Video metadata loaded");
            resolve();
          };
        });

        // Start playing
        await videoRef.current.play();
        addLog("✅ Video playback started");
        setCameraActive(true);

        // Log video element state
        const videoEl = videoRef.current;
        addLog(
          `Video state: ${videoEl.readyState}, paused: ${videoEl.paused}, width: ${videoEl.videoWidth}x${videoEl.videoHeight}`
        );

        // Start monitoring video state
        startVideoMonitoring();
      }
    } catch (error) {
      addLog(`❌ Camera error: ${error.message}`);
    }
  };

  // Monitor video state periodically
  const startVideoMonitoring = () => {
    const interval = setInterval(() => {
      if (!videoRef.current) {
        clearInterval(interval);
        return;
      }

      const video = videoRef.current;
      const active = !video.paused && video.readyState >= 2;

      if (active !== cameraActive) {
        setCameraActive(active);
        addLog(
          `Video state changed - playing: ${active}, readyState: ${video.readyState}`
        );
      }

      // If video somehow paused but camera should be active, try to restart
      if (cameraActive && video.paused) {
        addLog("Video paused unexpectedly, attempting to restart");
        video.play().catch((e) => addLog(`Failed to restart: ${e.message}`));
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      addLog("Stopping camera stream...");
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        addLog(`Stopped track: ${track.kind}, state: ${track.readyState}`);
      });
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setCameraActive(false);
      addLog("✅ Camera stopped");
    } else {
      addLog("No active stream to stop");
    }
  };

  // Detect faces (just for testing model works)
  const detectFace = async () => {
    if (!videoRef.current || !modelLoaded || !cameraActive) {
      addLog("Cannot detect - video or models not ready");
      return;
    }

    try {
      addLog("Detecting faces...");
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      addLog(`✅ Detection complete - found ${detections.length} faces`);

      // Draw detections if canvas exists
      if (canvasRef.current) {
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

        addLog("✅ Drew detections on canvas");
      }
    } catch (error) {
      addLog(`❌ Detection error: ${error.message}`);
    }
  };

  // Load models on component mount
  useEffect(() => {
    loadModels();

    // Cleanup on unmount
    return () => {
      stopCamera();
      addLog("Component unmounted - cleaned up");
    };
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Camera and Face API Test</h1>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2 space-y-4">
          <div
            className="relative bg-black w-full"
            style={{ aspectRatio: "4/3" }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                Camera inactive
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={startCamera}
              disabled={cameraActive}
              className={`px-4 py-2 rounded ${
                cameraActive
                  ? "bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              Start Camera
            </button>

            <button
              onClick={stopCamera}
              disabled={!cameraActive}
              className={`px-4 py-2 rounded ${
                !cameraActive
                  ? "bg-gray-400"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              Stop Camera
            </button>

            <button
              onClick={detectFace}
              disabled={!cameraActive || !modelLoaded}
              className={`px-4 py-2 rounded ${
                !cameraActive || !modelLoaded
                  ? "bg-gray-400"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              Detect Face
            </button>
          </div>

          <div className="text-sm">
            <p>
              <strong>Camera status:</strong>{" "}
              {cameraActive ? "Active" : "Inactive"}
            </p>
            <p>
              <strong>Models status:</strong>{" "}
              {modelLoaded ? "Loaded" : "Not loaded"}
            </p>
            {videoRef.current && (
              <p>
                <strong>Video element:</strong>
                {videoRef.current.readyState}/4,
                {videoRef.current.paused ? "paused" : "playing"},
                {videoRef.current.videoWidth}x{videoRef.current.videoHeight}
              </p>
            )}
          </div>
        </div>

        <div className="md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Debug Log</h2>
          <div className="bg-gray-900 text-green-400 p-2 rounded h-[400px] overflow-y-auto font-mono text-sm">
            {log.map((entry, i) => (
              <div key={i} className="mb-1">
                {entry}
              </div>
            ))}
            {log.length === 0 && (
              <div className="opacity-50">Waiting for events...</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          This is a minimal test page to diagnose webcam and face-api.js issues.
          Check the console for additional logs.
        </p>
      </div>
    </div>
  );
}
