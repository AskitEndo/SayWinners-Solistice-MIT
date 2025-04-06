"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  History as HistoryIcon,
  BarChart as LineChartIcon,
  Info as InfoIcon,
  Trophy as TrophyIcon,
  Github as GithubIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

export const Footer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Check if the current path matches the button path
  const isActive = (path: string) => pathname === path;

  return (
    <footer className="bg-background/80 backdrop-blur border-t-2 border-border py-4 w-full font-nunito relative z-10">
      <div className="container mx-auto px-4">
        {/* Navigation buttons */}
        <div className="flex flex-col items-center justify-center mb-6">
          <h3 className="text-lg font-medium text-foreground/80 mb-3">
            Quick Navigation
          </h3>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <Button
              variant={isActive("/history") ? "default" : "outline"}
              size="lg"
              className={`font-medium px-4 py-6 text-sm transition-all ${
                isActive("/history")
                  ? "bg-primary text-primary-foreground shadow-primary"
                  : "border-2 border-primary/30 hover:border-primary hover:bg-primary/5"
              }`}
              onClick={() => router.push("/history")}
            >
              <HistoryIcon className="mr-2 h-4 w-4" />
              Transaction History
            </Button>

            <Button
              variant={isActive("/graph") ? "secondary" : "outline"}
              size="lg"
              className={`font-medium px-4 py-6 text-sm transition-all ${
                isActive("/graph")
                  ? "bg-secondary text-secondary-foreground"
                  : "border-2 border-secondary/30 hover:border-secondary hover:bg-secondary/5"
              }`}
              onClick={() => router.push("/graph")}
            >
              <LineChartIcon className="mr-2 h-4 w-4" />
              Analytics
            </Button>

            <Button
              variant={isActive("/about") ? "ghost" : "ghost"}
              size="lg"
              className={`font-medium px-4 py-6 text-sm transition-all ${
                isActive("/about")
                  ? "bg-muted text-foreground"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => router.push("/about")}
            >
              <InfoIcon className="mr-2 h-4 w-4" />
              About
            </Button>
          </div>
        </div>

        <Separator className="my-4 opacity-30" />

        {/* Footer content - two columns on larger screens */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left side - About DhanSetu */}
          <div className="md:text-left text-center">
            <h3 className="font-bold mb-1 text-foreground">DhanSetu</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              A community-driven platform that facilitates financial solidarity
              through democratic loan approvals and transparent fund management.
            </p>
          </div>

          {/* Right side - Footer credit and github link */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <motion.div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span>© DhanSetu is created by</span>
              <span className="font-bold text-primary flex items-center">
                Team SayWinners
                <TrophyIcon className="ml-1 h-3 w-3 text-amber-500" />
              </span>
              <span>in MIT Solestice Competition</span>
            </motion.div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() =>
                window.open(
                  "https://github.com/AskitEndo/SayWinners-Solistice-MIT",
                  "_blank"
                )
              }
            >
              <GithubIcon className="h-3.5 w-3.5" />
              View on GitHub
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};
