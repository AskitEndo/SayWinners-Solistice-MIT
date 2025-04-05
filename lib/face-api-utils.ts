// lib/face-api-utils.ts
import * as faceapi from "face-api.js";

// Flag to ensure models are loaded only once
let modelsLoaded = false;

// Path to the models directory in the public folder
const MODEL_URL = "/models";

// Local storage keys
const USERS_STORAGE_KEY = "dhanSetu_users";

// Interface for stored user data
export interface StoredUser {
  userId: string;
  name: string;
  email: string;
  faceDescriptor: number[]; // Float32Array stored as regular array
  createdAt: string;
}

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
    // Only load face detection model for simplicity
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    modelsLoaded = true;
    console.log("FaceAPI models loaded successfully.");
  } catch (error) {
    console.error("Error loading FaceAPI models:", error);
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
 * Detects if there is a face in the video stream - simplified version
 * @param videoElement The HTMLVideoElement currently displaying the webcam stream.
 * @returns A Promise resolving to true if a face is detected, false otherwise
 */
export const isFaceDetected = async (
  videoElement: HTMLVideoElement | null
): Promise<boolean> => {
  if (!modelsLoaded) {
    console.error("Models not loaded yet.");
    throw new Error("Face API models are not loaded.");
  }

  if (!videoElement || videoElement.readyState < 3) {
    console.error("Video element not ready or not provided.");
    return false;
  }

  try {
    console.log("Checking for face presence...");
    // Detect faces with minimum confidence of 0.5
    const detections = await faceapi.detectAllFaces(
      videoElement,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    );

    const hasFace = detections.length > 0;
    console.log(`Face detected: ${hasFace ? "YES" : "NO"}`);
    return hasFace;
  } catch (error) {
    console.error("Error during face detection:", error);
    return false;
  }
};

/**
 * Store a user with their face descriptor in local storage
 */
export const storeUserFace = (
  name: string,
  email: string,
  faceDescriptor: Float32Array
): string => {
  // Generate a simple user ID
  const userId =
    Date.now().toString(36) + Math.random().toString(36).substring(2);

  // Create user object
  const user: StoredUser = {
    userId,
    name,
    email,
    faceDescriptor: Array.from(faceDescriptor), // Convert Float32Array to regular array for storage
    createdAt: new Date().toISOString(),
  };

  // Get existing users or initialize empty array
  const existingUsers: StoredUser[] = getStoredUsers();

  console.log("Before storing, existing users:", existingUsers);

  // Add new user
  existingUsers.push(user);

  console.log("After adding new user:", existingUsers);

  // Save back to local storage
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));

  // Verify it was stored
  const verifyStorage = localStorage.getItem(USERS_STORAGE_KEY);
  console.log("Verification from localStorage:", verifyStorage);

  return userId;
};

/**
 * Get all stored users from local storage
 */
export const getStoredUsers = (): StoredUser[] => {
  try {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);

    // Debug info
    console.log("Retrieved from localStorage:", usersJson);

    if (!usersJson) {
      console.log("No users stored in localStorage");
      return [];
    }

    const parsedUsers = JSON.parse(usersJson);
    console.log("Parsed users:", parsedUsers);
    return parsedUsers;
  } catch (error) {
    console.error("Error retrieving stored users:", error);
    return [];
  }
};

/**
 * Find a user by name and user ID from API
 */
export const findUserByCredentials = async (
  name: string,
  userId: string
): Promise<any> => {
  try {
    console.log("Fetching users from API for credential verification");

    // Create a credential verification endpoint
    const response = await fetch("/api/auth/verify-credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, userId }), // Changed from email to userId
    });

    if (!response.ok) {
      console.error("API error:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("API response for credentials:", data);

    if (data.user) {
      return data.user;
    }

    return null;
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return null;
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

/**
 * Clear all stored users (for testing/development)
 */
export const clearStoredUsers = (): void => {
  localStorage.removeItem(USERS_STORAGE_KEY);
  console.log("All stored users cleared");
};
