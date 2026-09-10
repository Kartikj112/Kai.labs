// ─────────────────────────────────────────────────────────────
//  KAI Decision Engine — Modules 15–18
//    15. ONT Basecalling & Filtering Advisor   (ont-basecalling)
//    16. 16S Primer Selection Advisor          (primer-selection)
//    17. Metadata & MIMARKS Compliance Checker (metadata-compliance)
//    18. Statistical Power Calculator          (statistical-power)
// ─────────────────────────────────────────────────────────────

import type { DecisionTree } from './types';

/* ═══════════════════════════════════════════════════════════
   15 · ONT BASECALLING & FILTERING ADVISOR
   ═══════════════════════════════════════════════════════════ */
export const ontBasecallingTree: DecisionTree = {
  flowcell_chem: {
    id: 'flowcell_chem', step: 1, total: 7, type: 'q',
    cat: 'FLOW CELL CHEMISTRY', title: 'Flow Cell & Pore Chemistry',
    q: 'Which flow cell chemistry produced your data?',
    hint: 'Chemistry is the single largest determinant of achievable accuracy — it caps everything downstream',
    opts: [
      { id: 'r10_4', label: 'R10.4.1 — current chemistry', badge: 'Recommended', sub: 'Dual reader head; Q20+ simplex, Q30+ duplex with the sup model', next: 'basecaller_choice', hi: true },
      { id: 'r9_4', label: 'R9.4.1 — legacy chemistry', sub: 'Single reader head; homopolymer errors persist even at sup accuracy', next: 'r9_legacy_warn', w: true },
      { id: 'r10_3', label: 'R10.3 or older', sub: 'Superseded; models are no longer actively improved', next: 'r9_legacy_warn', w: true },
      { id: 'unknown_chem', label: "I don't know which chemistry was used", sub: 'Recoverable from the run metadata', next: 'find_chemistry' },
    ],
  },

  find_chemistry: {
    id: 'find_chemistry', step: 1, total: 7, type: 'info',
    cat: 'IDENTIFY CHEMISTRY', title: 'Reading Chemistry From Run Metadata',
    body: 'Every run records its flow cell and kit in the sequencing summary and in the POD5/FAST5 headers. You need both the flow cell ID (FLO-*) and the ligation kit (SQK-*) to pick the right basecalling model.',
    cmd: '# From the run directory — flow cell and kit are in the summary header\nhead -1 sequencing_summary.txt\ngrep -m1 -o "FLO-[A-Z0-9]*" final_summary_*.txt\ngrep -m1 -o "SQK-[A-Z0-9-]*" final_summary_*.txt\n\n# Or read it straight out of the POD5 files\npod5 view reads.pod5 --include "read_id,pore_type" | head\n\n# Dorado will list every model it can auto-select for that data\ndorado download --list',
    tbl: [
      { v: 'FLO-MIN114', m: 'MinION R10.4.1 — current chemistry', s: 'c-g' },
      { v: 'FLO-PRO114M', m: 'PromethION R10.4.1 — current chemistry', s: 'c-g' },
      { v: 'FLO-MIN106', m: 'MinION R9.4.1 — legacy', s: 'c-y' },
      { v: 'SQK-LSK114', m: 'Ligation kit V14 — pairs with R10.4.1', s: 'c-g' },
      { v: 'SQK-LSK109', m: 'Ligation kit V12 — pairs with R9.4.1', s: 'c-y' },
    ],
    caution: 'Basecalling R10.4.1 data with an R9.4.1 model (or the reverse) silently produces poor-quality reads rather than an error. Always confirm the pairing before a long run.',
    act: 'Chemistry identified — continue →', next: 'basecaller_choice',
  },

  r9_legacy_warn: {
    id: 'r9_legacy_warn', step: 1, total: 7, type: 'info',
    cat: 'LEGACY CHEMISTRY', title: 'R9.4.1 — Expectations and Limits',
    body: 'R9.4.1 data is still perfectly usable, but its error profile is different in kind, not just degree. The single reader head cannot resolve homopolymers longer than about six bases, and that error survives any amount of coverage because it is systematic rather than random.',
    tbl: [
      { v: 'sup model', m: 'Approximately Q14–16 modal — the practical ceiling for R9.4.1', s: 'c-y' },
      { v: 'Homopolymers', m: 'Systematic indels in runs >6 bp — will not average out with depth', s: 'c-r' },
      { v: 'Consequence', m: 'Frameshifted CDS calls in annotation; inflated pseudogene counts', s: 'c-r' },
      { v: 'Mitigation', m: 'Short-read polishing is effectively mandatory, not optional', s: 'c-g' },
    ],
    caution: 'Do not publish an R9.4.1-only bacterial genome without Illumina polishing. Reviewers now routinely ask for the polishing evidence, because uncorrected homopolymer indels produce annotation artefacts that look like real biology.',
    tools: ['Dorado (r941_e81_sup_g514 models)', 'Polypolish', 'POLCA (MaSuRCA)', 'Medaka (r941 models)'],
    act: 'Understood — continue to basecaller →', next: 'basecaller_choice',
  },

  basecaller_choice: {
    id: 'basecaller_choice', step: 2, total: 7, type: 'q',
    cat: 'BASECALLER', title: 'Basecaller Selection',
    q: 'Which basecaller are you using?',
    hint: 'Dorado is the current ONT basecaller; Guppy is retired and no longer receives new models',
    opts: [
      { id: 'dorado', label: 'Dorado', badge: 'Current', sub: 'GPU-accelerated, POD5-native, duplex-capable, actively developed', next: 'model_accuracy', hi: true },
      { id: 'guppy', label: 'Guppy — legacy', sub: 'Superseded by Dorado; no models for the newest chemistries', next: 'guppy_migrate', w: true },
      { id: 'already_called', label: 'Already basecalled — I only have FASTQ', sub: 'Skip to filtering and QC with what you have', next: 'existing_fastq' },
    ],
  },

  guppy_migrate: {
    id: 'guppy_migrate', step: 2, total: 7, type: 'info',
    cat: 'MIGRATE TO DORADO', title: 'Guppy Is Retired — Move to Dorado',
    body: 'Guppy is no longer developed and does not ship models for current chemistry. Dorado is a drop-in replacement for the same job, is substantially faster on the same GPU, and reads POD5 directly rather than going through FAST5.',
    cmd: '# Convert legacy FAST5 to POD5 first (much faster I/O, smaller on disk)\npod5 convert fast5 ./fast5_pass/ --output reads.pod5\n\n# Basecall — the model is auto-selected from the data when you pass a speed\ndorado basecaller sup reads.pod5 > calls.bam\n\n# Emit FASTQ instead if downstream tools need it\ndorado basecaller sup reads.pod5 --emit-fastq > calls.fastq',
    tools: ['Dorado', 'pod5 (conversion CLI)'],
    act: 'Continue with Dorado →', next: 'model_accuracy',
  },

  existing_fastq: {
    id: 'existing_fastq', step: 2, total: 7, type: 'info',
    cat: 'PRE-BASECALLED DATA', title: 'Working From Existing FASTQ',
    body: 'You can still filter and assess pre-basecalled reads, but you cannot recover accuracy that was lost at basecalling time. If the raw POD5/FAST5 signal files still exist, re-basecalling with a modern sup model is almost always the single highest-yield thing you can do — it is free accuracy, no new sequencing required.',
    tbl: [
      { v: 'Have POD5/FAST5', m: 'Re-basecall with Dorado sup — typically several Q points of improvement', s: 'c-g' },
      { v: 'FASTQ only', m: 'Filter and polish; accuracy ceiling is already fixed', s: 'c-y' },
      { v: 'Check first', m: 'Run NanoPlot — if modal Q is below 15, re-basecalling is worth the GPU time', s: 'c-g' },
    ],
    caution: 'Raw signal files are large and often deleted after a run. Check your archive before concluding you only have FASTQ.',
    act: 'Continue to filtering →', next: 'read_filtering',
  },

  model_accuracy: {
    id: 'model_accuracy', step: 3, total: 7, type: 'q',
    cat: 'MODEL SELECTION', title: 'Basecalling Model Accuracy',
    q: 'Which accuracy model fits your project?',
    hint: 'Compute cost rises steeply from fast to sup; accuracy rises with it. Match the model to what the data must support.',
    opts: [
      { id: 'sup', label: 'sup — super-accurate', badge: 'Assembly', sub: 'Highest accuracy; the right default for any assembly or variant work', next: 'duplex_q', hi: true },
      { id: 'hac', label: 'hac — high accuracy', sub: 'A reasonable compromise when GPU time is genuinely constrained', next: 'duplex_q' },
      { id: 'fast', label: 'fast', sub: 'Live run monitoring and species triage only — not for assembly', next: 'fast_warn', w: true },
    ],
  },

  fast_warn: {
    id: 'fast_warn', step: 3, total: 7, type: 'info',
    cat: 'ACCURACY WARNING', title: 'The fast Model Is Not an Assembly Model',
    body: 'The fast model exists so you can watch a run in progress and decide whether to keep sequencing. Assembling from it wastes the sequencing you already paid for: the consensus errors it introduces are not fixable by adding depth, and you will spend more compute polishing than you saved at basecalling.',
    tbl: [
      { v: 'fast', m: '~Q10–12 modal — run monitoring, barcode demultiplexing, rough species ID', s: 'c-r' },
      { v: 'hac', m: '~Q18–20 modal — acceptable for assembly when GPU-limited', s: 'c-y' },
      { v: 'sup', m: '~Q20–24 modal on R10.4.1 — the assembly standard', s: 'c-g' },
      { v: 'Rerun cost', m: 'Re-basecalling is GPU time only — no new library, no new flow cell', s: 'c-g' },
    ],
    caution: 'Basecalling is not destructive. As long as you kept the POD5 files you can re-run at sup accuracy at any point without touching the sample.',
    act: 'Switch to sup and continue →', next: 'duplex_q',
  },

  duplex_q: {
    id: 'duplex_q', step: 4, total: 7, type: 'q',
    cat: 'DUPLEX', title: 'Duplex Basecalling',
    q: 'Do you need duplex reads?',
    hint: 'Duplex pairs a strand with its complement for Q30+ accuracy — but only a minority of reads ever form a pair',
    opts: [
      { id: 'duplex_yes', label: 'Yes — I need maximum per-read accuracy', sub: 'Variant calling, methylation, or closing a difficult repeat', next: 'duplex_info' },
      { id: 'duplex_no', label: 'No — simplex sup is sufficient', badge: 'Typical', sub: 'Standard bacterial assembly and metagenomics', next: 'read_filtering', hi: true },
    ],
  },

  duplex_info: {
    id: 'duplex_info', step: 4, total: 7, type: 'info',
    cat: 'DUPLEX BASECALLING', title: 'Duplex — Accuracy at the Cost of Yield',
    body: 'Duplex calls a template strand together with its complement when both happen to pass through the same pore in sequence. The result is Q30+ per read, but you only get it for the fraction of reads that actually paired — plan the run around the duplex yield, not the total yield.',
    tbl: [
      { v: 'Accuracy', m: 'Q30+ per read — comparable to short-read accuracy', s: 'c-g' },
      { v: 'Typical yield', m: 'Roughly 10–30% of reads form duplex pairs under good conditions', s: 'c-y' },
      { v: 'Requires', m: 'R10.4.1 + LSK114; library handling strongly affects pairing rate', s: 'c-g' },
      { v: 'Compute', m: 'Substantially slower than simplex — budget GPU time accordingly', s: 'c-y' },
    ],
    cmd: '# Duplex emits both simplex and duplex reads; dx:i:1 tags the duplex ones\ndorado duplex sup reads.pod5 > duplex.bam\n\n# Split them apart\nsamtools view -e "[dx]==1" -b duplex.bam > duplex_only.bam\nsamtools view -e "[dx]==0" -b duplex.bam > simplex_only.bam\n\n# What duplex rate did the run actually achieve?\nsamtools view duplex.bam | grep -c "dx:i:1"',
    caution: 'If you need duplex, aim for roughly 3–4× the raw output you would otherwise plan, because only the paired fraction reaches Q30.',
    tools: ['Dorado duplex', 'samtools', 'duplex_tools'],
    act: 'Continue to filtering →', next: 'read_filtering',
  },

  read_filtering: {
    id: 'read_filtering', step: 5, total: 7, type: 'q',
    cat: 'READ FILTERING', title: 'Filtering Strategy',
    q: 'What is the downstream application?',
    hint: 'Filtering thresholds are application-specific — the same cutoff that helps an assembly can ruin a metagenome',
    opts: [
      { id: 'filter_asm', label: 'De novo genome assembly', sub: 'Length matters more than per-read quality', next: 'filter_assembly', hi: true },
      { id: 'filter_meta', label: 'Metagenome assembly or binning', sub: 'Aggressive length filtering discards real low-abundance taxa', next: 'filter_metagenome' },
      { id: 'filter_var', label: 'Variant calling or amplicon consensus', sub: 'Per-read quality matters more than length', next: 'filter_variant' },
    ],
  },

  filter_assembly: {
    id: 'filter_assembly', step: 6, total: 7, type: 'rec',
    cat: 'ASSEMBLY FILTERING', title: 'Filtering for De Novo Assembly',
    tagline: 'Keep the long reads. Length resolves repeats; quality is recoverable by polishing.',
    pts: [
      'Filter on quality at Q10 for R10.4.1 sup data. Going higher feels safer but mostly discards usable reads — modern assemblers handle the residual error well.',
      'Set a minimum length of 1 kb. Below that, reads contribute little to repeat resolution while inflating the assembly graph.',
      'Do not cap the upper length. The longest reads are exactly the ones that span rDNA operons and IS elements, and they are the reason to use Nanopore at all.',
      'Target 60–100× depth after filtering. If you are far above that, subsample by keeping the longest reads rather than a random subset — Filtlong does this natively.',
      'Read N50 predicts assembly contiguity better than raw coverage. A 40× run at N50 20 kb closes more chromosomes than an 80× run at N50 3 kb.',
      'Trim adapters before assembly. Residual adapter creates spurious contig-end overlaps that can produce false circularisation.',
    ],
    tools: ['Filtlong', 'chopper', 'Porechop_ABI', 'NanoPlot', 'seqkit'],
    act: 'Continue to QC →', next: 'qc_final',
  },

  filter_metagenome: {
    id: 'filter_metagenome', step: 6, total: 7, type: 'rec',
    cat: 'METAGENOME FILTERING', title: 'Filtering for Metagenomes',
    tagline: 'Filter gently — in a metagenome, an unusual read is often a rare organism rather than an error.',
    pts: [
      'Use a lower length cutoff than for isolate assembly — 500 bp to 1 kb. Small plasmids and mobile elements are genuinely short and are lost by aggressive cutoffs.',
      'Filter at Q10 and no higher. Quality filtering is not taxon-neutral: high-GC and low-abundance organisms are stripped first, which quietly biases community composition.',
      'Never use Filtlong percentage-based retention on metagenomes. It preferentially keeps reads from abundant taxa and will erase the rare biosphere you are trying to observe.',
      'Remove host reads before assembly for host-associated samples — map to the host genome with Minimap2 and keep the unmapped fraction.',
      'Assemble with Flye in --meta mode, which expects uneven coverage rather than assuming a single genome.',
      'Keep an unfiltered copy. Differential-coverage binning is more accurate when reads are mapped back without a quality filter applied.',
    ],
    tools: ['chopper', 'Minimap2 (host depletion)', 'Flye --meta', 'NanoPlot', 'CoverM'],
    act: 'Continue to QC →', next: 'qc_final',
  },

  filter_variant: {
    id: 'filter_variant', step: 6, total: 7, type: 'rec',
    cat: 'VARIANT FILTERING', title: 'Filtering for Variant Calling',
    tagline: 'Here per-read quality is the whole game — filter hard and lean on depth.',
    pts: [
      'Filter at Q15 or above for simplex sup reads. Unlike assembly, there is no consensus step downstream to rescue a poor read.',
      'Use duplex reads where you have them. Q30+ per-read accuracy roughly halves the depth needed for a confident call.',
      'Aim for 50× or more at every position you intend to call, not on average — coverage is uneven and the average hides the gaps.',
      'Call with a Nanopore-aware caller. Clair3 and DeepVariant model the ONT error profile; callers built for Illumina assume errors that Nanopore does not make.',
      'Treat indels in homopolymers with suspicion and confirm them against short reads where the result matters.',
      'For amplicon consensus, cluster then polish rather than calling variants directly — Medaka is built for exactly this.',
    ],
    tools: ['chopper', 'Clair3', 'DeepVariant (ONT models)', 'Medaka', 'Longshot'],
    act: 'Continue to QC →', next: 'qc_final',
  },

  qc_final: {
    id: 'qc_final', step: 7, total: 7, type: 'info',
    cat: 'QUALITY CONTROL', title: 'Verify Before You Assemble',
    body: 'Check the filtered read set before committing to a long assembly. Read N50, modal quality and the yield-versus-length curve tell you within a minute whether the run supports what you are about to attempt.',
    cmd: '# Adapter trim, then filter, then assess\nporechop_abi -i calls.fastq -o trimmed.fastq --threads 16\n\n# chopper: quality + length in one pass\nchopper -q 10 -l 1000 --threads 16 < trimmed.fastq > filtered.fastq\n\n# Filtlong alternative — keeps the best 90% weighted toward length\nfiltlong --min_length 1000 --keep_percent 90 trimmed.fastq > filtered.fastq\n\n# QC report: read N50, modal Q, yield-over-length\nNanoPlot --fastq filtered.fastq -o nanoplot_out --loglength --N50\n\n# Quick numbers without the plots\nseqkit stats -a filtered.fastq',
    tbl: [
      { v: 'Read N50 >20 kb', m: 'Excellent — expect a closed chromosome from a clean isolate', s: 'c-g' },
      { v: 'Read N50 10–20 kb', m: 'Good — most repeats resolve', s: 'c-g' },
      { v: 'Read N50 5–10 kb', m: 'Workable — rDNA operons may not resolve', s: 'c-y' },
      { v: 'Read N50 <5 kb', m: 'Poor — check DNA extraction; consider a hybrid approach', s: 'c-r' },
      { v: 'Modal Q >20', m: 'Consistent with R10.4.1 sup basecalling', s: 'c-g' },
      { v: 'Modal Q <15', m: 'Re-basecall at sup before going further', s: 'c-r' },
    ],
    caution: 'A low read N50 almost always traces back to DNA extraction rather than the sequencing itself. High-molecular-weight protocols and wide-bore tips matter more than any basecalling parameter.',
    tools: ['NanoPlot', 'pycoQC', 'seqkit', 'Filtlong', 'chopper', 'Porechop_ABI'],
    act: 'Generate my basecalling workflow →', next: '__hub__',
  },
};

