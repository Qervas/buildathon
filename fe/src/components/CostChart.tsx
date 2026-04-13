import { useEffect, useRef, useState } from 'react';

export function CostChart() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const bars = [
    { label: 'Mocap Studio', cost: 2500, unit: '/day', color: '#ef4444', width: 100 },
    { label: 'Mocap Suit', cost: 5000, unit: ' hardware', color: '#f97316', width: 85 },
    { label: 'Freelancer', cost: 150, unit: '/anim', color: '#eab308', width: 40 },
    { label: 'Asset Store', cost: 30, unit: '/pack', color: '#a3a3a3', width: 20 },
    { label: 'ohao text2motion', cost: 0.002, unit: '/anim', color: '#4ade80', width: 2 },
    { label: 'ohao video mocap', cost: 0.04, unit: '/clip', color: '#22d3ee', width: 3 },
  ];

  return (
    <div ref={ref} className="cost-chart">
      <div className="cost-chart__bars">
        {bars.map((bar, i) => (
          <div key={bar.label} className="cost-chart__row">
            <span className="cost-chart__label">{bar.label}</span>
            <div className="cost-chart__track">
              <div
                className="cost-chart__fill"
                style={{
                  width: visible ? `${bar.width}%` : '0%',
                  background: bar.color,
                  transitionDelay: `${i * 120}ms`,
                }}
              />
            </div>
            <span className="cost-chart__value" style={{ color: bar.color }}>
              ${bar.cost < 1 ? bar.cost.toFixed(3) : bar.cost.toLocaleString()}{bar.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimeComparison() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="time-comp">
      <div className="time-comp__row">
        <span className="time-comp__label">Traditional Mocap</span>
        <div className="time-comp__bar-wrap">
          <div
            className="time-comp__bar time-comp__bar--old"
            style={{ width: visible ? '100%' : '0%' }}
          >
            <span className="time-comp__phase" style={{ width: '20%' }}>Plan</span>
            <span className="time-comp__phase" style={{ width: '15%' }}>Book</span>
            <span className="time-comp__phase" style={{ width: '10%' }}>Shoot</span>
            <span className="time-comp__phase" style={{ width: '30%' }}>Clean</span>
            <span className="time-comp__phase" style={{ width: '25%' }}>Retarget</span>
          </div>
        </div>
        <span className="time-comp__duration">2-4 weeks</span>
      </div>
      <div className="time-comp__row">
        <span className="time-comp__label">ohao</span>
        <div className="time-comp__bar-wrap">
          <div
            className="time-comp__bar time-comp__bar--new"
            style={{ width: visible ? '3%' : '0%', transitionDelay: '400ms' }}
          >
            <span className="time-comp__phase" style={{ width: '100%' }}>Done</span>
          </div>
        </div>
        <span className="time-comp__duration">30 seconds</span>
      </div>
    </div>
  );
}

export function AccessPyramid() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const tiers = [
    { label: 'AAA Studios', cost: '$500K+ budget', pct: 12, color: '#ef4444' },
    { label: 'Mid-size Studios', cost: '$50K-500K', pct: 30, color: '#f97316' },
    { label: 'Small Studios', cost: '$5K-50K', pct: 55, color: '#eab308' },
    { label: 'Solo Indie Devs', cost: 'Self-funded', pct: 80, color: '#a3a3a3' },
    { label: 'Everyone with ohao', cost: '$0.002/anim', pct: 100, color: '#4ade80' },
  ];

  return (
    <div ref={ref} className="pyramid">
      <div className="pyramid__col pyramid__col--before">
        <span className="pyramid__heading">Before ohao</span>
        {tiers.slice(0, 4).map((t, i) => (
          <div
            key={t.label}
            className="pyramid__tier"
            style={{
              width: visible ? `${t.pct}%` : '0%',
              background: t.color,
              transitionDelay: `${i * 150}ms`,
              opacity: i >= 2 ? 0.35 : 1,
            }}
          >
            <span>{t.label}</span>
            {i < 2 && <span className="pyramid__check">can animate</span>}
            {i >= 2 && <span className="pyramid__x">too expensive</span>}
          </div>
        ))}
      </div>
      <div className="pyramid__col pyramid__col--after">
        <span className="pyramid__heading">After ohao</span>
        {tiers.map((t, i) => (
          <div
            key={t.label}
            className="pyramid__tier"
            style={{
              width: visible ? `${t.pct}%` : '0%',
              background: t.color,
              transitionDelay: `${i * 150 + 600}ms`,
            }}
          >
            <span>{t.label}</span>
            <span className="pyramid__check">can animate</span>
          </div>
        ))}
      </div>
    </div>
  );
}
