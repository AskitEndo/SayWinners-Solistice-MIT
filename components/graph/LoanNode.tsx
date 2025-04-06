import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';

interface LoanNodeData {
  amount: number;
  status: string;
}

function LoanNode({ data }: NodeProps<LoanNodeData>) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="px-3 py-2 shadow-lg rounded-lg bg-muted"
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-center">
        <p className="text-sm font-medium">₹{data.amount.toLocaleString('en-IN')}</p>
        <p className="text-xs text-muted-foreground">{data.status}</p>
      </div>
    </motion.div>
  );
}

export default memo(LoanNode);