import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Đang tải trang...' }) => {
  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Loader2 className="w-5 h-5 text-primary absolute animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-medium text-content-muted">{message}</p>
    </div>
  );
};
