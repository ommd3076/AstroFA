import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Crosshair, Expand, Minus, Plus, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { getHorizontalCoordinates } from '../astronomy/coordinates';
import { Button } from '../components/ui/board/base/buttons/button';
import { ButtonGroup, ButtonGroupItem } from '../components/ui/board/base/buttons/button-group';
import { Select, SelectItem } from '../components/ui/board/base/select/select';
import { Switch } from '../components/ui/board/base/switch/switch';
import Scrubber from '../components/ui/smooth/Scrubber';
import { CONSTELLATION_BY_ID, REFERENCE_PATTERNS, STAR_BY_ID } from '../data/astroData';
import { SkyCanvas } from '../sky/SkyCanvas';
import { useAstroStore } from '../stores/useAstroStore';

const utc = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

export function FieldSky({ hunt = false }: { hunt?: boolean }) {
  const store = useAstroStore();
  const [fov, setFov] = useState(60);
  const [deepSky, setDeepSky] = useState(true);
  const [panel, setPanel] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const star = store.selectedStarId === null ? undefined : STAR_BY_ID.get(store.selectedStarId);
  const target = store.focusedConstellationId ? CONSTELLATION_BY_ID.get(store.focusedConstellationId) : undefined;
  const coords = star ? { ra: star.ra, dec: star.dec } : target ? { ra: target.raCenter, dec: target.decCenter } : undefined;
  const horizontal = coords ? getHorizontalCoordinates(coords.ra, coords.dec, store.observer, store.observationDate) : undefined;
  const patterns = !hunt && target ? REFERENCE_PATTERNS.filter(pattern => pattern.constellationId === target.id) : [];
  const recognition = store.backendRecognition;
  const traceStatus = recognition?.state === 'pending' ? 'Checking the trace…'
    : recognition?.state === 'unavailable' ? 'The recognition engine is unavailable. Local geometry is still available.'
      : recognition?.state === 'not-requested' && recognition.reason === 'educational-demo' ? 'Reference trace loaded.'
        : recognition?.state === 'available'
          ? recognition.result.status === 'FULL_MATCH'
            ? (hunt && recognition.result.bestMatch?.constellationId !== store.huntTarget?.constellationId
              ? 'A different constellation was matched.' : 'Verified by the recognition engine.')
            : recognition.result.status === 'AMBIGUOUS' ? 'Several figures fit. Add another star.' : 'No match yet. Check the order of your stars.'
          : 'Select stars in order to build a trace.';

  useEffect(() => {
    const syncZoom = (event: Event) => setFov((event as CustomEvent<{ fov: number }>).detail.fov);
    const syncFullScreen = () => setFullScreen(document.fullscreenElement === stage.current);
    window.addEventListener('sky-zoom-change', syncZoom);
    document.addEventListener('fullscreenchange', syncFullScreen);
    return () => {
      window.removeEventListener('sky-zoom-change', syncZoom);
      document.removeEventListener('fullscreenchange', syncFullScreen);
    };
  }, []);

  function zoom(value: number) {
    window.dispatchEvent(new CustomEvent('sky-zoom', { detail: { factor: value / fov } }));
  }

  function toggleFullscreen() {
    const operation = document.fullscreenElement ? document.exitFullscreen() : stage.current?.requestFullscreen();
    void operation?.catch(() => undefined);
  }

  return (
    <>
      <header className="field-page-heading field-instrument-heading">
        <div>
          <h1>{hunt ? 'Constellation hunt' : 'Planetarium'}</h1>
          <p>{hunt ? 'Trace the target figure to verify it with the recognition engine.' : 'Drag to look around, or search for a specific star or constellation.'}</p>
        </div>
        <div className="field-actions">
          {!hunt && <Button variant={store.isTraceMode ? 'primary' : 'secondary'} leadingIcon={Crosshair} aria-pressed={store.isTraceMode} onClick={() => {
            if (store.isTraceMode) useAstroStore.setState({ isTraceMode: false });
            else store.setIsTraceMode(true);
          }}>{store.isTraceMode ? 'Finish tracing' : 'Trace a figure'}</Button>}
          <Button variant="secondary" aria-expanded={panel} onClick={() => setPanel(value => !value)}>{panel ? 'Hide controls' : 'Show controls'}</Button>
        </div>
      </header>
      <div className="field-sky-layout" data-controls={panel ? 'open' : 'closed'}>
        <section className="field-observatory" aria-label="Live sky">
          <div className="field-sky-stage" ref={stage}>
            <SkyCanvas showDeepSky={deepSky} />
            <Button className="field-fullscreen" aria-label={fullScreen ? 'Exit fullscreen' : 'Fullscreen sky'} variant="secondary" iconOnly leadingIcon={Expand} onClick={toggleFullscreen} />
          </div>
          <div className="field-sky-clock">
            <div><span className="field-label">Observation time</span><strong>{utc.format(store.observationDate)} UTC</strong></div>
            <ButtonGroup size="small" aria-label="Timeline">
              <ButtonGroupItem onClick={() => store.stepTime(-1)}>−1 hour</ButtonGroupItem>
              <ButtonGroupItem selected={store.isTimePlaying} aria-pressed={store.isTimePlaying} onClick={() => store.setIsTimePlaying(!store.isTimePlaying)}>{store.isTimePlaying ? 'Pause' : 'Play'}</ButtonGroupItem>
              <ButtonGroupItem onClick={() => store.stepTime(1)}>+1 hour</ButtonGroupItem>
              <ButtonGroupItem onClick={() => store.setObservationDate(new Date())}>Now</ButtonGroupItem>
            </ButtonGroup>
            <Select aria-label="Playback speed" value={String(store.timeSpeedMultiplier)} onChange={key => store.setTimeSpeedMultiplier(Number(key))}>
              {[1, 60, 600, 3600].map(speed => <SelectItem id={String(speed)} key={speed}>{speed}×</SelectItem>)}
            </Select>
          </div>
        </section>
        <AnimatePresence initial={false}>
          {panel && (
            <motion.aside className="field-controls" initial={reduced ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? { opacity: 1 } : { opacity: 0, x: 8 }} transition={{ duration: reduced ? 0 : .16 }} aria-label="Planetarium controls">
              {hunt && <section className="field-note">
                <span className="field-label">Target</span><h2>{store.huntTarget?.name ?? 'Assigning a target'}</h2>
                <p>{store.huntTarget?.description}</p>
                <div className="field-actions">
                  <Button size="small" variant="secondary" disabled={store.huntHintLevel >= 3} onClick={() => store.setHuntHintLevel(store.huntHintLevel + 1)}>Show hint</Button>
                  <Button size="small" variant="secondary" onClick={() => store.startNewHunt()}>New target</Button>
                </div>
              </section>}
              {!hunt && <section className="field-note">
                <span className="field-label">{star ? 'Selected star' : 'Selected constellation'}</span>
                <h2>{star?.proper || star?.name || target?.name || 'Choose a target'}</h2>
                {horizontal ? (
                  <dl className="field-coordinates-readout">
                    <div><dt>Altitude</dt><dd>{horizontal.altitude.toFixed(1)}°</dd></div>
                    <div><dt>Azimuth</dt><dd>{horizontal.azimuth.toFixed(1)}°</dd></div>
                    {star && <div><dt>Magnitude</dt><dd>{star.mag.toFixed(2)}</dd></div>}
                  </dl>
                ) : <p>Choose a star on the chart, or use Search.</p>}
              </section>}
              {store.isTraceMode && <section className="field-note">
                <span className="field-label">Trace</span><h2>{store.tracedPoints.length} points</h2>
                <p aria-live="polite">{traceStatus}</p>
                <div className="field-actions">
                  <Button variant="secondary" size="small" leadingIcon={RotateCcw} disabled={!store.tracedPoints.length} onClick={store.undoLastTracePoint}>Undo</Button>
                  <Button variant="secondary" size="small" disabled={!store.tracedPoints.length} onClick={store.clearTrace}>Clear</Button>
                  <Button size="small" trailingIcon={ArrowUpRight} disabled={store.tracedPoints.length < 3} onClick={() => store.setActiveView('results')}>Results</Button>
                </div>
                <div className="field-actions">
                  <Button variant="secondary" size="small" disabled={store.tracedPoints.length < 2} onClick={() => store.setActiveView('patterns')}>Inspect geometry</Button>
                  {!hunt && <Switch size="sm" isSelected={store.showTraceHints} onChange={store.setShowTraceHints}>Show trace hints</Switch>}
                </div>
                {patterns.length > 0 && <Select aria-label="Load a reference trace" placeholder="Load reference trace" onChange={key => {
                  const pattern = patterns.find(item => item.id === key);
                  if (pattern) store.loadPresetTrace(pattern);
                }}>
                  {patterns.map(pattern => <SelectItem key={pattern.id} id={pattern.id}>{pattern.name}</SelectItem>)}
                </Select>}
              </section>}
              <section className="field-note field-optics">
                <h2>Optics</h2>
                <div className="field-optics-row">
                  <Button size="small" variant="secondary" iconOnly leadingIcon={Minus} aria-label="Zoom out" disabled={fov >= 85} onClick={() => zoom(Math.min(85, fov * 1.25))} />
                  <Scrubber min={4} max={85} value={Math.round(fov)} step={1} decimals={0} ticks={9} label="Field of view" onValueChange={zoom} />
                  <Button size="small" variant="secondary" iconOnly leadingIcon={Plus} aria-label="Zoom in" disabled={fov <= 4} onClick={() => zoom(Math.max(4, fov * .8))} />
                </div>
                <output className="field-range-reading" aria-live="polite">Field of view {fov.toFixed(1)}°</output>
                <div className="field-layer-list">
                  {(!hunt || store.huntHintLevel >= 3) && <Switch size="sm" isSelected={store.showConstellationLines} onChange={store.setShowConstellationLines}>Constellation lines</Switch>}
                  <Switch size="sm" isSelected={store.showConstellationLabels} onChange={store.setShowConstellationLabels}>Labels</Switch>
                  <Switch size="sm" isSelected={deepSky} onChange={setDeepSky}>Milky Way</Switch>
                  <Switch size="sm" isSelected={store.showHorizon} onChange={store.setShowHorizon}>Horizon</Switch>
                  <Switch size="sm" isSelected={store.showEquatorialGrid} onChange={store.setShowEquatorialGrid}>Equatorial grid</Switch>
                </div>
              </section>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
