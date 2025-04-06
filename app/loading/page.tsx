import React from "react";
import { LoadingCoin } from "@/components/LoadinCoin";

interface LoadingPageProps {
  message?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  message = "Loading your request",
}) => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <LoadingCoin
          size="lg"
          randomizeSpeed={true}
          initialSpeed="normal"
          showText={true}
          text={message}
          className="animate-in fade-in duration-500"
        />
      </div>
    </div>
  );
};

export default LoadingPage;
