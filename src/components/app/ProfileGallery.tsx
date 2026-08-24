'use client';

import * as React from 'react';
import type { Photo } from '@/types';
import { cn } from '@/lib/cn';
import { PhotoSurface } from '@/components/ui/Photo';

/**
 * Swipeable gallery with segment indicators.
 * Uses native scroll-snap: momentum, accessibility and keyboard paging
 * all come for free, and it degrades to a plain scroller everywhere.
 */
export function ProfileGallery({
  photos,
  alt,
  className,
  children,
}: {
  photos: Photo[];
  alt: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scroller}
        onScroll={onScroll}
        role="region"
        aria-label={`${alt} — photo gallery`}
        tabIndex={0}
        className="no-scrollbar snap-x-mandatory flex h-full w-full overflow-x-auto"
      >
        {photos.map((photo, i) => (
          <PhotoSurface
            key={photo.id}
            seed={photo.seed}
            src={photo.url}
            alt={`${alt}, photo ${i + 1} of ${photos.length}`}
            priority={i === 0}
            initial={alt.charAt(0)}
            className="h-full w-full shrink-0 snap-center"
          />
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex gap-1.5 p-3">
            {photos.map((p, i) => (
              <span
                key={p.id}
                className={cn(
                  'h-0.5 flex-1 rounded-full transition-colors duration-300',
                  i === index ? 'bg-bone' : 'bg-bone/25',
                )}
              />
            ))}
          </div>
          {/* Tap zones — the gesture people already expect from stories. */}
          <button
            type="button"
            aria-label="previous photo"
            onClick={() => goTo(Math.max(0, index - 1))}
            className="absolute inset-y-0 left-0 w-1/3"
          />
          <button
            type="button"
            aria-label="next photo"
            onClick={() => goTo(Math.min(photos.length - 1, index + 1))}
            className="absolute inset-y-0 right-0 w-1/3"
          />
        </>
      )}

      {children}
    </div>
  );
}
