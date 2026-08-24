'use client';

import * as React from 'react';
import Link from 'next/link';
import { useApp } from '@/store/app-store';
import { passesFilters } from '@/lib/discovery';
import { PageHeader } from '@/components/app/AppHeader';
import { ProfileGrid } from '@/components/app/ProfileTile';
import { Segmented } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { FilterSheet } from '@/components/app/FilterSheet';
import { IconButton } from '@/components/ui/IconButton';
import { useRouter } from 'next/navigation';

type Sort = 'closest' | 'online' | 'new';

const PAGE = 12;

/**
 * close to you.
 *
 * A grid, not a map. Distance is a coarsened number and nothing on this
 * screen can be resolved back to a position.
 */
export default function NearbyPage() {
  const router = useRouter();
  const { state, dispatch, visibleProfiles } = useApp();
  const [sort, setSort] = React.useState<Sort>('closest');
  const [limit, setLimit] = React.useState(PAGE);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const sentinel = React.useRef<HTMLDivElement>(null);

  const me = state.me!;
  const precision = me.privacy.distancePrecision;

  const results = React.useMemo(() => {
    const list = visibleProfiles.filter((p) => passesFilters(p, state.filters));
    switch (sort) {
      case 'online':
        return list.sort((a, b) => rankState(b) - rankState(a) || (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9));
      case 'new':
        return list.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
      default:
        return list.sort((a, b) => (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9));
    }
  }, [visibleProfiles, state.filters, sort]);

  // Infinite scroll — cheap, and it keeps the first paint small.
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setLimit((l) => Math.min(l + PAGE, results.length)),
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [results.length]);

  React.useEffect(() => setLimit(PAGE), [sort, state.filters]);

  return (
    <main id="main">
      <PageHeader
        title="close to you"
        back={false}
        subtitle={`${results.length} people · ${labelFor(precision)}`}
        right={
          <>
            <IconButton icon="pin" label="hey places" onClick={() => router.push('/places')} />
            <IconButton icon="sliders" label="filters" onClick={() => setFiltersOpen(true)} />
          </>
        }
      />

      <div className="mx-auto max-w-lg px-4">
        <Segmented
          className="mt-1"
          value={sort}
          onChange={setSort}
          items={[
            { key: 'closest', label: 'closest' },
            { key: 'online', label: 'online' },
            { key: 'new', label: 'new here' },
          ]}
        />

        {precision === 'hidden' && (
          <p className="mt-4 flex items-start gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] p-3 text-sm text-bone-faint">
            <Icon name="eye-off" size={15} className="mt-0.5 shrink-0 text-ultraviolet" />
            <span>
              your distance is hidden, so theirs is too.{' '}
              <Link href="/settings/privacy" className="text-ultraviolet-bright underline underline-offset-2">
                change
              </Link>
            </span>
          </p>
        )}

        <div className="py-4">
          {results.length ? (
            <>
              <ProfileGrid profiles={results.slice(0, limit)} precision={precision} />
              <div ref={sentinel} className="h-px" />
              {limit < results.length && (
                <p className="py-6 text-center text-2xs text-bone-faint">loading more…</p>
              )}
            </>
          ) : (
            <EmptyState
              icon="nearby"
              title="quiet around here."
              body="nobody matches your filters right now. try widening the distance."
              action={<Button onClick={() => setFiltersOpen(true)}>open filters</Button>}
            />
          )}
        </div>
      </div>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={state.filters}
        onApply={(filters) => dispatch({ type: 'setFilters', filters })}
        isPlus={me.plus.active}
        onWantPlus={() => router.push('/plus')}
      />
    </main>
  );
}

function rankState(p: { state: string }): number {
  return p.state === 'online' ? 2 : p.state === 'recently_active' ? 1 : 0;
}

function labelFor(precision: string): string {
  return precision === 'exact'
    ? 'exact distance'
    : precision === 'approximate'
      ? 'approximate distance'
      : 'distance hidden';
}
