'use client';

import { useEffect, useState } from 'react';
import type { CalcNode } from '@/lib/engines/types';
import type { EngineState } from '@/lib/engines/types';
import { CatTag, Pills, SecLabel, ArrowPoint } from './shared';

interface Props {
  node: CalcNode;
  state: EngineState;
  onContinue: () => void;
}

interface CalcResult {
  illumina?: { gb: number; pairs: string; platform: string; warn?: string };
  nanopore?: { gb: number; platform: string; warn?: string };
  hybrid?: { total: number };
}

function compute(
  gs: number, ic: number, nc: number, eff: number
): CalcResult {
  if (!gs || (!ic && !nc)) return {};
  const effF = 100 / Math.max(eff, 1);
  const result: CalcResult = {};

  if (ic > 0) {
    const igb  = (gs * ic * effF) / 1000;
    const prM  = ((igb * 1e9) / 300 / 1e6).toFixed(1);
    const platform =
      igb < 0.5  ? 'MiSeq Nano kit'
    : igb < 5    ? 'MiSeq v3 600-cycle PE300'
    : igb < 15   ? 'NextSeq 550 mid-output or MiSeq v3 ×2–3'
    : igb < 40   ? 'NextSeq 550 high-output (150-cycle)'
    : igb < 200  ? 'NovaSeq 6000 SP flow cell'
    :              'NovaSeq 6000 S1/S2 flow cell';
    const warn =
      ic < 30  ? '⚠ Below 30× — unreliable de novo assembly'
    : ic < 50  ? '↗ Marginal — increase to 80× for reliable contigs'
    : undefined;
    result.illumina = { gb: igb, pairs: prM, platform, warn };
  }

  if (nc > 0) {
    const ngb = (gs * nc * effF) / 1000;
    const platform =
      ngb < 5   ? 'MinION R10.4 — 1 flow cell (~10–20 Gb)'
    : ngb < 20  ? 'MinION R10.4 — 1–2 flow cells'
    : ngb < 50  ? 'GridION (up to 5 × MinION flow cells)'
    : ngb < 100 ? 'PromethION R10.4 — 1 flow cell'
    :             'PromethION P24/P48 — multiple flow cells';
    const warn = nc < 20 ? '⚠ Below 20× — may fail to close chromosome' : undefined;
    result.nanopore = { gb: ngb, platform, warn };
  }

  if (ic > 0 && nc > 0) {
    result.hybrid = { total: (result.illumina!.gb + result.nanopore!.gb) };
  }

  return result;
}

const GOAL_COV: Record<string, { i: number; na: number; label: string; note: string }> = {
  species_id:  { i: 30,  na: 0,  label: 'Species ID',       note: 'Taxonomy via ANI — short reads sufficient' },
  bgc:         { i: 100, na: 40, label: 'BGC Discovery',     note: 'Deep coverage for complete BGC cluster recovery' },
  draft:       { i: 80,  na: 0,  label: 'Draft Genome',      note: 'SPAdes / SKESA optimal at 80–100×' },
  complete:    { i: 100, na: 60, label: 'Complete Genome',   note: 'Long reads essential for chromosome closure' },
  amr:         { i: 80,  na: 0,  label: 'AMR Profiling',     note: '50–100× sufficient; add Nanopore if plasmid resistance suspected' },
  comparative: { i: 50,  na: 0,  label: 'Comparative',       note: '30–50× adequate for SNP / core genome analysis' },
};
const SZ_DEF: Record<string, number> = { small: 1.5, standard: 4, large: 9 };

