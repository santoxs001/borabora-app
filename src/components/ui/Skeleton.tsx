import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-sm', className)} />;
}

export function ProfileCardSkeleton() {
  return (
    <div className="rounded-card overflow-hidden">
      <Skeleton className="aspect-[3/4] rounded-card" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-2/5 rounded-full" />
        <Skeleton className="h-3 w-1/4 rounded-full" />
      </div>
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3 rounded-full" />
        <Skeleton className="h-3 w-2/3 rounded-full" />
      </div>
    </div>
  );
}
