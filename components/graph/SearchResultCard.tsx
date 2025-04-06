import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SearchResultCardProps {
  result: {
    type: 'user' | 'transaction' | 'request' | 'donation';
    data: any;
  };
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-lg capitalize">
          {result.type} Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <pre className="bg-muted/30 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}