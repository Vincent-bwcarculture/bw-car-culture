import React, { useEffect, useRef, useState } from 'react';

export const HERO_COLOURS = [
  { name: 'Atlantic Blue', hex: '#164b98' },
  { name: 'Pearl White', hex: '#e9e6df' },
  { name: 'Crimson Red', hex: '#9d172d' },
  { name: 'Graphite', hex: '#353940' },
];
export const HERO_WHEELS = [
  { name: 'Satin Graphite', hex: '#434851' },
  { name: 'Bright Silver', hex: '#b5bcc3' },
  { name: 'Warm Bronze', hex: '#9c7649' },
];
export const HERO_INTERIORS = [
  { name: 'Ocean Blue', hex: '#164b98' },
  { name: 'Cognac', hex: '#a56435' },
  { name: 'Ivory', hex: '#d8cbb5' },
];

export const HERO_JOURNEY = [
  { title: 'Select your vehicle', detail: 'Discover the right vehicle for you, here at home or across the world.' },
  { title: 'Make it yours', detail: 'Explore colours and finishing touches. A vehicle that feels distinctly yours.' },
  { title: 'Await your delivery', detail: 'From purchase to arrival, we take care of the details. You enjoy the anticipation.' },
  { title: 'Expect exceptional care', detail: 'Thoughtful attention and world-class service, at every step of your journey.' },
  { title: 'Enjoy the road ahead', detail: 'Ongoing ownership support. More peace of mind, more time to enjoy your vehicle.' },
];

const HeroJourney = ({ interactionId = 0, modelReady, onColourChange, onWheelChange, onInteriorChange, onPreviewPartChange, onPlayingChange }) => {
  const [step, setStep] = useState(0);
  const [colour, setColour] = useState(0);
  const [wheel, setWheel] = useState(0);
  const [interior, setInterior] = useState(0);
  const [part, setPart] = useState('paint');
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const ref = useRef(null);
  useEffect(() => { if (interactionId) setPaused(true); }, [interactionId]);
  const playing = modelReady && !paused && !reducedMotion && inView && pageVisible;

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference?.matches ?? true);
    update();
    preference?.addEventListener?.('change', update);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 }
    );
    if (observer) observer.observe(ref.current);
    else setInView(true);
    return () => {
      preference?.removeEventListener?.('change', update);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    onPlayingChange(playing);
    return () => onPlayingChange(false);
  }, [playing, onPlayingChange]);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setStep(current => (current + 1) % HERO_JOURNEY.length), step === 1 ? 14400 : 6000);
    return () => clearTimeout(timer);
  }, [step, playing]);

  useEffect(() => {
    if (!playing || step !== 1) return;
    const wheels = setTimeout(() => setPart('wheels'), 4800);
    const trim = setTimeout(() => setPart('interior'), 9600);
    return () => { clearTimeout(wheels); clearTimeout(trim); };
  }, [step, playing]);

  useEffect(() => { if (step === 1) setPart('paint'); }, [step]);

  useEffect(() => {
    if (!playing || step !== 1) return;
    const timer = setInterval(() => {
      if (part === 'paint') setColour(current => (current + 1) % HERO_COLOURS.length);
      if (part === 'wheels') setWheel(current => (current + 1) % HERO_WHEELS.length);
      if (part === 'interior') setInterior(current => (current + 1) % HERO_INTERIORS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [step, playing, part]);

  useEffect(() => { onColourChange(HERO_COLOURS[colour].hex); }, [colour, onColourChange]);
  useEffect(() => { onWheelChange?.(HERO_WHEELS[wheel].hex); }, [wheel, onWheelChange]);
  useEffect(() => { onInteriorChange?.(HERO_INTERIORS[interior].hex); }, [interior, onInteriorChange]);
  useEffect(() => {
    onPreviewPartChange?.(modelReady && step === 1 ? part : null);
    return () => onPreviewPartChange?.(null);
  }, [modelReady, step, part, onPreviewPartChange]);

  const options = part === 'paint' ? HERO_COLOURS : part === 'wheels' ? HERO_WHEELS : HERO_INTERIORS;
  const selection = part === 'paint' ? colour : part === 'wheels' ? wheel : interior;
  const selectOption = part === 'paint' ? setColour : part === 'wheels' ? setWheel : setInterior;

  return (
    <aside className="bcc-hero-journey" ref={ref} aria-label="Your ownership journey">
      <div className="bcc-journey-heading">
        <span className="bcc-journey-eyebrow">Consider every detail taken care of</span>
        <h2>Your vehicle purchase and ownership journey, <em>our commitment.</em></h2>
      </div>
      <ol className="bcc-journey-steps">
        {HERO_JOURNEY.map((item, index) => (
          <li key={item.title} className={step === index ? 'is-current' : ''}>
            <button type="button" aria-expanded={step === index} aria-controls={`hero-journey-detail-${index}`}
              onClick={() => { setStep(index); setPaused(true); }}>
              <span className="bcc-journey-number">{String(index + 1).padStart(2, '0')}</span>
              <span>{item.title}</span>
              <span className="bcc-journey-indicator" aria-hidden="true">{step === index ? '−' : '+'}</span>
            </button>
            <div id={`hero-journey-detail-${index}`} className="bcc-journey-detail" hidden={step !== index}>
              <p>{item.detail}</p>
              {index === 1 && modelReady && (
                <div className="bcc-journey-configurator">
                  <div className="bcc-journey-parts" role="group" aria-label="Customization area">
                    {[['paint', 'Paint'], ['wheels', 'Wheels'], ['interior', 'Interior']].map(([key, label]) => (
                      <button type="button" key={key} aria-pressed={part === key} onClick={() => { setPart(key); setPaused(true); }}>{label}</button>
                    ))}
                  </div>
                  <div className={`bcc-journey-swatches bcc-journey-swatches--${part}`} role="group" aria-label={`Preview vehicle ${part === 'paint' ? 'paint colour' : part === 'wheels' ? 'wheel finish' : 'interior accent'}`}>
                    {options.map((paint, paintIndex) => (
                      <button key={paint.name} type="button" style={{ '--paint': paint.hex }}
                        aria-label={paint.name} aria-pressed={selection === paintIndex} title={paint.name}
                        onClick={() => { selectOption(paintIndex); setPaused(true); }} />
                    ))}
                  </div>
                  <span className="bcc-journey-colour-name">{options[selection].name}</span>
                  <small>{part === 'wheels' ? 'Wheel finish' : part === 'interior' ? 'Interior accent' : 'Colour'} preview · options vary by vehicle</small>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="bcc-journey-footer">
      <div className="bcc-hero-model-hint">Drag to rotate <span aria-hidden="true">&middot;</span> Scroll over the vehicle to zoom</div>
      <nav className="bcc-journey-navigation" aria-label="Journey chapters">
        {HERO_JOURNEY.map((item, index) => <button key={item.title} type="button"
          aria-label={`Step ${index + 1}: ${item.title}`} aria-current={step === index ? 'step' : undefined}
          onClick={() => { setStep(index); setPaused(true); }} />)}
      </nav>
      {modelReady && !reducedMotion && (
        <button type="button" className="bcc-journey-playback" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
          <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span> {paused ? 'Play journey' : 'Pause journey'}
        </button>
      )}
      <div className="bcc-journey-signature">DISCOVER. BUY. CUSTOMIZE.<br />MAINTAIN. MOVE. SELL.</div>
      </div>
    </aside>
  );
};

export default HeroJourney;
