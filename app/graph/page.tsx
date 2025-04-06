'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RootNode from '@/components/graph/RootNode';
import UserNode from '@/components/graph/UserNode';
import LoanNode from '@/components/graph/LoanNode';
import { SearchResultCard } from '@/components/graph/SearchResultCard';
import { Request as LoanRequest, User } from '@/lib/types';

// Custom Node Types
const nodeTypes = {
  rootNode: RootNode,
  userNode: UserNode,
  loanNode: LoanNode,
};

// Helper function to get edge color based on request type and status
const getEdgeStyle = (type: string, status: string) => {
  if (type === 'deposit') {
    return {
      stroke: status === 'pending' ? '#22c55e40' : '#22c55e',
      strokeWidth: 2,
      strokeDasharray: status === 'pending' ? '5,5' : 'none',
    };
  } else {
    return {
      stroke: status === 'pending' ? '#dc262640' : '#dc2626',
      strokeWidth: 2,
      strokeDasharray: status === 'pending' ? '5,5' : 'none',
    };
  }
};

interface SearchResult {
  type: 'user' | 'transaction' | 'request';
  data: any;
}

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = () => {
    setSearchQuery('');
    setSearchResult(null);
  };

  // Helper function to calculate positions
  const calculatePositions = useCallback((users: User[], requests: LoanRequest[]) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Root node (Global Fund) is always at center
    const rootNode: Node = {
      id: 'global-fund',
      type: 'rootNode',
      data: { 
        label: 'Global Fund', 
        amount: require('../../data/globalState.json').totalFund 
      },
      position: { x: 0, y: 0 },
    };
    nodes.push(rootNode);

    // Calculate radius based on number of users
    const userRadius = Math.max(300, users.length * 100);
    const requestRadius = 150; // Distance of requests from their users

    // Position users in a circle
    users.forEach((user, index) => {
      const angle = (2 * Math.PI * index) / users.length;
      const x = userRadius * Math.cos(angle);
      const y = userRadius * Math.sin(angle);

      // Add user node
      nodes.push({
        id: user.id,
        type: 'userNode',
        data: {
          name: user.name,
          balance: user.accountBalance,
        },
        position: { x, y },
      });

      // Connect user to global fund
      edges.push({
        id: `global-${user.id}`,
        source: 'global-fund',
        target: user.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#4834d4', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#4834d4',
        },
      });

      // Find and position request nodes for this user
      const userRequests = requests.filter(req => req.userId === user.id);
      userRequests.forEach((request, reqIndex) => {
        const requestNodeId = `request-${request.id}`;
        const requestAngle = angle + ((reqIndex * Math.PI) / Math.max(userRequests.length, 2));
        const requestX = x + requestRadius * Math.cos(requestAngle);
        const requestY = y + requestRadius * Math.sin(requestAngle);

        // Add request node
        nodes.push({
          id: requestNodeId,
          type: 'loanNode',
          data: {
            amount: request.amount,
            status: request.status,
            type: request.type,
          },
          position: { x: requestX, y: requestY },
        });

        // Get edge style based on request type and status
        const edgeStyle = getEdgeStyle(request.type, request.status);

        // Add edge between user and request
        if (request.type === 'deposit') {
          // For deposits: request -> user -> global
          edges.push({
            id: `${requestNodeId}-${user.id}`,
            source: requestNodeId,
            target: user.id,
            type: 'smoothstep',
            animated: true,
            style: edgeStyle,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyle.stroke,
            },
          });

          // Add additional edge from user to global fund for deposits
          edges.push({
            id: `${user.id}-global-deposit-${request.id}`,
            source: user.id,
            target: 'global-fund',
            type: 'smoothstep',
            animated: true,
            style: edgeStyle,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyle.stroke,
            },
          });
        } else {
          // For loans: global -> user -> request
          edges.push({
            id: `${user.id}-${requestNodeId}`,
            source: user.id,
            target: requestNodeId,
            type: 'smoothstep',
            animated: true,
            style: edgeStyle,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyle.stroke,
            },
          });
        }
      });
    });

    return { nodes, edges };
  }, []);

  // Function to update graph
  const updateGraph = useCallback(async () => {
    try {
      // Fetch latest data
      const users: User[] = require('../../data/users.json');
      const requests: LoanRequest[] = require('../../data/requests.json');
      
      // Calculate new positions
      const { nodes: newNodes, edges: newEdges } = calculatePositions(users, requests);
      
      // Update graph with smooth transitions
      setNodes(prevNodes => {
        return newNodes.map(node => {
          const existingNode = prevNodes.find(n => n.id === node.id);
          return {
            ...node,
            position: existingNode ? existingNode.position : node.position,
          };
        });
      });
      
      setEdges(newEdges);

    } catch (error) {
      console.error('Error updating graph:', error);
    }
  }, [calculatePositions]);

  // Initial graph setup
  useEffect(() => {
    updateGraph();
    
    // Set up polling for updates (every 5 seconds)
    const intervalId = setInterval(updateGraph, 5000);
    
    return () => clearInterval(intervalId);
  }, [updateGraph]);

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const users: User[] = require('../../data/users.json');
      const requests: LoanRequest[] = require('../../data/requests.json');

      let result: SearchResult | null = null;

      // Search in users
      const user = users.find(u => u.id === searchQuery);
      if (user) {
        result = { type: 'user', data: user };
      }

      // Search in requests
      if (!result) {
        const request = requests.find(r => r.id === searchQuery);
        if (request) {
          result = { type: 'request', data: request };
        }
      }

      setSearchResult(result);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto pt-8 px-4"
      >
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by ID (User/Request)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
          {/* Add Reset Button */}
          {(searchQuery || searchResult) && (
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="hover:bg-destructive/10"
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <SearchResultCard result={searchResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Graph Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-[calc(100vh-200px)] bg-card rounded-lg shadow-xl"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          }}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </motion.div>
    </div>
  );
}