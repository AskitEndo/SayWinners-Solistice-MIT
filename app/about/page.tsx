"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  GithubIcon,
  LinkedinIcon,
  TwitterIcon,
  AwardIcon,
  TrophyIcon,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            About DhanSetu
          </h1>
          <p className="text-xl text-muted-foreground">
            Bridging communities through financial solidarity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-4">
              DhanSetu was created to build a community-driven financial support
              system that operates on trust and mutual aid. We aim to bridge the
              gap between those who need financial assistance and those who can
              provide it.
            </p>
            <p className="text-lg text-muted-foreground">
              Built on blockchain principles of transparency and community
              governance, DhanSetu lets members vote on loan approvals, creating
              a truly democratic financial ecosystem.
            </p>
          </div>
          <div className="relative h-60 md:h-full rounded-lg overflow-hidden">
            <Image
              src="/images/compare.svg"
              alt="DhanSetu Mission"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <Card className="border-2 border-primary/10 shadow-lg mb-12">
          <CardContent className="p-8">
            <div className="flex items-center justify-center mb-6">
              <Badge className="text-base py-2 px-4 bg-secondary/20 text-secondary border-secondary/30">
                <TrophyIcon className="mr-2 h-4 w-4 text-amber-500" />
                MIT Solestice Competition
              </Badge>
            </div>
            <p className="text-center text-lg mb-6">
              DhanSetu is a proud project created by Team SayWinners for the MIT
              Solestice Competition. Our innovation in community-based financial
              solutions earned recognition in this prestigious event.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <AwardIcon className="h-4 w-4" />
                Competition Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-6">Meet Team SayWinners</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {/* Team members will be added here */}
          <Card className="border-2 border-primary/5 hover:border-primary/20 transition-all">
            <CardContent className="p-4 text-center">
              <div className="w-20 h-20 mx-auto mb-4 relative rounded-full overflow-hidden bg-muted">
                {/* Placeholder for team member image */}
              </div>
              <h3 className="font-bold">Team Member</h3>
              <p className="text-sm text-muted-foreground mb-3">Role</p>
              <div className="flex justify-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <LinkedinIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <GithubIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Repeat for other team members */}
        </div>

        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Get Involved</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Interested in contributing to DhanSetu or learning more about our
            project?
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button variant="default" size="lg" className="gap-2">
              <GithubIcon className="h-5 w-5" />
              GitHub Repository
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <TwitterIcon className="h-5 w-5" />
              Follow Us
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
