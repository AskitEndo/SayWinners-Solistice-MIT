import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';

interface RootNodeData {
  label: string;
  amount: number;
}

function RootNode({ data }: NodeProps<RootNodeData>) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="px-6 py-4 shadow-lg rounded-lg bg-primary text-primary-foreground"
    >
      <Handle type="source" position={Position.Bottom} />
      <div className="text-center">
        <p className="font-semibold text-lg">{data.label}</p>
        <p className="text-sm">₹{data.amount.toLocaleString('en-IN')}</p>
      </div>
    </motion.div>
  );
}

export default memo(RootNode);