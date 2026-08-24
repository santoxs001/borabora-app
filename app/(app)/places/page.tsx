'use client';

import * as React from 'react';
import { useApp } from '@/store/app-store';
import { MOCK_PLACES } from '@/data/places';
import { PageHeader } from '@/components/app/AppHeader';
import { PhotoSurface } from '@/components/ui/Photo';
import { Badge } from '@/components/ui/Badge';
import { Segmented } from '@/components/ui/Tabs';
import { Icon } from '@/components/ui/Icon';
import { pluralise } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { PlaceKind } from '@/types';

type Filter = 'tonight' | 'all' | 'events';

/**
 * HEY Places.
 *
 * The city, aggregated. There is deliberately no way to see *who* is at
 * a place — no check-ins, no "3 friends here", no live headcount tied to
 * identity. Only interest counts, which are floored so a small number
 * can't single anyone out.
 */
export default function PlacesPage() {
  const { state } = useApp();
  const [filter, setFilter] = React.useState<Filter>('tonight');
  const city = state.me?.city ?? 'São Paulo';

  const places = React.useMemo(() => {
    const list = MOCK_PLACES.filter((p) => p.city === city || true);
    if (filter === 'tonight') return list.filter((p) => p.popularTonight);
    if (filter === 'events') return list.filter((p) => p.kind === 'event' || p.kind === 'party');
    return list;
  }, [filter, city]);

  return (
    <main id="main">
      <PageHeader title="hey places" subtitle={`what's on in ${city}`} />

      <div className="mx-auto max-w-lg px-4">
        <Segmented
          value={filter}
          onChange={setFilter}
          items={[
            { key: 'tonight', label: 'tonight' },
            { key: 'events', label: 'events' },
            { key: 'all', label: 'everything' },
          ]}
        />

        <ul className="space-y-3 py-5">
          {places.map((place) => (
            <li key={place.id}>
              <article className="overflow-hidden rounded-lg border border-white/[0.07] bg-graphite/25">
                <PhotoSurface seed={place.seed} initial={place.name.charAt(0)} className="relative h-32 w-full">
                  <div className="absolute inset-0 photo-scrim" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl display-tight">{place.name}</p>
                      <p className="truncate text-2xs uppercase tracking-[0.1em] text-bone-faint">
                        {kindLabel(place.kind)} · {place.neighbourhood}
                      </p>
                    </div>
                    {place.popularTonight && <Badge tone="uv">popular tonight</Badge>}
                  </div>
                </PhotoSurface>

                <div className="p-4">
                  <p className="text-[15px] text-bone-dim text-pretty">{place.blurb}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-bone-faint">
                    <span className="flex items-center gap-1.5">
                      <Icon name="profile" size={14} className="text-ultraviolet" />
                      {pluralise(floorCount(place.interestedCount), 'person', 'people')} interested
                    </span>
                    {place.when && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="sparkle" size={14} />
                        {place.when}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <p className={cn('flex items-start gap-2 pb-8 text-sm text-bone-faint text-pretty')}>
          <Icon name="shield" size={15} className="mt-0.5 shrink-0 text-ultraviolet" />
          places only ever show totals. HEY never shows who is at a venue, and never puts a person
          on a map.
        </p>
      </div>
    </main>
  );
}

/** Counts below the floor are suppressed so a total can't identify anyone. */
function floorCount(n: number): number {
  return n < 20 ? 20 : Math.round(n / 5) * 5;
}

function kindLabel(kind: PlaceKind): string {
  return { bar: 'bar', club: 'club', cafe: 'café', event: 'event', party: 'party' }[kind];
}
