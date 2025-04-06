import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';

interface UserNodeData {
  name: string;
  balance: number;
}

function UserNode({ data }: NodeProps<UserNodeData>) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="px-4 py-2 shadow-lg rounded-lg bg-secondary text-secondary-foreground"
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="text-center">
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm">₹{data.balance.toLocaleString('en-IN')}</p>
      </div>
    </motion.div>
  );
}

export default memo(UserNode);