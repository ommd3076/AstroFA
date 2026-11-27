import { ArrowDownRight, ArrowUpRight, Crosshair, Telescope } from 'lucide-react';
import { Button } from '../components/ui/board/base/buttons/button';
import { CONSTELLATIONS, CONSTELLATION_BY_ID, REFERENCE_PATTERNS, STARS } from '../data/astroData';
import { useAstroStore } from '../stores/useAstroStore';
import { ConstellationPlate } from './Plate';

const featured = CONSTELLATION_BY_ID.get('Ori') ?? CONSTELLATIONS[0];

export function FieldHome({ onObserve }: { onObserve: () => void }) {
  const observer = useAstroStore(state => state.observer);
  const navigate = useAstroStore(state => state.setActiveView);
  const focus = useAstroStore(state => state.focusOnConstellation);

  return (
    <>
      <section className="field-hero">
        <div className="field-intro">
          <div className="field-location"><span /> {observer.name.split(',')[0]}</div>
          <h1>Night sky<br />atlas.</h1>
          <p>Find what’s above your horizon, chart a constellation, and see how Costellar recognizes the shape you trace.</p>
          <div className="field-actions">
            <Button onClick={onObserve} trailingIcon={ArrowUpRight}>Open planetarium</Button>
            <Button variant="secondary" onClick={() => navigate('tonight')}>Plan tonight</Button>
          </div>
          <dl className="field-metrics">
            <div><dt>Stars</dt><dd>{STARS.length.toLocaleString('en-US')}</dd></div>
            <div><dt>IAU constellations</dt><dd>{CONSTELLATIONS.length}</dd></div>
            <div><dt>Reference patterns</dt><dd>{REFERENCE_PATTERNS.length}</dd></div>
          </dl>
        </div>
        <figure className="field-hero-figure">
          <ConstellationPlate target={featured} detailed />
          <figcaption>
            <div><strong>{featured.name}</strong><span>{featured.englishName}</span></div>
            <Button variant="secondary" size="small" trailingIcon={ArrowUpRight} onClick={() => focus(featured.id)}>Find in sky</Button>
          </figcaption>
        </figure>
      </section>
      <section className="field-paths" aria-label="Explore Costellar">
        <button onClick={() => navigate('constellations')}>
          <Telescope aria-hidden /><span><strong>Constellation catalog</strong><small>Compare all 88 regions and their brightest stars.</small></span><ArrowDownRight aria-hidden />
        </button>
        <button onClick={() => {
          useAstroStore.getState().setIsTraceMode(true);
          navigate('sky');
        }}>
          <Crosshair aria-hidden /><span><strong>Trace a constellation</strong><small>Connect stars, then inspect the match and its evidence.</small></span><ArrowDownRight aria-hidden />
        </button>
      </section>
    </>
  );
}
