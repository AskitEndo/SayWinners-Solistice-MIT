"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface FaceVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaceVerification({
  open,
  onOpenChange,
}: FaceVerificationProps) {
  const router = useRouter();

  const handleLoginClick = () => {
    onOpenChange(false);
    router.push("/login");
  };

  const handleRegisterClick = () => {
    onOpenChange(false);
    router.push("/register");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Identity Verification</DialogTitle>
          <DialogDescription>
            Please log in with your credentials and face ID or register a new
            account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={handleLoginClick}
            className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded"
          >
            Login
          </button>
          <button
            onClick={handleRegisterClick}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white py-2 px-4 rounded"
          >
            Register
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
