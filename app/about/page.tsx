"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  GithubIcon,
  LinkedinIcon,
  TwitterIcon,
  AwardIcon,
  TrophyIcon,
  Code,
  Brush,
  BarChart,
  Terminal,
  ExternalLink,
  Github,
} from "lucide-react";

// Team member data with GitHub profile pictures
const teamMembers = [
  {
    name: "Askit Endo",
    role: "Team Lead & Backend",
    imageSrc: "/images/team/ankit.jpg", // Local path
    description:
      "Led the project development and implemented backend infrastructure",
    icon: <Terminal className="h-5 w-5 text-primary" />,
  },
  {
    name: "Darpan Endo",
    role: "UI & Design",
    imageSrc: "/images/team/sneha.jpg", // Local path
    description: "Created the intuitive and engaging user interface",
    icon: <Brush className="h-5 w-5 text-primary" />,
  },
  {
    name: "Fr0nSen",
    role: "Data Analytics & UX",
    imageSrc: "/images/team/yash.png", // Local path
    description: "Implemented data visualization and enhanced user experience",
    icon: <BarChart className="h-5 w-5 text-primary" />,
  },
];

// Technology stack with locally stored skill icons
const techStack = [
  { name: "Next.js", icon: "/images/tech/nextjs.png" },
  { name: "TypeScript", icon: "/images/tech/typescript.png" },
  { name: "Tailwind CSS", icon: "/images/tech/tailwind.png" },
  { name: "React", icon: "/images/tech/react.png" },
  { name: "Node.js", icon: "/images/tech/nodejs.png" },
  { name: "MongoDB", icon: "/images/tech/mongodb.png" },
  { name: "Framer Motion", icon: "/images/tech/framer.png" },
  { name: "Git", icon: "/images/tech/git.png" },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            About DhanSetu
          </h1>
          <p className="text-xl text-muted-foreground">
            Bridging communities through financial solidarity
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Code className="text-primary" />
              Our Mission
            </h2>
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

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Key Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Secure face verification for identity protection
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Community-driven voting system for loan approvals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Transparent transaction history and analytics
                </li>
              </ul>
            </div>
          </div>
          <div className="relative h-60 md:h-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
            <Image
              src="/images/compare.svg"
              alt="DhanSetu Mission"
              fill
              className="object-contain p-4"
            />
          </div>
        </div>

        {/* MIT Solestice Section */}
        <Card className="border-2 border-primary/10 shadow-lg mb-12 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-1">
            <CardContent className="p-8 bg-background/90">
              <div className="flex items-center justify-center mb-6">
                <Badge className="text-amber-900 py-2 px-4 bg-secondary/20 border-secondary/30">
                  <TrophyIcon className="mr-2 h-4 w-4 text-amber-500" />
                  MIT Solestice Competition
                </Badge>
              </div>
              <p className="text-center text-lg mb-6">
                DhanSetu is a proud project created by Team SayWinners for the
                MIT Solestice Competition. Our innovation in community-based
                financial solutions earned recognition in this prestigious
                event.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <AwardIcon className="h-4 w-4" />
                  Competition Details
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Team Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-2 text-center">
            Meet Team SayWinners
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            The talented individuals behind DhanSetu
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="border-2 border-primary/5 hover:border-primary/20 transition-all h-full group">
                  <CardContent className="p-6 text-center h-full flex flex-col">
                    <div className="mb-4 w-20 h-20 mx-auto rounded-full overflow-hidden relative">
                      {/* Use a placeholder image for now - you'll need to add the actual image files */}
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        {member.icon}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg">{member.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1">
                      {member.icon}
                      {member.role}
                    </p>
                    <Separator className="my-3" />
                    <p className="text-sm text-muted-foreground mb-5 flex-grow">
                      {member.description}
                    </p>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="group-hover:bg-primary/10 transition-colors"
                      >
                        <Github className="h-4 w-4 mr-2" />
                        GitHub Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Get Involved Section */}
        <div className="text-center mb-12 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Get Involved</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Interested in contributing to DhanSetu or learning more about our
            project? Check out our GitHub repository or follow us on social
            media.
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

        {/* Technology Stack - Using local images */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Our Technology Stack
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="text-center p-4 border border-primary/10 rounded-lg bg-card hover:bg-primary/5 transition-colors"
              >
                <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-background/50 rounded-md">
                  {/* This is a placeholder - you'll need to add actual icons */}
                  <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center text-primary text-xs">
                    {tech.name.slice(0, 2)}
                  </div>
                </div>
                <p className="text-sm font-medium">{tech.name}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Return to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
