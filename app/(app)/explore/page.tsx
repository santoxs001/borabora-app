'use client';

import * as React from 'react';
import { useApp } from '@/store/app-store';
import { EXPLORE_CATEGORIES } from '@/data/interests';
import { profilesForCategory } from '@/lib/discovery';
import { cn } from '@/lib/cn';

import { PageHeader } from '@/components/app/AppHeader';
import { ProfileGrid } from '@/components/app/ProfileTile';
import { ProfileTile } from '@/components/app/ProfileTile';
import { SearchField } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';

/**
 * Explore — discovery by interest rather than by proximity.
 * Category rails when idle; a flat result grid once you search.
 */
export default function ExplorePage() {
  const { state, visibleProfiles } = useApp();
  const me = state.me!;
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<string | null>(null);

  const searching = query.trim().length > 0;

  const searchResults = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return visibleProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.interests.some((i) => i.includes(q)) ||
        p.city.toLowerCase().includes(q),
    );
  }, [query, visibleProfiles]);

  const rails = React.useMemo(
    () =>
      EXPLORE_CATEGORIES.map((c) => ({
        ...c,
        profiles: profilesForCategory(visibleProfiles, c.key),
      })).filter((c) => c.profiles.length > 0),
    [visibleProfiles],
  );

  const activeCategory = rails.find((r) => r.key === active);

  return (
    <main id="main">
      <PageHeader
        title="explore"
        subtitle="find people by what they're into"
        right={
          <Link
            href="/places"
            className="flex items-center gap-1.5 rounded-full border border-white/[0.1] px-3 py-1.5 text-2xs uppercase tracking-[0.1em] text-bone-dim"
          >
            <Icon name="pin" size={13} /> places
          </Link>
        }
      />

      <div className="mx-auto max-w-lg px-4">
        <SearchField
          value={query}
          onValueChange={setQuery}
          placeholder="name, interest, or a word from a bio"
        />

        {searching ? (
          <div className="py-5">
            {searchResults.length ? (
              <>
                <p className="eyebrow mb-3">
                  {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
                </p>
                <ProfileGrid profiles={searchResults} precision={me.privacy.distancePrecision} />
              </>
            ) : (
              <EmptyState
                icon="search"
                title="nothing matched."
                body="try a broader word — an interest, or a city."
              />
            )}
          </div>
        ) : activeCategory ? (
          <div className="py-5">
            <button
              type="button"
              onClick={() => setActive(null)}
              className="mb-4 flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone"
            >
              <Icon name="chevron-left" size={16} /> all categories
            </button>
            <h2 className="mb-3 font-display text-2xl display-tight lowercase">
              {activeCategory.emoji} {activeCategory.label}
            </h2>
            <ProfileGrid
              profiles={activeCategory.profiles}
              precision={me.privacy.distancePrecision}
            />
          </div>
        ) : (
          <>
            {/* Category chips */}
            <ul className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
              {EXPLORE_CATEGORIES.map((c) => (
                <li key={c.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActive(c.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04]',
                      'px-3.5 py-2 text-[13px] lowercase text-bone-dim transition-colors',
                      'hover:border-white/25 hover:text-bone',
                    )}
                  >
                    <span aria-hidden>{c.emoji}</span>
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Rails */}
            <div className="space-y-8 py-7">
              {rails.map((rail) => (
                <section key={rail.key} aria-labelledby={`rail-${rail.key}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2
                      id={`rail-${rail.key}`}
                      className="font-display text-xl display-tight lowercase"
                    >
                      <span aria-hidden className="mr-1.5">{rail.emoji}</span>
                      {rail.label}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActive(rail.key)}
                      className="text-2xs uppercase tracking-[0.1em] text-bone-faint hover:text-bone"
                    >
                      see all {rail.profiles.length}
                    </button>
                  </div>
                  <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
                    {rail.profiles.slice(0, 8).map((p) => (
                      <li key={p.id} className="w-[132px] shrink-0">
                        <ProfileTile profile={p} precision={me.privacy.distancePrecision} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
