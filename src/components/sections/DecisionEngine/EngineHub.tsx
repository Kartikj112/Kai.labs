'use client';

import Link from 'next/link';
import type { EngineModule } from '@/lib/engines/types';

interface Props {
  modules: EngineModule[];
}

const CAT_COLORS: Record<string, string> = {
  'GENOMICS':      'rgba(184,245,200,0.1)',
  'SEQUENCING':    'rgba(184,245,200,0.1)',
  'ASSEMBLY':      'rgba(125,232,176,0.08)',
  'METAGENOMICS':  'rgba(125,232,176,0.08)',
  'FUNCTIONAL':    'rgba(240,192,96,0.06)',
  'STATISTICS':    'rgba(240,192,96,0.06)',
  'DRUG DISCOVERY':'rgba(184,245,200,0.12)',
  'PUBLICATION':   'rgba(125,232,176,0.08)',
  'STRATEGY':      'rgba(184,245,200,0.1)',
  'PLANNING':      'rgba(125,232,176,0.06)',
  'CAREER':        'rgba(240,192,96,0.06)',
  'NANOPORE':      'rgba(125,232,176,0.08)',
  'SUBMISSION':    'rgba(125,232,176,0.06)',
  'TAXONOMY':      'rgba(184,245,200,0.1)',
  'COMPUTING':     'rgba(125,232,176,0.06)',
  'AMPLICON':      'rgba(125,232,176,0.06)',
};

export function EngineHub({ modules }: Props) {
  const live    = modules.filter(m => m.status === 'live');
  const coming  = modules.filter(m => m.status === 'coming-soon' || m.status === 'placeholder');

  return (
    <div className="engine-hub">
      {/* Hero */}
      <div className="hub-hero">
        <div className="tag cat-tag--default" style={{ marginBottom: 20 }}>KAI DECISION ENGINE</div>
        <h1 className="hub-title">Research Decision Support</h1>
        <p className="hub-subtitle italic">for genomics, metagenomics &amp; bioinformatics</p>
        <p className="hub-desc">
          Helping MSc students, PhD scholars, and early-career researchers make informed
          bioinformatics and genomics decisions — without spending days searching papers,
          forums, tutorials, and documentation.
        </p>
        <div className="hub-stats">
          <div className="hub-stat">
            <div className="hub-stat-n">{live.length}</div>
            <div className="hub-stat-l">Live modules</div>
          </div>
          <div className="hub-stat-div" />
          <div className="hub-stat">
            <div className="hub-stat-n">{coming.length}</div>
            <div className="hub-stat-l">Coming soon</div>
          </div>
          <div className="hub-stat-div" />
          <div className="hub-stat">
            <div className="hub-stat-n">{live.reduce((a, m) => a + (m.totalSteps ?? 0), 0)}+</div>
            <div className="hub-stat-l">Decision steps</div>
          </div>
        </div>
      </div>

      {/* Live modules */}
      <div className="hub-section-label">Available Now</div>
      <div className="module-grid">
        {live.map(m => (
          <Link key={m.id} href={`/engine/${m.id}`} className="module-card" style={{ '--card-bg': CAT_COLORS[m.cat] ?? 'rgba(184,245,200,0.07)' } as React.CSSProperties}>
            <div className="mc-top">
              <span className="mc-cat">{m.cat}</span>
              {m.badge && <span className="mc-badge">{m.badge}</span>}
            </div>
            <h3 className="mc-title">{m.title}</h3>
            <p className="mc-tagline">{m.tagline}</p>
            <div className="mc-tags">
              {m.tags.slice(0, 4).map(t => <span key={t} className="mc-tag">{t}</span>)}
            </div>
            <div className="mc-footer">
              {m.totalSteps && <span className="mc-steps">{m.totalSteps} steps</span>}
              <span className="mc-start">Start →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Coming soon */}
      {coming.length > 0 && (
        <>
          <div className="hub-section-label" style={{ marginTop: 48 }}>Coming Soon</div>
          <div className="module-grid module-grid--dim">
            {coming.map(m => (
              <div key={m.id} className="module-card module-card--dim">
                <div className="mc-top">
                  <span className="mc-cat">{m.cat}</span>
                  <span className="mc-badge mc-badge--cs">Coming Soon</span>
                </div>
                <h3 className="mc-title">{m.title}</h3>
                <p className="mc-tagline">{m.tagline}</p>
                <div className="mc-tags">
                  {m.tags.slice(0, 4).map(t => <span key={t} className="mc-tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
