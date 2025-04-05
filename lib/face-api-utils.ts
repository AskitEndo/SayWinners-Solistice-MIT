// lib/face-api-utils.ts
import * as faceapi from "face-api.js";

// Flag to ensure models are loaded only once
let modelsLoaded = false;

// Path to the models directory in the public folder
const MODEL_URL = "/models";

/**
 * Loads the required face-api.js models.
 * Ensures models are loaded only once.
 * Call this function before attempting any face detection/recognition.
 */
export const loadModels = async (): Promise<void> => {
  if (modelsLoaded) {
    console.log("FaceAPI models already loaded.");
    return;
  }

  try {
    console.log("Loading FaceAPI models...");
    // Load the models concurrently
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Fast and good for web/mobile
      // Or use TinyFaceDetector for even faster but less accurate detection:
      // faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // Detect facial landmarks
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL), // Compute face descriptor (for recognition)
      // faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL), // Optional: if you want expression detection
      // faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),      // Optional: if you want age/gender detection
    ]);
    modelsLoaded = true;
    console.log("FaceAPI models loaded successfully.");
  } catch (error) {
    console.error("Error loading FaceAPI models:", error);
    // Potentially set an error state or throw the error
    // depending on how you want to handle loading failures
    modelsLoaded = false; // Reset flag on failure
    throw new Error("Failed to load face detection models.");
  }
};

/**
 * Checks if the models have been loaded.
 * @returns {boolean} True if models are loaded, false otherwise.
 */
export const areModelsLoaded = (): boolean => {
  return modelsLoaded;
};

/**
 * Detects a single face in a video stream and computes its descriptor.
 * Assumes models are already loaded.
 *
 * @param videoElement The HTMLVideoElement currently displaying the webcam stream.
 * @returns A Promise resolving to the Float32Array descriptor or null if no face found/error.
 */
export const getFaceDescriptor = async (
  videoElement: HTMLVideoElement | null
): Promise<Float32Array | null> => {
  if (!modelsLoaded) {
    console.error("Models not loaded yet.");
    throw new Error("Face API models are not loaded.");
  }
  if (!videoElement || videoElement.readyState < 3) {
    // readyState < 3 means not enough data
    console.error("Video element not ready or not provided.");
    return null;
  }

  try {
    console.log("Attempting face detection...");
    // Detect a single face with landmarks and compute the descriptor
    const detection = await faceapi
      .detectSingleFace(
        videoElement,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      ) // Use appropriate detector and options
      // Or: .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks() // Load landmarks is required for descriptor computation
      .withFaceDescriptor();

    if (detection) {
      console.log("Face detected, descriptor computed.");
      return detection.descriptor;
    } else {
      console.log("No face detected in the frame.");
      return null;
    }
  } catch (error) {
    console.error(
      "Error during face detection or descriptor computation:",
      error
    );
    return null; // Return null or re-throw error as needed
  }
};

// Helper function to start webcam stream
export const startWebcam = async (
  videoElement: HTMLVideoElement
): Promise<MediaStream | null> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia is not supported by this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } }, // Request a reasonable resolution
    });
    videoElement.srcObject = stream;
    // Wait for the video metadata to load to get correct dimensions
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = resolve;
    });
    videoElement.play();
    console.log("Webcam started");
    return stream; // Return the stream so it can be stopped later
  } catch (err) {
    console.error("Error accessing webcam:", err);
    // Handle specific errors like NotAllowedError, NotFoundError
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError") {
        throw new Error(
          "Webcam permission denied. Please allow access in your browser settings."
        );
      } else if (err.name === "NotFoundError") {
        throw new Error(
          "No webcam found. Please ensure a camera is connected and enabled."
        );
      }
    }
    throw new Error("Could not start webcam."); // Generic error
  }
};

// Helper function to stop webcam stream
export const stopWebcam = (
  stream: MediaStream | null,
  videoElement: HTMLVideoElement | null
) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    console.log("Webcam stopped");
  }
  if (videoElement) {
    videoElement.srcObject = null; // Release the video source
  }
};
