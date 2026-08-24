import { cn } from '@/lib/cn';

/** Onboarding progress. Segmented so the end is always visible. */
export function StepProgress({
  step,
  total,
  className,
}: {
  step: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`step ${step} of ${total}`}
      className={cn('flex gap-1.5', className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-all duration-400 ease-hey',
            i < step ? 'uv-gradient' : 'bg-white/[0.1]',
          )}
        />
      ))}
    </div>
  );
}
