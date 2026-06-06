'use client';

import type { EngineState } from '@/lib/engines/types';

interface Props {
  state: EngineState;
  onRestart: () => void;
}

interface WFStep { l: string; d: string; }
interface SumTag  { k: string; v: string; }

export function WgsSummaryNode({ state, onRestart }: Props) {
  const goal = state.ans.project_goal;
  const tech = state.ans.tech_select;
  const size = state.ans.genome_size;
  const asm  = state.ans.assembly_choice;
  const ani  = state.ans.ani_result;
  const ann  = state.ans.annot_select;
  const pre  = state.ans.prescreening;

  const isHybrid = tech?.id === 'hybrid' || tech?.id === 'long_only' || state.hist.includes('hybrid_upgrade');
  const isNovel  = ani?.id === 'novel';
  const isGray   = ani?.id === 'gray';

  // ── Build workflow ──────────────────────────────────────
  const wf: WFStep[] = [];
  wf.push({ l: 'Pure colony confirmation', d: 'Single colony morphology · Gram stain · optional 16S identity check' });
  if (pre?.id === 'yes16s') wf.push({ l: '16S rRNA pre-screening', d: 'SILVA / EzBioCloud · assign preliminary taxonomy · decide on WGS' });
  wf.push({
    l: 'DNA extraction & QC',
    d: isHybrid
      ? 'High-molecular-weight DNA (>30 kb) · NanoDrop (A260/280 ≈ 1.8) · Qubit · TapeStation'
      : 'DNA integrity check · NanoDrop (A260/280 ≈ 1.8) · Qubit · gel electrophoresis',
  });

  if (tech?.id === 'hybrid') {
    const ic = size?.id === 'small' ? '200×+' : '80–100×';
    const nc = size?.id === 'large' ? '50–60×' : '30–50×';
    wf.push({ l: 'Illumina PE150 library prep & sequencing', d: `Coverage target: ${ic}` });
    wf.push({ l: 'Nanopore R10.4 library prep & sequencing', d: `Coverage target: ${nc} · Read N50 ≥ 10 kb` });
  } else if (tech?.id === 'long_only') {
    wf.push({ l: 'Nanopore R10.4 / PacBio HiFi sequencing', d: 'Coverage target: 60–100× · Read N50 ≥ 10 kb' });
    wf.push({ l: 'Illumina PE150 (polishing)', d: '30× short-read coverage for Polypolish accuracy correction' });
  } else {
    const ic = size?.id === 'small' ? '200×+' : '80–100×';
    wf.push({ l: 'Illumina PE150 library prep & sequencing', d: `Coverage target: ${ic}` });
  }

  wf.push({ l: 'Coverage verification & read QC', d: 'FastQC / Falco · MultiQC · fastp (Q20+ trim) · Kraken2 contamination screen' });

  if (asm?.id === 'ref_map') {
    wf.push({ l: 'Reference genome selection', d: 'GTDB-Tk / Mash · FastANI against type strain · RefSeq Complete Genomes' });
    wf.push({ l: 'Reference-based mapping & variant calling', d: 'BWA-MEM2 / Minimap2 · Snippy / GATK · VCF filtering' });
  } else {
    wf.push({ l: isHybrid ? 'Hybrid de novo assembly' : 'De novo assembly', d: isHybrid ? 'Unicycler (hybrid mode) / Flye' : 'SPAdes / SKESA' });
    wf.push({ l: 'Assembly polishing', d: isHybrid ? 'Medaka (Nanopore) → Polypolish (Illumina)' : 'Polypolish (Illumina short-read polishing)' });
  }

  wf.push({ l: 'Assembly quality assessment', d: 'QUAST (N50, contig count) · CheckM2 (completeness >95%, contamination <5%) · BUSCO v5 · Bandage' });
  wf.push({ l: 'Taxonomic confirmation', d: `FastANI / skani vs. type strain · GTDB-Tk${isNovel || isGray ? ' · GBDP/TYGS (dDDH) · IQ-TREE2 core genome phylogeny' : ''}` });
  wf.push({ l: 'Genome annotation', d: 'Bakta (2025 recommended) · Prokka (alternative) · NCBI PGAP (for GenBank submission)' });
  (ann?.options ?? []).forEach((o: any) => wf.push({ l: o.label, d: o.tools.join(' · ') }));
  wf.push({ l: 'Data deposition & metadata', d: 'NCBI GenBank / ENA · Include: collection date, GPS coordinates, isolation source, host organism' });

  // ── Checklist ──────────────────────────────────────────
  const cl: string[] = [
    'Pure culture confirmed — single colony, consistent morphology',
    'Coverage target verified — genome size × coverage calculated before run',
    'Assembly completeness >95% and contamination <5% (CheckM2)',
    'Assembly polished (Medaka + Polypolish or equivalent)',
    'Annotation complete (Bakta) and validated',
    'Taxonomy confirmed — FastANI / skani vs. closest type strain',
    ...(isNovel ? ['dDDH <70% confirmed (GBDP/TYGS)', 'Phenotypic characterization completed', 'Complete closed genome generated', 'Name validated via LPSN'] : []),
    ...(isGray  ? ['Gray zone resolved — dDDH performed', 'Core genome phylogeny generated (IQ-TREE2)'] : []),
    'Metadata prepared (date, GPS, source, isolation method)',
    'Data deposited with accession number (NCBI/ENA)',
  ];

  // ── Summary tags ──────────────────────────────────────
  const tags: SumTag[] = [
    { k: 'Goal',     v: goal?.badge ?? goal?.label?.split(' —')[0] ?? 'Genome Analysis' },
    { k: 'Tech',     v: tech?.id === 'hybrid' ? 'Hybrid' : tech?.id === 'long_only' ? 'Long Read' : 'Illumina PE150' },
    { k: 'Genome',   v: size?.id === 'small' ? '< 2 Mb' : size?.id === 'large' ? '> 6 Mb' : '2–6 Mb' },
    { k: 'Assembly', v: asm?.id === 'ref_map' ? 'Reference-based' : 'De novo' },
    ...(ani ? [{ k: 'Taxonomy', v: isNovel ? 'Novel species' : isGray ? 'Gray zone' : 'Confirmed' }] : []),
  ];

  return (
    <>
      <div className="cat-tag cat-tag--default">WORKFLOW COMPLETE</div>
      <h1 className="node-title">Your Custom</h1>
      <h1 className="node-title italic" style={{ marginTop: -8, marginBottom: 28 }}>WGS Workflow</h1>

      {/* Summary tags */}
      <div className="sum-tags">
        {tags.map(t => (
          <div key={t.k} className="sum-tag">
            <span className="tag-k">{t.k.toUpperCase()}&nbsp;&nbsp;</span>
            <span className="tag-v">{t.v}</span>
          </div>
        ))}
      </div>

      {/* Workflow steps */}
      <span className="sec-lbl">Recommended Workflow</span>
      <div style={{ marginBottom: 32 }}>
        {wf.map((s, i) => (
          <div key={i} className="wf-s">
            <div className="wf-n">{String(i + 1).padStart(2, '0')}</div>
            <div>
              <div className="wf-l">{s.l}</div>
              <div className="wf-d">{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <span className="sec-lbl">Publication Checklist</span>
      <div style={{ marginBottom: 32 }}>
        {cl.map((c, i) => (
          <div key={i} className="cl-i">
            <div className="cl-b" />
            <div className="cl-t">{c}</div>
          </div>
        ))}
      </div>

      <button className="btn-ghost" onClick={onRestart}>↺ Start new analysis</button>
    </>
  );
}