/* ═══════════════════════════════════════════════════════════
   16 · 16S PRIMER SELECTION ADVISOR
   ═══════════════════════════════════════════════════════════ */
export const primerSelectionTree: DecisionTree = {
  sample_matrix: {
    id: 'sample_matrix', step: 1, total: 6, type: 'q',
    cat: 'SAMPLE MATRIX', title: 'Sample Type',
    q: 'What kind of sample are you amplifying from?',
    hint: 'The dominant off-target risk is set by the sample matrix, and it drives primer choice more than anything else',
    opts: [
      { id: 'env_water', label: 'Seawater, freshwater or sediment', sub: 'Free-living bacteria and archaea; SAR11 coverage matters in marine work', next: 'target_domain' },
      { id: 'host_animal', label: 'Animal host-associated — gut, skin, tissue', sub: 'Host mitochondrial 18S/12S is the main off-target', next: 'target_domain' },
      { id: 'plant_algae', label: 'Plant, algal or photosynthetic host tissue', sub: 'Chloroplast and mitochondrial 16S can swamp the library', next: 'plant_offtarget', w: true },
      { id: 'sponge_inverts', label: 'Marine sponge or other invertebrate holobiont', sub: 'Dense symbiont community plus host organellar sequence', next: 'plant_offtarget' },
      { id: 'soil', label: 'Soil or rhizosphere', sub: 'Highest diversity of any common matrix; root material adds chloroplast', next: 'target_domain' },
    ],
  },

  plant_offtarget: {
    id: 'plant_offtarget', step: 1, total: 6, type: 'info',
    cat: 'OFF-TARGET RISK', title: 'Chloroplast and Mitochondrial Contamination',
    body: 'Chloroplasts and mitochondria are descended from bacteria, so their 16S is amplified by the universal primers that everyone uses. In photosynthetic tissue this is not a minor nuisance — organellar reads can dominate the library and leave you with a fraction of the bacterial depth you paid for.',
    tbl: [
      { v: 'Untreated plant tissue', m: 'Organellar reads commonly exceed half the library, sometimes far more', s: 'c-r' },
      { v: 'PNA clamps', m: 'Peptide nucleic acid blockers suppress chloroplast and mitochondrial amplification', s: 'c-g' },
      { v: '799F–1193R', m: 'Discriminating primer set — 799F sits at a chloroplast mismatch', s: 'c-g' },
      { v: 'In-silico removal', m: 'Filter after sequencing — works, but you already paid for the wasted reads', s: 'c-y' },
    ],
    caution: 'Removing organellar reads bioinformatically is not equivalent to blocking them at PCR. If half your reads are chloroplast, your effective sequencing depth is half what you planned, and rare taxa disappear.',
    tools: ['PNA clamps (pPNA / mPNA)', '799F–1193R primer set', 'QIIME2 (filter-features)', 'SILVA (organellar reference)'],
    act: 'Continue to target selection →', next: 'target_domain',
  },

  target_domain: {
    id: 'target_domain', step: 2, total: 6, type: 'q',
    cat: 'TARGET DOMAIN', title: 'Which Domains Must Be Covered?',
    q: 'What do you need to detect?',
    hint: 'No primer pair is genuinely universal — every choice trades coverage of one group against another',
    opts: [
      { id: 'bact_only', label: 'Bacteria only', sub: 'The common case for gut, soil and most host-associated work', next: 'read_platform' },
      { id: 'bact_arch', label: 'Bacteria and archaea together', badge: 'Broad', sub: 'Sediment, anaerobic digesters, hydrothermal and deep-sea samples', next: 'archaea_note', hi: true },
      { id: 'arch_only', label: 'Archaea specifically', sub: 'Requires archaea-targeted primers to reach useful sensitivity', next: 'archaea_note' },
      { id: 'species_res', label: 'Species-level resolution is essential', sub: 'Short regions cannot deliver this — needs full-length 16S', next: 'full_length_rec' },
    ],
  },

  archaea_note: {
    id: 'archaea_note', step: 2, total: 6, type: 'info',
    cat: 'ARCHAEAL COVERAGE', title: 'Getting Archaea Into the Library',
    body: 'The classic V3–V4 primer pair covers archaea poorly. If archaea are part of the question, the primer choice must be made deliberately at the start — it cannot be corrected afterwards.',
    tbl: [
      { v: '515F-Y / 926R', m: 'Parada–Apprill; good bacterial and archaeal coverage, V4–V5', s: 'c-g' },
      { v: '515F / 806rB', m: 'Earth Microbiome Project standard; 806rB fixes the SAR11 bias', s: 'c-g' },
      { v: '341F / 805R', m: 'Classic V3–V4; poor archaeal coverage', s: 'c-r' },
      { v: 'A519F / 1041R', m: 'Archaea-specific — highest sensitivity if bacteria are not needed', s: 'c-g' },
    ],
    caution: 'The original 806R primer under-recovers SAR11, one of the most abundant clades in the ocean. Use 806rB (Apprill) for any marine work — this is a well-documented bias, not a subtle effect.',
    tools: ['515F-Y/926R (Parada 2016)', '515F/806rB (Apprill 2015)', 'SILVA TestPrime (in-silico coverage check)'],
    act: 'Continue to platform →', next: 'read_platform',
  },

  full_length_rec: {
    id: 'full_length_rec', step: 3, total: 6, type: 'rec',
    cat: 'FULL-LENGTH 16S', title: 'Full-Length 16S for Species Resolution',
    tagline: 'Short hypervariable regions cannot resolve species. If that is the requirement, sequence the whole gene.',
    pts: [
      'Amplify the full gene with 27F–1492R, roughly 1,500 bp, covering V1 through V9.',
      'Sequence on PacBio HiFi for the highest consensus accuracy, or Nanopore R10.4.1 with sup basecalling as a more accessible alternative.',
      'Expect species-level assignment for many taxa — but not all. Some genera, notably Bacillus and several Enterobacteriaceae, have near-identical 16S across distinct species and will never separate on this gene alone.',
      'Where 16S saturates, the answer is a different marker or shotgun sequencing, not more 16S depth.',
      'Process with DADA2 in its PacBio mode, or with an ONT-aware clustering approach — the short-read denoising defaults do not transfer.',
      'If you need strain-level resolution, stop considering amplicons altogether and go to shotgun metagenomics.',
    ],
    tools: ['27F/1492R', 'PacBio HiFi', 'Nanopore R10.4.1 (16S kit)', 'DADA2 (PacBio mode)', 'Emu', 'NanoCLUST'],
    act: 'Continue to platform →', next: 'read_platform',
  },

  read_platform: {
    id: 'read_platform', step: 3, total: 6, type: 'q',
    cat: 'SEQUENCING PLATFORM', title: 'Sequencing Platform and Read Length',
    q: 'Which platform and read configuration will you run?',
    hint: 'Amplicon length must fit inside the read length with real overlap to spare, or merging fails',
    opts: [
      { id: 'miseq_300', label: 'Illumina MiSeq 2×300 (v3)', badge: 'Common', sub: 'Supports V3–V4 at ~460 bp with adequate overlap', next: 'region_v3v4', hi: true },
      { id: 'miseq_250', label: 'Illumina 2×250', sub: 'Best paired with the shorter V4 region', next: 'region_v4' },
      { id: 'nextseq_150', label: 'Illumina 2×150 (NextSeq / NovaSeq)', sub: 'Only V4 merges reliably at this read length', next: 'region_v4_short', w: true },
      { id: 'long_read', label: 'Nanopore or PacBio', sub: 'Full-length 16S', next: 'full_length_rec' },
    ],
  },

  region_v3v4: {
    id: 'region_v3v4', step: 4, total: 6, type: 'rec',
    cat: 'V3–V4 REGION', title: 'V3–V4 — 341F / 805R',
    tagline: 'The most widely published choice. Best comparability, with known blind spots.',
    pts: [
      'Amplicon is roughly 460 bp, which merges comfortably on 2×300 with about 100 bp of overlap.',
      'The genus-level resolution is good, and the huge body of published V3–V4 datasets makes cross-study comparison straightforward.',
      'Archaeal coverage is poor. If archaea matter at all, switch to 515F-Y/926R instead.',
      'Bifidobacterium is systematically under-detected by this pair — a serious problem for infant gut and any probiotic-focused study.',
      'Trim primers before denoising. Leaving them in place causes DADA2 to model primer sequence as biological variation.',
      'Truncate on the quality profile, not by habit — but never so short that the overlap drops below about 20 bp after truncation.',
    ],
    tools: ['341F/805R (Klindworth 2013)', 'DADA2', 'QIIME2', 'Cutadapt', 'SILVA 138.2', 'figaro (truncation)'],
    act: 'Continue to validation →', next: 'insilico_check',
  },

  region_v4: {
    id: 'region_v4', step: 4, total: 6, type: 'rec',
    cat: 'V4 REGION', title: 'V4 — 515F / 806rB',
    tagline: 'The least biased short region, and the Earth Microbiome Project standard.',
    pts: [
      'Amplicon is about 253 bp, giving generous overlap on 2×250 and merging very reliably.',
      'Coverage across bacteria and archaea is the most even of any short region, which is why EMP standardised on it.',
      'Use 806rB rather than the original 806R — the original under-recovers SAR11 and is a documented marine bias.',
      'Compatibility with EMP protocols means your data can be compared against a very large public corpus.',
      'Genus-level resolution is slightly below V3–V4 for a few groups; this is the price of the more even coverage.',
      'Because the amplicon is short and overlap is large, this is the most robust option when DNA quality is uneven.',
    ],
    tools: ['515F/806rB (Apprill 2015)', 'DADA2', 'QIIME2', 'SILVA 138.2', 'Greengenes2'],
    act: 'Continue to validation →', next: 'insilico_check',
  },

  region_v4_short: {
    id: 'region_v4_short', step: 4, total: 6, type: 'info',
    cat: 'SHORT READ CONSTRAINT', title: '2×150 — V4 Only',
    body: 'At 2×150 the only standard region that merges with dependable overlap is V4. A 460 bp V3–V4 amplicon cannot be merged from 150 bp reads: after primer and quality trimming the two mates simply do not meet.',
    tbl: [
      { v: 'V4 (253 bp)', m: 'Merges with roughly 45 bp overlap — safe on 2×150', s: 'c-g' },
      { v: 'V3–V4 (460 bp)', m: 'Cannot merge at 2×150 — the mates do not overlap', s: 'c-r' },
      { v: 'Forward-only fallback', m: 'Possible for V3–V4 but discards the reverse read and its resolution', s: 'c-y' },
      { v: 'Alternative', m: 'Move to 2×250 or 2×300 if V3–V4 is required for comparability', s: 'c-g' },
    ],
    caution: 'Check the arithmetic before sequencing, not after. Amplicon length minus twice the read length gives the overlap: negative means the merge is impossible and no software setting will rescue it.',
    act: 'Use V4 and continue →', next: 'region_v4',
  },

  insilico_check: {
    id: 'insilico_check', step: 5, total: 6, type: 'info',
    cat: 'IN-SILICO VALIDATION', title: 'Test Your Primers Before You Order Them',
    body: 'Primer coverage can be checked computationally against a reference database in a few minutes. Doing this before ordering oligos is the cheapest possible way to discover that your chosen pair misses the clade you care about.',
    cmd: '# SILVA TestPrime — coverage per taxonomic group, allowing mismatches\n#   https://www.arb-silva.de/search/testprime/\n#   Enter both primers, choose the SILVA SSU release, allow 0-1 mismatch\n\n# Local check against a reference set\ncutadapt -g ^GTGYCAGCMGCCGCGGTAA \\\n         -G ^GGACTACNVGGGTWTCTAAT \\\n         --discard-untrimmed -o /dev/null -p /dev/null \\\n         silva_ref_R1.fq silva_ref_R2.fq 2> coverage_report.txt\n\n# Verify amplicon length before committing to a read configuration\nseqkit amplicon -F GTGYCAGCMGCCGCGGTAA -R GGACTACNVGGGTWTCTAAT \\\n  -r 1:-1 reference_16S.fasta | seqkit stats',
    tbl: [
      { v: '>90% coverage', m: 'Good for the target group — proceed', s: 'c-g' },
      { v: '70–90% coverage', m: 'Acceptable; state the known gaps in your methods', s: 'c-y' },
      { v: '<70% coverage', m: 'Choose a different pair — this will distort your community profile', s: 'c-r' },
      { v: 'Mismatch position', m: 'A mismatch in the final five 3′ bases is far more damaging than one at the 5′ end', s: 'c-r' },
    ],
    caution: 'Always include a mock community and a negative extraction control on every run. Low-biomass samples are especially vulnerable to reagent contamination, and without a blank you cannot distinguish a real rare taxon from kit contamination.',
    tools: ['SILVA TestPrime', 'Cutadapt', 'seqkit amplicon', 'ZymoBIOMICS mock community', 'decontam (R)'],
    act: 'Continue to the final checklist →', next: 'primer_checklist',
  },

  primer_checklist: {
    id: 'primer_checklist', step: 6, total: 6, type: 'checklist',
    cat: 'AMPLICON DESIGN CHECKLIST', title: 'Pre-Sequencing Checklist',
    intro: 'Work through this before submitting libraries. Every item here is far cheaper to fix now than after sequencing.',
    items: [
      { id: 'coverage', label: 'Primer coverage validated in silico against SILVA for the target groups', required: true, tip: 'SILVA TestPrime, allowing 0–1 mismatch' },
      { id: 'overlap', label: 'Amplicon length confirmed to merge at the chosen read length', required: true, tip: 'Amplicon length minus twice the read length should leave at least 20 bp of overlap' },
      { id: 'offtarget', label: 'Off-target risk assessed — chloroplast, mitochondria, host', required: true },
      { id: 'archaea', label: 'Archaeal coverage checked if archaea are part of the question', required: false },
      { id: 'mock', label: 'Mock community included on the run', required: true, tip: 'The only way to measure your own pipeline bias' },
      { id: 'blank', label: 'Negative extraction and PCR blanks included', required: true, tip: 'Essential for low-biomass samples; feeds decontam downstream' },
      { id: 'cycles', label: 'PCR cycle number kept as low as the template allows', required: true, tip: 'Excess cycles amplify chimeras and skew abundance' },
      { id: 'replicates', label: 'Technical replicates planned for at least a subset of samples', required: false },
      { id: 'db', label: 'Reference database and version chosen and recorded', required: true, tip: 'SILVA 138.2 or Greengenes2 — record the exact version in your methods' },
      { id: 'primers_recorded', label: 'Full primer sequences and citations recorded for the methods section', required: true },
      { id: 'randomised', label: 'Samples randomised across extraction and PCR batches', required: false, tip: 'Prevents batch effects from aliasing onto your biological variable' },
    ],
    scoring: {
      low: 'High risk — resolve these before sequencing',
      mid: 'Gaps remain in the design',
      high: 'Nearly ready — close the last items',
      top: 'Design validated — ready to sequence',
    },
    next: '__hub__',
  },
};

