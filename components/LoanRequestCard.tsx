import React from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Loader2, ThumbsUp, ThumbsDown, Info } from "lucide-react";
import { Request as LoanRequest } from "@/lib/types";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface LoanRequestCardProps {
  request: LoanRequest & { requesterName: string };
  isVoting: boolean;
  canVote: boolean;
  isOwnRequest: boolean;
  hasVoted: boolean;
  onVote: (requestId: string, voteType: "approve" | "reject") => Promise<void>;
}

export function LoanRequestCard({
  request: req,
  isVoting,
  canVote,
  isOwnRequest,
  hasVoted,
  onVote,
}: LoanRequestCardProps) {
  const approvedVotes = req.approvedBy.length;
  const rejectedVotes = req.rejectedBy.length;
  const votesNeeded = req.votesRequired;
  const remainingVotes = Math.max(0, votesNeeded - approvedVotes);

  // Updated Chart data with Ghibli-inspired colors
  const chartData = {
    labels: ['Approved', 'Rejected', 'Remaining'],
    datasets: [
      {
        data: [approvedVotes, rejectedVotes, remainingVotes],
        backgroundColor: [
          'rgba(134, 187, 166, 0.85)',  // Soft sage green
          'rgba(207, 127, 127, 0.85)',  // Dusty rose
          'rgba(200, 204, 213, 0.75)',  // Muted cloud gray
        ],
        borderColor: [
          'rgb(108, 168, 143)',  // Darker sage
          'rgb(186, 110, 110)',  // Darker rose
          'rgb(176, 181, 191)',  // Darker gray
        ],
        borderWidth: 2,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
      },
    ],
  };

  // Updated chart options
  const chartOptions = {
    cutout: '55%', // Makes the inner circle larger (smaller hole)
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true, // Makes legend items circular
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: '#64748b', // Slate-500 color for better readability
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#334155', // Slate-700
        bodyColor: '#475569',  // Slate-600
        borderColor: '#e2e8f0', // Slate-200
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} votes`;
          }
        }
      }
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side - Loan Details */}
          <div className="space-y-6">
            {/* Title and Badge in a flex container */}
            <div className="relative flex flex-col items-center mb-6">
              <CardTitle className="text-4xl font-bold text-center mb-2 leading-tight">
                {req.type === "loan" ? req.title : "Deposit Request"}
              </CardTitle>
              <div className="absolute top-4 right-0"> {/* Changed from top-0 to top-4 */}
                <Badge
                  variant={req.type === "loan" ? "default" : "secondary"}
                  className="capitalize text-sm px-4 py-1"
                >
                  {req.type}
                </Badge>
              </div>
            </div>

            {/* Quick Info Section */}
            <div className="bg-muted/20 rounded-lg p-4 space-y-2.5">
              <p className="text-lg">
                <span className="font-medium">Requester:</span> {req.requesterName}
              </p>
              <p className="text-lg">
                <span className="font-medium">Amount:</span>{" "}
                ₹{req.amount.toLocaleString("en-IN")}
              </p>
              {req.type === "loan" && req.category && (
                <p className="text-lg">
                  <span className="font-medium">Category:</span> {req.category}
                </p>
              )}
              {/* New Loan Status
              <p className="text-lg">
                <span className="font-medium">Loan Status:</span>{" "}
                <span 
                  className={`${
                    req.status === "completed" 
                      ? "text-green-600" 
                      : "text-amber-600"
                  } font-semibold`}
                >
                  {req.status === "completed" ? "Completed" : "Pending"}
                </span>
              </p> */}
            </div>

            <Separator className="my-4" />
            
            {/* Purpose section */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-base font-medium mb-2">Purpose:</p>
              <p className="text-base text-muted-foreground leading-relaxed">
                {req.details}
              </p>
            </div>
          </div>

          {/* Right side - Chart and Voting */}
          <div className="space-y-6">
            <div className="w-full max-w-[250px] mx-auto">
              <div className="relative p-4 bg-muted/20 rounded-lg shadow-inner">
                <Doughnut data={chartData} options={chartOptions} />
                <p className="text-center text-sm text-muted-foreground mt-6">
                  {votesNeeded > 0
                    ? `${approvedVotes}/${votesNeeded} votes needed`
                    : "No votes needed"}
                </p>
              </div>
            </div>

            {canVote && (
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onVote(req.id, "reject")}
                  disabled={isVoting}
                >
                  {isVoting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <ThumbsDown className="h-4 w-4 mr-1" />
                  )}
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                  onClick={() => onVote(req.id, "approve")}
                  disabled={isVoting}
                >
                  {isVoting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>
              </div>
            )}

            {!canVote && (
              <p className="text-center text-sm text-muted-foreground italic">
                {isOwnRequest
                  ? "This is your own request"
                  : hasVoted
                  ? "You have already voted"
                  : "Cannot vote"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const mockRequests = [
  {
    id: "loan-123",
    type: "loan" as const,
    title: "Education Loan Request",
    details: "Need financial assistance for college tuition fees",
    amount: 50000,
    category: "Education",
    userId: "user1",
    requesterName: "John Doe",
    approvedBy: ["voter1", "voter2"],
    rejectedBy: [],
    votesRequired: 5,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "deposit-456",
    type: "deposit" as const,
    title: "Deposit Request",
    details: "Monthly contribution to community fund",
    amount: 25000,
    userId: "user2",
    requesterName: "Jane Smith",
    approvedBy: ["voter1"],
    rejectedBy: ["voter3"],
    votesRequired: 3,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  }
];

export function LoanRequestDemo() {
  const handleVote = async (requestId: string, voteType: "approve" | "reject") => {
    console.log(`Voted ${voteType} for request ${requestId}`);
    return Promise.resolve();
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold mb-4">Loan Request Examples</h2>
      
      <div>
        <h3 className="text-sm font-semibold mb-2">1. Can Vote:</h3>
        <LoanRequestCard
          request={mockRequests[0]}
          isVoting={false}
          canVote={true}
          isOwnRequest={false}
          hasVoted={false}
          onVote={handleVote}
        />
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">2. Own Request:</h3>
        <LoanRequestCard
          request={mockRequests[0]}
          isVoting={false}
          canVote={false}
          isOwnRequest={true}
          hasVoted={false}
          onVote={handleVote}
        />
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">3. Already Voted:</h3>
        <LoanRequestCard
          request={mockRequests[1]}
          isVoting={false}
          canVote={false}
          isOwnRequest={false}
          hasVoted={true}
          onVote={handleVote}
        />
      </div>
    </div>
  );
}
