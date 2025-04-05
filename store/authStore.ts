// store/authStore.ts
import { create } from "zustand";
import { User } from "@/lib/types"; // Make sure this path is correct

// Define the shape of the user data we'll store
type StoredUser = Pick<User, "id" | "name" | "email" | "accountBalance">;

interface AuthState {
  user: StoredUser | null;
  isLoggedIn: boolean;
  login: (userData: StoredUser) => void;
  logout: () => void;
  // Optional: function to update balance after transactions
  updateBalance: (newBalance: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  login: (userData) => {
    console.log("AuthStore: Logging in user:", userData.name);
    set({ user: userData, isLoggedIn: true });
  },
  logout: () => {
    console.log("AuthStore: Logging out.");
    set({ user: null, isLoggedIn: false });
  },
  updateBalance: (newBalance) =>
    set((state) => {
      if (state.user) {
        console.log(
          `AuthStore: Updating balance for ${state.user.name} to ${newBalance}`
        );
        return { user: { ...state.user, accountBalance: newBalance } };
      }
      return {}; // No change if not logged in
    }),
}));