/* ═══════════════════════════════════════════════════════════
   17 · METADATA & MIMARKS COMPLIANCE CHECKER
   ═══════════════════════════════════════════════════════════ */
export const metadataComplianceTree: DecisionTree = {
  submission_type: {
    id: 'submission_type', step: 1, total: 5, type: 'q',
    cat: 'SUBMISSION TYPE', title: 'What Are You Submitting?',
    q: 'What kind of data are you depositing?',
    hint: 'The submission type selects the MIxS checklist, which in turn fixes the mandatory fields',
    opts: [
      { id: 'isolate', label: 'Cultured isolate genome', sub: 'MIGS-BA — bacterial or archaeal isolate', next: 'repository' },
      { id: 'metagenome', label: 'Metagenome or metatranscriptome', sub: 'MIMS — environmental shotgun sequencing', next: 'repository' },
      { id: 'amplicon', label: 'Amplicon survey — 16S, 18S, ITS', sub: 'MIMARKS-survey', next: 'repository' },
      { id: 'mag', label: 'Metagenome-assembled genome (MAG)', sub: 'MIMAG — additional quality fields apply', next: 'repository' },
    ],
  },

  repository: {
    id: 'repository', step: 2, total: 5, type: 'q',
    cat: 'REPOSITORY', title: 'Target Repository',
    q: 'Where are you submitting?',
    hint: 'The three INSDC members share data nightly, so submit once — but each has its own validator and quirks',
    opts: [
      { id: 'ncbi', label: 'NCBI — BioSample, SRA, GenBank', badge: 'Most common', sub: 'Strictest validator; rejects on format before a human sees it', next: 'field_formats', hi: true },
      { id: 'ena', label: 'ENA (EMBL-EBI)', sub: 'Checklist-driven; often more forgiving on controlled vocabulary', next: 'field_formats' },
      { id: 'ddbj', label: 'DDBJ', sub: 'INSDC member; mirrors to NCBI and ENA', next: 'field_formats' },
    ],
  },

  field_formats: {
    id: 'field_formats', step: 3, total: 5, type: 'info',
    cat: 'FIELD FORMATS', title: 'The Formats That Cause Rejections',
    body: 'Most submission rejections are not scientific problems — they are four or five fields written in the wrong format. The validator is literal, and it will not guess what you meant.',
    tbl: [
      { v: 'collection_date', m: 'ISO 8601 only: 2026-03-14, or 2026-03, or 2026. Never 14/03/2026', s: 'c-r' },
      { v: 'lat_lon', m: 'Decimal degrees with compass letters: 15.45 N 73.80 E. Not signed decimals', s: 'c-r' },
      { v: 'geo_loc_name', m: 'INSDC country from the controlled list, then a colon: India: Goa, Grande Island', s: 'c-r' },
      { v: 'env_broad_scale', m: 'ENVO term with its ID: marine biome [ENVO:00000447]', s: 'c-y' },
      { v: 'env_local_scale', m: 'ENVO term: coastal water body [ENVO:02000049]', s: 'c-y' },
      { v: 'env_medium', m: 'ENVO term: sea water [ENVO:00002149]', s: 'c-y' },
      { v: 'Missing values', m: 'Only INSDC null terms are accepted — never blank, never N/A', s: 'c-r' },
    ],
    caution: 'The three environmental fields must be genuinely different in scale — biome, then local feature, then the material actually sampled. Repeating the same ENVO term across all three is the most common reviewer complaint, and NCBI increasingly flags it too.',
    tools: ['ENVO browser (ontobee.org)', 'INSDC country list', 'NCBI BioSample validator', 'ENA checklist validator'],
    act: 'Continue to null values →', next: 'null_values',
  },

  null_values: {
    id: 'null_values', step: 4, total: 5, type: 'info',
    cat: 'MISSING VALUES', title: 'How to Say "I Do Not Have This"',
    body: 'A mandatory field you genuinely cannot fill must still contain something — but it has to be one of the recognised INSDC null values. Anything else, including an empty cell, fails validation. Choosing the right null term also tells a reader why the value is absent, which is information in itself.',
    tbl: [
      { v: 'not collected', m: 'The measurement was never taken', s: 'c-g' },
      { v: 'not applicable', m: 'The field is meaningless for this sample type', s: 'c-g' },
      { v: 'missing', m: 'It was taken but the record is lost', s: 'c-y' },
      { v: 'not provided', m: 'Withheld at submission time', s: 'c-y' },
      { v: 'restricted access', m: 'Withheld for privacy or legal reasons — normal for human subjects', s: 'c-g' },
      { v: 'N/A, NA, -, blank', m: 'All rejected by the validator', s: 'c-r' },
    ],
    caution: 'Do not reach for a null value on collection_date, lat_lon or the environmental triad if you can avoid it. These are the fields that make a sample reusable by anyone else, and a deposit without them has limited value to the community even when it passes validation.',
    act: 'Continue to the compliance checklist →', next: 'compliance_checklist',
  },

  compliance_checklist: {
    id: 'compliance_checklist', step: 5, total: 5, type: 'checklist',
    cat: 'MIxS COMPLIANCE CHECKLIST', title: 'Pre-Submission Compliance Check',
    intro: 'Work through this before you upload. Each item corresponds to a documented rejection cause.',
    items: [
      { id: 'date_iso', label: 'collection_date in ISO 8601 format', required: true, tip: 'YYYY-MM-DD, YYYY-MM or YYYY — anything else is rejected' },
      { id: 'latlon', label: 'lat_lon in decimal degrees with compass letters', required: true, tip: 'e.g. 15.4909 N 73.8278 E' },
      { id: 'geoloc', label: 'geo_loc_name uses an INSDC country name plus region', required: true, tip: 'Country must match the controlled list exactly' },
      { id: 'envo_triad', label: 'All three env_* fields populated with distinct ENVO terms', required: true, tip: 'Broad biome, local feature, and sampled medium — three different scales' },
      { id: 'envo_ids', label: 'ENVO accession IDs included alongside the labels', required: false, tip: 'e.g. sea water [ENVO:00002149]' },
      { id: 'package', label: 'Correct BioSample package selected for the sample type', required: true, tip: 'MIMS.me, MIMARKS.survey, MIGS.ba or Microbe' },
      { id: 'nulls', label: 'Every empty mandatory field carries a valid INSDC null value', required: true },
      { id: 'source', label: 'isolation_source or host recorded', required: true },
      { id: 'depth_alt', label: 'depth or altitude recorded where relevant', required: false, tip: 'Effectively mandatory for marine and soil samples in practice' },
      { id: 'seq_meth', label: 'seq_meth and the sequencing platform recorded', required: true },
      { id: 'lib_strategy', label: 'Library strategy, source and selection set correctly in SRA', required: true, tip: 'AMPLICON vs WGS vs RNA-Seq — a wrong value here misfiles your run' },
      { id: 'bioproject', label: 'BioProject created and all BioSamples linked to it', required: true },
      { id: 'unique_names', label: 'Every sample_name unique within the submission', required: true },
      { id: 'primers_recorded', label: 'Target gene, subfragment and primer sequences recorded for amplicon runs', required: false, tip: 'Mandatory under MIMARKS-survey' },
      { id: 'mag_quality', label: 'MAG completeness, contamination and MIMAG tier recorded', required: false, tip: 'MAG submissions only — CheckM2 values plus the assembly software' },
      { id: 'checked_validator', label: 'Passed the repository validator on a test submission', required: true },
    ],
    scoring: {
      low: 'Will be rejected — critical fields missing',
      mid: 'Several rejection risks remain',
      high: 'Close — resolve the last items',
      top: 'MIxS compliant — ready to submit',
    },
    next: '__hub__',
  },
};

