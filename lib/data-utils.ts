// lib/data-utils.ts
import fs from "fs/promises";
import path from "path";
import { User, Request, GlobalState } from "./types";

// Define paths to JSON files
const dataDir = path.join(process.cwd(), "data");
const usersFilePath = path.join(dataDir, "users.json");
const requestsFilePath = path.join(dataDir, "requests.json");
const globalStateFilePath = path.join(dataDir, "globalState.json");

// Ensure data directory exists
const ensureDataDirExists = async () => {
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir);
    console.log("Data directory created.");
  }
};

// Generic function to read JSON data
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  await ensureDataDirExists(); // Make sure dir exists before reading/writing
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent) as T;
  } catch (error: any) {
    // If file doesn't exist or is empty/invalid, return default and create it
    if (error.code === "ENOENT" || error instanceof SyntaxError) {
      console.warn(
        `Warning: File not found or invalid JSON at ${filePath}. Initializing with default.`
      );
      await writeJsonFile(filePath, defaultValue); // Create file with default value
      return defaultValue;
    }
    console.error(`Error reading JSON file at ${filePath}:`, error);
    throw error; // Rethrow other errors
  }
}

// Generic function to write JSON data
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDirExists();
  try {
    const jsonData = JSON.stringify(data, null, 2); // Pretty print JSON
    await fs.writeFile(filePath, jsonData, "utf-8");
  } catch (error) {
    console.error(`Error writing JSON file at ${filePath}:`, error);
    throw error;
  }
}

// Specific data access functions
export const getUsers = async (): Promise<User[]> => {
  return readJsonFile<User[]>(usersFilePath, []);
};

export const saveUsers = async (users: User[]): Promise<void> => {
  await writeJsonFile(usersFilePath, users);
};

export const getRequests = async (): Promise<Request[]> => {
  return readJsonFile<Request[]>(requestsFilePath, []);
};

export const saveRequests = async (requests: Request[]): Promise<void> => {
  await writeJsonFile(requestsFilePath, requests);
};

export const getGlobalState = async (): Promise<GlobalState> => {
  const defaultState: GlobalState = {
    totalFund: 100000, // Default if file is missing/corrupt
    lastUpdated: new Date().toISOString(),
  };
  return readJsonFile<GlobalState>(globalStateFilePath, defaultState);
};

export const saveGlobalState = async (state: GlobalState): Promise<void> => {
  await writeJsonFile(globalStateFilePath, {
    ...state,
    lastUpdated: new Date().toISOString(), // Always update timestamp on save
  });
};
