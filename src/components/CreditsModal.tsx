import React from 'react';
import starsData from '../data/stars.json';
import { useAstroStore } from '../stores/useAstroStore';
import { Button } from './ui/board/base/buttons/button';
import { PageHeader } from './PageHeader';

interface SourceRow {
  name: string;
  license: string;
  description: string;
  href: string;
  linkLabel: string;
  spec: string;
  frame: string;
}

const DATA_SOURCES: SourceRow[] = [
  {
    name: 'HYG Star Database (v3.8)',
    license: 'CC BY-SA 4.0',
    description:
      'Combined Hipparcos, Yale Bright Star Catalogue (BSC5), and Henry Draper catalogs curated by David Nash / Astronexus.',
    href: 'https://codeberg.org/astronexus/hyg',
    linkLabel: 'Astronexus HYG ↗',
    spec: `${starsData.length.toLocaleString()} HYG catalog stars; magnitude does not guarantee visibility`,
    frame: 'J2000 equatorial RA / Dec',
  },
  {
    name: 'Constellation Lines',
    license: 'CC BY 4.0',
    description:
      'Connecting-line asterism figures across all 88 official constellations, keyed to Yale Bright Star (HR) identifiers.',
    href: 'https://github.com/MarcvdSluys/ConstellationLines',
    linkLabel: 'ConstellationLines ↗',
    spec: '88 IAU constellations',
    frame: 'Yale HR keying',
  },
  {
    name: 'Astronomy Engine',
    license: 'MIT',
    description:
      'Ephemerides, precession, sidereal time, lunar illumination, and horizon rise/set calculations by Don Cross.',
    href: 'https://github.com/cosinekitty/astronomy',
    linkLabel: 'cosinekitty/astronomy ↗',
    spec: 'EQJ → EQD → Horizontal',
    frame: 'Real-time topocentric',
  },
  {
    name: 'Deep Star Maps 2020',
    license: 'Public Domain',
    description:
      'Equatorial Milky Way sky sphere rendered beneath the starfield. Credits: NASA/GSFC Scientific Visualization Studio and ESA/Gaia/DPAC.',
    href: 'https://svs.gsfc.nasa.gov/4851/',
    linkLabel: 'NASA SVS #4851 ↗',
    spec: 'Local asset · milkyway_2020.jpg',
    frame: 'J2000 equatorial plate',
  },
  {
    name: 'Open-Meteo Weather API',
    license: 'CC BY 4.0',
    description:
      'Model forecast output for sunrise/sunset, hourly cloud cover, wind, and precipitation in Sky Tonight observing conditions.',
    href: 'https://open-meteo.com/',
    linkLabel: 'Open-Meteo.com ↗',
    spec: 'Hourly & solar ephemeris',
    frame: 'Rounded 0.01° lookup',
  },
];

export const CreditsModal: React.FC = () => {
  const setActiveView = useAstroStore(state => state.setActiveView);

  return (
    <section
      className="field-page mx-auto flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto bg-[var(--bg-shell)] p-4 sm:p-6 font-sans text-[var(--ink-primary)]"
      aria-label="Credits and data sources"
    >
      <PageHeader
        className="field-page-heading"
        eyebrow="Attribution · provenance · privacy"
        title="Credits & sources"
        description="Costellar runs on open astronomical catalogs, deterministic finite automata, and transparent geometry verification."
        actions={
          <Button
            variant="secondary"
            size="small"
            onClick={() => setActiveView('sky')}
            className="text-xs font-semibold"
          >
            Return to Sky Planetarium ↗
          </Button>
        }
      />

      {/* Grouped Source Rows */}
      <div className="field-source-ledger field-note atlas-surface overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 border-b border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-muted)] sm:grid">
          <span>Source / license / purpose</span><span>Reference / coordinate frame</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
        {DATA_SOURCES.map(source => (
          <div
            key={source.name}
            className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] sm:items-center sm:gap-6"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
                  {source.name}
                </h2>
                <span className="rounded-[4px] border border-[var(--signal-surface)] bg-[var(--bg-pill-active)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--signal-mid)]">
                  {source.license}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--ink-secondary)]">
                {source.description}
              </p>
            </div>

            <div className="flex flex-col gap-1 border-t border-[var(--border-subtle)] pt-2.5 font-mono text-[11px] text-[var(--ink-muted)] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <div>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[var(--signal-mid)] underline underline-offset-2 hover:text-[var(--ink-primary)]"
                >
                  {source.linkLabel}
                </a>
              </div>
              <div className="tabular-nums text-[var(--ink-primary)]">{source.spec}</div>
              <div>{source.frame}</div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Methodological & Privacy Notes */}
      <div className="field-notes grid grid-cols-1 gap-6 border-t border-[var(--border-subtle)] pt-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
            IAU constellations vs. traditional asterisms
          </h2>
          <p className="text-xs leading-relaxed text-[var(--ink-secondary)]">
            The <strong className="font-semibold text-[var(--ink-primary)]">International Astronomical Union (IAU)</strong> defines constellations as 88 contiguous celestial regions adopted in 1928. Familiar stick figures (such as the Big Dipper or Orion&apos;s hourglass) are cultural <em>asterisms</em>. Costellar indexes IAU catalog metadata alongside formal asterism chains.
          </p>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
            Data handling &amp; privacy
          </h2>
          <p className="text-xs leading-relaxed text-[var(--ink-secondary)]">
            Sky photographs in Image Lab are decoded locally in your browser and never uploaded. Pattern recognition submits only extracted coordinate sequences to Costellar, while Observing Conditions forward your UTC date and coordinates rounded to 0.01° to Open-Meteo for model forecasts.
          </p>
        </div>
      </div>
    </section>
  );
};
