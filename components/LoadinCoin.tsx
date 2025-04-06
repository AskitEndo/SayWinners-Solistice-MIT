"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type SpeedType = "slow" | "normal" | "fast";

interface LoadingCoinProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  randomizeSpeed?: boolean;
  initialSpeed?: SpeedType;
  showText?: boolean;
  text?: string;
}

export const LoadingCoin: React.FC<LoadingCoinProps> = ({
  className,
  size = "md",
  randomizeSpeed = false,
  initialSpeed = "normal",
  showText = true,
  text = "Loading",
}) => {
  const [currentSpeed, setCurrentSpeed] = useState<SpeedType>(initialSpeed);

  const getRandomSpeed = (): SpeedType => {
    const speeds: SpeedType[] = ["slow", "normal", "fast"];
    const randomIndex = Math.floor(Math.random() * speeds.length);
    return speeds[randomIndex];
  };

  useEffect(() => {
    if (!randomizeSpeed) return;
    const intervalTime = Math.random() * (3000 - 1000) + 1000;
    const interval = setInterval(() => {
      setCurrentSpeed(getRandomSpeed());
    }, intervalTime);
    return () => clearInterval(interval);
  }, [randomizeSpeed]);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div className={cn("loading-container", className)}>
      <div className="perspective-container">
        <div className={cn("coin", sizeClasses[size], `spin-${currentSpeed}`)}>
          {/* Front face */}
          <div className="coin-front">
            <Image
              src="/images/coin.png"
              alt="Loading"
              width={size === "lg" ? 96 : size === "md" ? 64 : 48}
              height={size === "lg" ? 96 : size === "md" ? 64 : 48}
              priority
              className="relative z-20"
            />
          </div>

          {/* Edge segments for better 3D effect */}
          <div className="coin-edge-container">
            {Array.from({ length: 36 }).map((_, index) => (
              <div
                key={index}
                className="coin-edge"
                style={{
                  transform: `rotateY(${
                    index * 10
                  }deg) translateX(-50%) translateZ(12px)`,
                  background: index % 2 === 0 ? "#997a00" : "#FFF200",
                }}
              />
            ))}
          </div>

          {/* Back face */}
          <div className="coin-back" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col items-center gap-2">
          <div className="loading-text">
            {text}
            <span className="loading-dot">.</span>
            <span className="loading-dot">.</span>
            <span className="loading-dot">.</span>
          </div>
          {randomizeSpeed && (
            <span className="text-xs text-muted-foreground">
              Speed: {currentSpeed}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingCoin;