export function CalcNodeRenderer({ node, state, onContinue }: Props) {
  const gid = state.ans.project_goal?.id ?? '';
  const sid = state.ans.genome_size?.id ?? '';
  const tid = state.ans.tech_select?.id ?? '';

  const gc      = GOAL_COV[gid] ?? { i: 80, na: 0, note: 'Adjust based on your project goal', label: '' };
  const defSize = SZ_DEF[sid] ?? 4;
  const isLO    = tid === 'long_only';
  const isHyb   = tid === 'hybrid';
  const showNano = isHyb || isLO;

  const [gs,  setGs]  = useState(defSize);
  const [ic,  setIc]  = useState(isLO ? 30 : gc.i);
  const [nc,  setNc]  = useState(isHyb ? (gc.na || 30) : isLO ? 80 : 0);
  const [eff, setEff] = useState(80);

  const [result, setResult] = useState<CalcResult>({});
  useEffect(() => { setResult(compute(gs, ic, showNano ? nc : 0, eff)); }, [gs, ic, nc, eff, showNano]);

  return (
    <>
      <CatTag label={node.cat} />
      <h1 className="node-title">{node.title}</h1>
      <p className="body-text">
        Coverage = total sequenced bases ÷ genome size. Insufficient coverage fragments assemblies;
        excess coverage provides diminishing returns.
      </p>

      {/* Coverage targets table */}
      <SecLabel>Minimum Coverage by Objective</SecLabel>
      <div className="tbl" style={{ marginBottom: 24 }}>
        {Object.entries(GOAL_COV).map(([k, v]) => (
          <div key={k} className="tbl-r" style={k === gid ? { background: 'rgba(184,245,200,.05)' } : {}}>
            <div className={`tbl-v${k === gid ? ' c-g' : ''}`} style={{ fontSize: 11, minWidth: 140 }}>
              {v.label}{k === gid ? ' ◀' : ''}
            </div>
            <div className="tbl-m" style={{ fontSize: 11 }}>
              {v.i}× Illumina{v.na ? ` + ${v.na}× Nanopore` : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Four factors */}
      <SecLabel>Four Factors That Affect Your Coverage Decision</SecLabel>
      <div className="pts" style={{ marginBottom: 28 }}>
        <ArrowPoint text="GC content bias — Organisms with GC >70% or <30% require 20–30% additional coverage to achieve uniform depth across compositionally extreme regions." />
        <ArrowPoint text="PCR duplicate rate — Illumina libraries typically generate 10–20% duplicates. Mark and remove with Picard MarkDuplicates or fastp --dedup before your final coverage check." />
        <ArrowPoint text="Repeat-rich genomes — Streptomyces (8–12 Mb, >30 rDNA operons) and IS element-heavy organisms need higher coverage and long reads to correctly assemble repetitive structures." />
        <ArrowPoint text="Nanopore N50 > raw depth — For hybrid assembly, read N50 matters more than coverage. A 25× run with N50 25 kb resolves repeats better than 60× at N50 3 kb." />
      </div>

      {/* Calculator */}
      <SecLabel>Coverage Calculator</SecLabel>
      {gc.note && (
        <div className="caution-box" style={{ borderColor: 'rgba(184,245,200,.15)', background: 'rgba(184,245,200,.04)', color: 'var(--muted)', marginBottom: 16 }}>
          ↗ Pre-filled for your goal — {gc.note}
        </div>
      )}

      <div className="calc-grid">
        <div className="calc-field">
          <label className="calc-lbl">Genome size (Mb)</label>
          <input className="calc-inp" type="number" min={0.1} max={50} step={0.5}
            value={gs} onChange={e => setGs(parseFloat(e.target.value) || 0)} />
          <div className="inp-note">Estimated size — use k-mer analysis for precision</div>
        </div>

        <div className="calc-field">
          <label className="calc-lbl">{isLO ? 'Illumina for polishing (×)' : 'Illumina coverage (×)'}</label>
          <input className="calc-inp" type="number" min={0} max={500} step={10}
            value={ic} onChange={e => setIc(parseFloat(e.target.value) || 0)} />
          <div className="inp-note">{isLO ? 'Short-read polishing only — 30× recommended' : 'Target depth for primary assembly'}</div>
        </div>

        {showNano && (
          <div className="calc-field">
            <label className="calc-lbl">{isLO ? 'Nanopore coverage (×)' : 'Nanopore / PacBio (×)'}</label>
            <input className="calc-inp" type="number" min={0} max={300} step={5}
              value={nc} onChange={e => setNc(parseFloat(e.target.value) || 0)} />
            <div className="inp-note">{isLO ? 'Primary long-read coverage for closure' : 'Supplemental long-read coverage'}</div>
          </div>
        )}

        <div className="calc-field">
          <label className="calc-lbl">Usable read yield (%)</label>
          <input className="calc-inp" type="number" min={50} max={100} step={5}
            value={eff} onChange={e => setEff(parseFloat(e.target.value) || 80)} />
          <div className="inp-note">Reads passing QC — default 80%</div>
        </div>
      </div>

      {/* Output */}
      <div className="calc-out">
        {!result.illumina && !result.nanopore ? (
          <p style={{ fontSize: 11, color: 'var(--muted)', padding: '4px 0' }}>Enter values above to calculate output requirements.</p>
        ) : (
          <>
            {result.illumina && (
              <>
                <div className="calc-sec">Illumina PE150 Requirements</div>
                <div className="calc-r"><div className="calc-rl">Sequencing output needed</div><div className="calc-rv">{result.illumina.gb.toFixed(2)} Gb</div></div>
                <div className="calc-r"><div className="calc-rl">PE150 read pairs required</div><div className="calc-rv">{result.illumina.pairs}M pairs</div></div>
                <div className="calc-r"><div className="calc-rl">Suggested run type</div><div className="calc-rv" style={{ color: 'var(--text)' }}>{result.illumina.platform}</div></div>
                {result.illumina.warn && (
                  <div className="calc-r">
                    <div className="calc-rl" style={{ color: 'var(--warn)' }}>Coverage note</div>
                    <div className="calc-rv" style={{ color: 'var(--warn)' }}>{result.illumina.warn}</div>
                  </div>
                )}
              </>
            )}
            {result.nanopore && (
              <>
                <div className="calc-sec">Nanopore R10.4 Requirements</div>
                <div className="calc-r"><div className="calc-rl">Sequencing output needed</div><div className="calc-rv">{result.nanopore.gb.toFixed(2)} Gb</div></div>
                <div className="calc-r"><div className="calc-rl">Suggested platform</div><div className="calc-rv" style={{ color: 'var(--text)' }}>{result.nanopore.platform}</div></div>
                <div className="calc-r"><div className="calc-rl">Read N50 target</div><div className="calc-rv">≥ 10 kb (20 kb+ preferred)</div></div>
                {result.nanopore.warn && (
                  <div className="calc-r">
                    <div className="calc-rl" style={{ color: 'var(--warn)' }}>Coverage note</div>
                    <div className="calc-rv" style={{ color: 'var(--warn)' }}>{result.nanopore.warn}</div>
                  </div>
                )}
              </>
            )}
            {result.hybrid && (
              <>
                <div className="calc-sec">Hybrid Assembly Total</div>
                <div className="calc-r"><div className="calc-rl">Combined output</div><div className="calc-rv">{result.hybrid.total.toFixed(2)} Gb</div></div>
                <div className="calc-r"><div className="calc-rl">Recommended assembler</div><div className="calc-rv" style={{ color: 'var(--text)' }}>Unicycler hybrid / Flye → Polypolish + Medaka</div></div>
              </>
            )}
          </>
        )}
      </div>

      <span className="tools-label" style={{ marginTop: 16, display: 'block' }}>Genome size estimation tools</span>
      <Pills tools={['Jellyfish 2 + GenomeScope2', 'Mash sketch', 'KAT (k-mer analysis)', 'Picard MarkDuplicates', 'NanoStat (Nanopore QC)', 'mosdepth (post-run coverage)']} />

      <button className="btn-p" onClick={onContinue}>Continue to QC →</button>
    </>
  );
}