/* ═══════════════════════════════════════════════════════════
   18 · STATISTICAL POWER CALCULATOR
   ═══════════════════════════════════════════════════════════ */
export const statisticalPowerTree: DecisionTree = {
  analysis_target: {
    id: 'analysis_target', step: 1, total: 6, type: 'q',
    cat: 'ANALYSIS TYPE', title: 'What Are You Powering For?',
    q: 'Which analysis is the primary endpoint of the study?',
    hint: 'Power depends entirely on the test — a design that is well powered for beta diversity can be badly underpowered for differential abundance',
    opts: [
      { id: 'beta', label: 'Community composition — PERMANOVA on beta diversity', badge: 'Common', sub: '"Do these groups have different microbiomes?"', next: 'beta_effect', hi: true },
      { id: 'alpha', label: 'Alpha diversity comparison', sub: '"Is one group more diverse?" — a univariate test', next: 'alpha_power' },
      { id: 'diffabund', label: 'Differential abundance of individual taxa', sub: '"Which taxa differ?" — the most demanding endpoint', next: 'da_power' },
      { id: 'longitudinal', label: 'Longitudinal or repeated-measures design', sub: 'Subjects sampled at multiple timepoints', next: 'longitudinal_power' },
    ],
  },

  beta_effect: {
    id: 'beta_effect', step: 2, total: 6, type: 'q',
    cat: 'EFFECT SIZE', title: 'Expected Effect Size',
    q: 'How large a difference between groups do you expect?',
    hint: 'In PERMANOVA the effect size is R² — the proportion of compositional variance explained by your grouping variable',
    opts: [
      { id: 'large_eff', label: 'Large — R² above 0.15', sub: 'Gut versus soil, healthy versus severely diseased, distinct habitats', next: 'beta_table' },
      { id: 'med_eff', label: 'Moderate — R² around 0.05 to 0.15', sub: 'Diet intervention, treatment response, seasonal shift', next: 'beta_table' },
      { id: 'small_eff', label: 'Small — R² below 0.05', sub: 'Subtle host factors, mild exposures, most observational studies', next: 'beta_table', w: true },
      { id: 'unknown_eff', label: 'I have no prior estimate', sub: 'Derive one from pilot data or a comparable published study', next: 'pilot_guidance' },
    ],
  },

  pilot_guidance: {
    id: 'pilot_guidance', step: 2, total: 6, type: 'info',
    cat: 'ESTIMATING EFFECT SIZE', title: 'Getting an Effect Size Before You Have Data',
    body: 'Power analysis needs an effect size, and you cannot get one from the study you have not run. There are three defensible sources, in descending order of quality.',
    tbl: [
      { v: 'Pilot data', m: 'Best. Run PERMANOVA on 8–10 samples per group and read R² directly', s: 'c-g' },
      { v: 'Published study', m: 'Good. Take R² from the closest comparable system and discount it', s: 'c-g' },
      { v: 'Public repository', m: 'Reanalyse a similar dataset from Qiita or MGnify to estimate R²', s: 'c-g' },
      { v: 'Assume moderate', m: 'Last resort. Power for R² = 0.05 and accept the cost', s: 'c-y' },
    ],
    caution: 'Effect sizes taken from published work are systematically optimistic — publication bias selects for large effects. Discount a literature R² by roughly a third before planning around it.',
    tools: ['vegan::adonis2 (R)', 'micropower (R)', 'Qiita', 'MGnify', 'curatedMetagenomicData'],
    act: 'Continue to the sample size table →', next: 'beta_table',
  },

  beta_table: {
    id: 'beta_table', step: 3, total: 6, type: 'info',
    cat: 'PERMANOVA POWER', title: 'Samples Needed for PERMANOVA',
    body: 'These are per-group sample sizes for roughly 80% power at alpha = 0.05, two balanced groups, using Bray–Curtis dissimilarity with 999 permutations. Treat them as a planning floor rather than a precise answer — real power depends on dispersion, which varies enormously between systems.',
    tbl: [
      { v: 'R² ≥ 0.20', m: 'About 8–10 per group', s: 'c-g' },
      { v: 'R² ≈ 0.15', m: 'About 12–15 per group', s: 'c-g' },
      { v: 'R² ≈ 0.10', m: 'About 20–25 per group', s: 'c-g' },
      { v: 'R² ≈ 0.05', m: 'About 45–60 per group', s: 'c-y' },
      { v: 'R² ≈ 0.02', m: 'Well over 100 per group — reconsider the design', s: 'c-r' },
      { v: 'Minimum floor', m: 'Never fewer than 6 per group regardless of expected effect', s: 'c-r' },
    ],
    caution: 'PERMANOVA conflates location and dispersion: a significant result can mean the groups differ in spread rather than in centroid. Always run betadisper alongside it and report both, or your headline finding may be an artefact of unequal variance.',
    tools: ['vegan::adonis2', 'vegan::betadisper', 'micropower', 'GUniFrac'],
    act: 'Continue to confounders →', next: 'confounders',
  },

  alpha_power: {
    id: 'alpha_power', step: 2, total: 6, type: 'info',
    cat: 'ALPHA DIVERSITY POWER', title: 'Powering an Alpha Diversity Comparison',
    body: 'Alpha diversity reduces each sample to a single number, so ordinary univariate power analysis applies. Effect size is Cohen\'s d — the difference in means divided by the pooled standard deviation.',
    tbl: [
      { v: "d = 1.2 (very large)", m: 'About 12 per group', s: 'c-g' },
      { v: "d = 0.8 (large)", m: 'About 26 per group', s: 'c-g' },
      { v: "d = 0.5 (moderate)", m: 'About 64 per group', s: 'c-y' },
      { v: "d = 0.3 (small)", m: 'About 175 per group', s: 'c-r' },
      { v: 'Rarefaction', m: 'Rarefy to even depth, or richness differences are sequencing artefacts', s: 'c-r' },
      { v: 'Metric choice', m: 'Shannon is less depth-sensitive than observed richness — prefer it if depth varies', s: 'c-g' },
    ],
    caution: 'Observed richness is strongly driven by sequencing depth. Comparing richness across samples of unequal depth measures your library prep, not your biology. Rarefy, or use a depth-robust metric such as Shannon or Faith PD on rarefied data.',
    cmd: '# Two-sample power in R\npower.t.test(delta = 0.5, sd = 1, sig.level = 0.05, power = 0.8)\n#   n = 63.8 per group\n\n# From pilot data — compute d, then the required n\nd <- (mean(g1) - mean(g2)) / sqrt(((sd(g1)^2 + sd(g2)^2) / 2))\npower.t.test(delta = d, sd = 1, sig.level = 0.05, power = 0.8)',
    tools: ['pwr (R)', 'power.t.test (base R)', 'vegan::diversity', 'phyloseq'],
    act: 'Continue to confounders →', next: 'confounders',
  },

  da_power: {
    id: 'da_power', step: 2, total: 6, type: 'info',
    cat: 'DIFFERENTIAL ABUNDANCE POWER', title: 'Powering Differential Abundance',
    body: 'Differential abundance is the most demanding common endpoint, because you are running hundreds of tests at once and must correct for all of them. The multiple-testing penalty, not the per-taxon effect, is usually what determines your sample size.',
    tbl: [
      { v: 'Tests performed', m: 'Typically 200–800 taxa after prevalence filtering', s: 'c-y' },
      { v: 'Correction', m: 'Benjamini–Hochberg FDR at q < 0.05 is the field standard', s: 'c-g' },
      { v: 'Large fold-change', m: '4-fold or more in common taxa: about 15–20 per group', s: 'c-g' },
      { v: 'Moderate fold-change', m: '2-fold in common taxa: about 30–50 per group', s: 'c-y' },
      { v: 'Rare taxa', m: 'Under 1% prevalence: often 100+ per group, frequently not worth pursuing', s: 'c-r' },
      { v: 'Prevalence filter', m: 'Drop taxa present in under 10–20% of samples before testing', s: 'c-g' },
    ],
    caution: 'Filtering taxa before testing is not cherry-picking — it is a legitimate and necessary power move, provided the filter is defined by prevalence and applied blind to group labels. Deciding what to filter after seeing the results is a different thing entirely, and it is not defensible.',
    tools: ['ANCOM-BC2', 'ALDEx2', 'DESeq2', 'MaAsLin2', 'LinDA', 'phyloseq::filter_taxa'],
    act: 'Continue to confounders →', next: 'confounders',
  },

  longitudinal_power: {
    id: 'longitudinal_power', step: 2, total: 6, type: 'rec',
    cat: 'LONGITUDINAL DESIGN', title: 'Repeated Measures — Fewer Subjects, More Samples',
    tagline: 'Each subject becomes their own control, which buys you a great deal of power.',
    pts: [
      'Within-subject designs remove between-subject variation, which in microbiome data is usually the dominant variance component. This is a large gain, not a marginal one.',
      'As a planning rule, a paired design needs roughly half the subjects of the equivalent two-group comparison for the same power.',
      'Three or more timepoints per subject let you separate a trajectory from a single displacement, which is almost always the more interesting result.',
      'Model with subject as a random effect — a linear mixed model or GEE. Ignoring the pairing and running an ordinary test inflates your false positive rate.',
      'For PERMANOVA on repeated measures, constrain permutations within subject using a strata term, or the test is invalid.',
      'Budget for dropout. Longitudinal microbiome studies commonly lose 10–20% of subjects, and unbalanced panels lose power quickly.',
      'Baseline samples are worth collecting even when they are not part of the question — they turn a between-group comparison into a change-from-baseline one.',
    ],
    tools: ['lme4 / lmerTest (R)', 'MaAsLin2 (random effects)', 'vegan::adonis2 (strata)', 'q2-longitudinal', 'nlme'],
    act: 'Continue to confounders →', next: 'confounders',
  },

  confounders: {
    id: 'confounders', step: 4, total: 6, type: 'ms',
    cat: 'CONFOUNDERS', title: 'Confounders to Record',
    q: 'Which of these apply to your study?',
    note: 'Every variable selected must be recorded per sample, and each one you intend to adjust for costs you degrees of freedom — so budget sample size accordingly',
    alwaysLabel: 'Sequencing batch and run (always record)',
    alwaysSub: 'Batch is the single most common hidden confounder in microbiome studies and the easiest to defeat by randomising',
    opts: [
      { id: 'extraction', label: 'DNA extraction kit and batch', tools: ['Record kit lot'], sub: 'Extraction chemistry changes observed composition more than most biological effects' },
      { id: 'storage', label: 'Storage time and temperature', tools: ['Record freeze-thaw cycles'], sub: 'Freeze-thaw shifts community profiles measurably' },
      { id: 'host_demo', label: 'Host age, sex and BMI', tools: ['Host metadata'], sub: 'Standard covariates in host-associated studies' },
      { id: 'diet_med', label: 'Diet and medication, especially antibiotics', tools: ['Exposure questionnaire'], sub: 'Recent antibiotics can dominate every other signal in the study' },
      { id: 'spatial', label: 'Site, depth or spatial location', tools: ['GPS', 'depth'], sub: 'Environmental studies — space frequently explains more variance than treatment' },
      { id: 'temporal', label: 'Season or collection date', tools: ['ISO 8601 date'], sub: 'Seasonal turnover can exceed the treatment effect entirely' },
      { id: 'physchem', label: 'Physicochemical measurements — pH, salinity, temperature', tools: ['Field meter readings'], sub: 'pH is often the strongest single predictor in soil and sediment' },
    ],
    next: 'power_summary',
  },

  power_summary: {
    id: 'power_summary', step: 5, total: 6, type: 'rec',
    cat: 'DESIGN PRINCIPLES', title: 'Getting the Most From a Fixed Budget',
    tagline: 'Sample size beats sequencing depth for almost every ecological question.',
    pts: [
      'Given a fixed budget, more samples at moderate depth will nearly always outperform fewer samples sequenced deeply. Depth improves the picture of each sample; replication is what lets you generalise beyond them.',
      'For 16S surveys, 10,000 to 50,000 reads per sample is ample for community-level questions. Spending beyond that is usually better converted into additional samples.',
      'For shotgun metagenomics, aim for 5 to 10 Gb per sample for profiling; MAG recovery is a different question and needs 20 Gb or more.',
      'Randomise samples across extraction batches, plates and sequencing runs. If a batch happens to align with your treatment groups, no statistical adjustment can fully separate them afterwards.',
      'Include technical replicates on at least a subset of samples. They let you quantify how much of your variance is technical rather than biological — which reviewers increasingly ask for.',
      'Pre-register the primary endpoint and the analysis plan. Testing several endpoints and reporting the one that worked is a form of multiple testing that no FDR correction catches.',
      'Report the achieved power or the minimum detectable effect, not just the p-value. A non-significant result from an underpowered study is not evidence of absence, and saying so explicitly is more useful than leaving it implied.',
    ],
    tools: ['vegan (R)', 'pwr (R)', 'micropower', 'MaAsLin2', 'lme4', 'decontam'],
    act: 'Continue to the design checklist →', next: 'design_checklist',
  },

  design_checklist: {
    id: 'design_checklist', step: 6, total: 6, type: 'checklist',
    cat: 'STUDY DESIGN CHECKLIST', title: 'Pre-Study Design Checklist',
    intro: 'Complete this before collecting samples — after collection most of these items can no longer be fixed.',
    items: [
      { id: 'endpoint', label: 'Primary endpoint defined and stated in advance', required: true },
      { id: 'effect', label: 'Expected effect size estimated from pilot or published data', required: true },
      { id: 'n_calc', label: 'Sample size derived from a documented power calculation', required: true },
      { id: 'balanced', label: 'Groups balanced, or the imbalance accounted for in the power calculation', required: true },
      { id: 'randomised', label: 'Samples randomised across extraction and sequencing batches', required: true, tip: 'The highest-value, lowest-cost design decision available to you' },
      { id: 'controls', label: 'Negative extraction and PCR blanks included', required: true },
      { id: 'mock', label: 'Positive mock community included', required: true },
      { id: 'metadata', label: 'Confounder metadata collected for every sample', required: true },
      { id: 'depth', label: 'Sequencing depth chosen to match the endpoint', required: true },
      { id: 'dropout', label: 'Attrition and sample failure allowed for in the target n', required: false, tip: 'Add 10–20% for longitudinal or field studies' },
      { id: 'analysis_plan', label: 'Analysis plan written before data collection', required: false, tip: 'Fixes the multiple-comparisons burden in advance' },
      { id: 'prereg', label: 'Study pre-registered', required: false },
    ],
    scoring: {
      low: 'High risk of an underpowered study',
      mid: 'Design gaps remain',
      high: 'Solid design — close the last items',
      top: 'Well-powered and pre-specified',
    },
    next: '__hub__',
  },
};
