import { cn } from '@/lib/utils';

export const Skeleton = ({ className }) => <div className={cn('animate-pulse rounded-lg bg-subtle', className)} />;
