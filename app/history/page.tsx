'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Filter, Calendar } from 'lucide-react';
import { Request as LoanRequest } from '@/lib/types';

const colors = {
  approved: 'rgb(108, 168, 143)',  // Darker sage
  rejected: 'rgb(186, 110, 110)',  // Darker rose
  pending: 'rgb(176, 181, 191)',   // Darker gray
};

// Interface for the history item card props
interface HistoryCardProps {
  request: LoanRequest & { requesterName: string };
}

// Ghibli-inspired motion card component
const HistoryCard = ({ request }: HistoryCardProps) => {
  // Determine status color based on request type and status
  const getStatusColor = () => {
    if (request.type === 'deposit') {
      return request.status === 'approved' ? colors.approved : colors.pending;
    }
    return request.status === 'approved' ? colors.approved : colors.rejected;
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={request.type === 'deposit' ? 'secondary' : 'default'}
                  className="capitalize"
                >
                  {request.type}
                </Badge>
                <Badge
                  variant={request.status === 'approved' ? 'outline' : 'destructive'}
                  className="capitalize"
                >
                  {request.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg">
                {request.type === 'loan' ? request.title : 'Deposit Request'}
              </h3>
              <p className="text-sm text-muted-foreground">
                By {request.requesterName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: getStatusColor() }}>
                ₹{request.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Additional details section */}
          <div className="mt-4 p-3 bg-muted/20 rounded-lg">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {request.details}
            </p>
          </div>

          {/* Vote counts */}
          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <span>✓ {request.approvedBy.length} approvals</span>
            <span>✗ {request.rejectedBy.length} rejections</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function HistoryPage() {
  const [requests, setRequests] = useState<(LoanRequest & { requesterName: string })[]>([]);
  const [filter, setFilter] = useState<'all' | 'deposits' | 'loans'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch history data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/requests/history');
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return filter === request.type + 's';
  });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
        <p className="text-muted-foreground">
          All past and ongoing transactions
        </p>
      </motion.div>

      {/* Filters */}
      <div className="mb-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" onClick={() => setFilter('all')}>
              All
            </TabsTrigger>
            <TabsTrigger value="deposits" onClick={() => setFilter('deposits')}>
              Deposits
            </TabsTrigger>
            <TabsTrigger value="loans" onClick={() => setFilter('loans')}>
              Loans
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredRequests.map((request) => (
                  <HistoryCard key={request.id} request={request} />
                ))}
              </AnimatePresence>
            </motion.div>
          </TabsContent>
          <TabsContent value="deposits">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredRequests.filter(r => r.type === 'deposit').map((request) => (
                  <HistoryCard key={request.id} request={request} />
                ))}
              </AnimatePresence>
            </motion.div>
          </TabsContent>
          <TabsContent value="loans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredRequests.filter(r => r.type === 'loan').map((request) => (
                  <HistoryCard key={request.id} request={request} />
                ))}
              </AnimatePresence>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Empty state */}
      {!isLoading && filteredRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">No transactions found</p>
        </motion.div>
      )}
    </div>
  );
}