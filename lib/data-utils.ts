// lib/data-utils.ts
import fs from "fs/promises";
import path from "path";
import { User, Request as LoanRequest, GlobalState } from "./types";

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
    await fs.mkdir(dataDir, { recursive: true });
    console.log("Data directory created.");
  }
};

// Generic function to read JSON data
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  await ensureDataDirExists();

  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or can't be read, return default value
    await writeJsonFile(filePath, defaultValue);
    return defaultValue;
  }
}

// Generic function to write JSON data
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDirExists();

  // Format JSON with indentation for better readability
  const jsonString = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonString, "utf8");
}

// Export functions for users
export const getUsers = async (): Promise<User[]> => {
  return readJsonFile<User[]>(usersFilePath, []);
};

export const saveUsers = async (users: User[]): Promise<void> => {
  await writeJsonFile(usersFilePath, users);
};

// Export functions for requests
export const getRequests = async (): Promise<LoanRequest[]> => {
  return readJsonFile<LoanRequest[]>(requestsFilePath, []);
};

export const saveRequests = async (requests: LoanRequest[]): Promise<void> => {
  await writeJsonFile(requestsFilePath, requests);
};

// Export functions for global state
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
    lastUpdated: new Date().toISOString(), // Update timestamp
  });
};

// New function for transaction logging
export const logTransaction = async (
  requestId: string,
  type: "loan" | "deposit",
  userId: string,
  amount: number,
  success: boolean
): Promise<void> => {
  const transaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    requestId,
    type,
    userId,
    amount,
    success,
    timestamp: new Date().toISOString(),
  };

  const transactionsPath = path.join(dataDir, "transactions.json");
  const transactions = await readJsonFile<any[]>(transactionsPath, []);
  transactions.push(transaction);
  await writeJsonFile(transactionsPath, transactions);
};
