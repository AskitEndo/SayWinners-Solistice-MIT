"use client";

import React from "react";
import Image from "next/image";
import "@/styles/loading-coin.css";

interface LoadingCoinProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  speed?: "slow" | "normal" | "fast";
  showText?: boolean;
  text?: string;
}

export const LoadingCoin: React.FC<LoadingCoinProps> = ({
  className = "",
  size = "md",
  speed = "normal",
  showText = true,
  text = "Loading",
}) => {
  return (
    <div className={`loading-container ${className}`}>
      <div className="perspective-container">
        <div className={`coin coin-${size} spin-${speed}`}>
          <div className="coin-front">
            <Image
              src="/images/coin.png"
              alt="Loading"
              width={size === "lg" ? 96 : size === "md" ? 64 : 48}
              height={size === "lg" ? 96 : size === "md" ? 64 : 48}
              priority
            />
          </div>
          <div className="coin-edge"></div>
          <div className="coin-back"></div>
        </div>
      </div>

      {showText && (
        <div className="loading-text">
          {text}
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
        </div>
      )}
    </div>
  );
};
