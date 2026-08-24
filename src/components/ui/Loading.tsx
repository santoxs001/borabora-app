import { cn } from '@/lib/cn';
import { HeyDot } from './Logo';

/** The dot, three times. Used wherever a spinner would normally go. */
export function Loading({
  label = 'loading',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center gap-1.5 py-8', className)}
    >
      {[0, 160, 320].map((d) => (
        <HeyDot key={d} size={8} style={{ animationDelay: `${d}ms` }} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function FullScreenLoading() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-obsidian">
      <Loading />
    </div>
  );
}
