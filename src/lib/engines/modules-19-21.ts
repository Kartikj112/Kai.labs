// ─────────────────────────────────────────────────────────────
//  KAI Decision Engine — Modules 19–21
//    19. AMP / Peptide Discovery Pipeline Wizard  (amp-discovery)
//    20. dDDH & Novel Species Description         (novel-species)
//    21. Computational Resource Estimator         (compute-estimator)
// ─────────────────────────────────────────────────────────────

import type { DecisionTree } from './types';

/* ═══════════════════════════════════════════════════════════
   19 · AMP / PEPTIDE DISCOVERY PIPELINE WIZARD
   ═══════════════════════════════════════════════════════════ */
export const ampDiscoveryTree: DecisionTree = {
  starting_material: {
    id: 'starting_material', step: 1, total: 8, type: 'q',
    cat: 'STARTING POINT', title: 'What Are You Starting From?',
    q: 'What material do you have in hand?',
    hint: 'The discovery route is set by your starting material — ribosomal and non-ribosomal peptides need completely different pipelines',
    opts: [
      { id: 'genome', label: 'Bacterial genome or genomes', badge: 'Genome mining', sub: 'Mine for RiPP clusters and bacteriocins', next: 'peptide_class', hi: true },
      { id: 'metagenome', label: 'Metagenome or MAG collection', sub: 'Large search space; uncultured taxa are the richest source', next: 'metagenome_route' },
      { id: 'transcriptome', label: 'Host transcriptome or proteome', sub: 'Eukaryotic host-defence peptides — a prediction problem, not a cluster problem', next: 'ml_prediction' },
      { id: 'denovo', label: 'No sequence — designing peptides de novo', sub: 'Generative design against a defined target', next: 'denovo_design' },
    ],
  },

  peptide_class: {
    id: 'peptide_class', step: 2, total: 8, type: 'q',
    cat: 'PEPTIDE CLASS', title: 'Target Peptide Class',
    q: 'Which class of peptide are you looking for?',
    hint: 'RiPPs are gene-encoded and found by cluster logic; NRPs are enzymatically assembled and found by domain logic',
    opts: [
      { id: 'ripp', label: 'RiPPs — ribosomally synthesised, post-translationally modified', badge: 'Gene-encoded', sub: 'Lanthipeptides, thiopeptides, lasso peptides, sactipeptides', next: 'ripp_mining', hi: true },
      { id: 'nrp', label: 'Non-ribosomal peptides (NRPS)', sub: 'Assembled by megasynthetase modules, not translated from mRNA', next: 'nrps_mining' },
      { id: 'bacteriocin', label: 'Classical bacteriocins', sub: 'Narrow-spectrum, often plasmid-encoded, frequently missed by standard tools', next: 'ripp_mining' },
      { id: 'unsure_class', label: 'Not sure — survey everything', sub: 'Run a broad scan first and triage afterwards', next: 'ripp_mining' },
    ],
  },

  ripp_mining: {
    id: 'ripp_mining', step: 3, total: 8, type: 'rec',
    cat: 'RiPP MINING', title: 'Mining RiPP Biosynthetic Clusters',
    tagline: 'The precursor peptide is short and poorly conserved — which is exactly why standard annotation misses it.',
    pts: [
      'Run antiSMASH 7 or later with the RiPP detection modules enabled. It finds the tailoring enzymes reliably, which is how RiPP clusters are located in practice.',
      'Follow with a RiPP-specialised tool. antiSMASH finds the cluster; DeepRiPP, RiPPMiner and decRiPPter are better at calling the precursor itself and predicting the mature product.',
      'Expect standard gene callers to miss precursors outright. They are frequently under 100 codons and fall below the default minimum ORF length in Prodigal and its relatives — re-call small ORFs explicitly.',
      'Rank candidates by novelty rather than by score. Compare each cluster against MIBiG 4.0 with BiG-SLiCE or clinker; a cluster with no close MIBiG relative is the interesting one.',
      'Use BiG-SCAPE to group clusters into gene cluster families across your genome set. Singletons and small families are where genuinely new chemistry sits.',
      'Look at the genomic context. RiPP clusters that sit near mobile elements or in genomic islands are often recently acquired and worth prioritising.',
      'For sponge and other holobiont material, remember that the producer is frequently an uncultured symbiont — bin the metagenome first so you can attribute the cluster to an organism.',
    ],
    tools: ['antiSMASH 7', 'DeepRiPP', 'RiPPMiner', 'decRiPPter', 'BiG-SCAPE', 'BiG-SLiCE', 'MIBiG 4.0', 'Prodigal (small ORF mode)'],
    act: 'Continue to candidate filtering →', next: 'physchem_filter',
  },

  nrps_mining: {
    id: 'nrps_mining', step: 3, total: 8, type: 'rec',
    cat: 'NRPS MINING', title: 'Mining Non-Ribosomal Peptide Synthetases',
    tagline: 'Read the assembly line: the domain architecture predicts the product.',
    pts: [
      'Run antiSMASH to identify NRPS and hybrid PKS-NRPS clusters and to extract the module architecture.',
      'Predict the substrate of each adenylation domain from its specificity-conferring code. NRPSpredictor2 and SANDPUMA give a provisional monomer sequence for the product.',
      'Treat the predicted structure as a hypothesis, not a result. A-domain specificity prediction is reliable for common proteinogenic substrates and considerably weaker for unusual ones.',
      'Check for trans-AT and iterative modules. Colinearity between module order and product sequence breaks in these systems, and naive prediction will be wrong.',
      'Compare against MIBiG. A cluster matching a known pathway at high identity is unlikely to yield new chemistry, however good the antiSMASH score looks.',
      'Confirm expression before investing in chemistry. Many clusters are silent under laboratory conditions — RNA-seq or proteomics tells you whether it is transcribed at all.',
      'Where a cluster is silent but promising, consider heterologous expression or an elicitation strategy rather than abandoning it.',
    ],
    tools: ['antiSMASH 7', 'NRPSpredictor2', 'SANDPUMA', 'PRISM 4', 'MIBiG 4.0', 'BiG-SCAPE', 'clinker'],
    act: 'Continue to candidate filtering →', next: 'physchem_filter',
  },

  metagenome_route: {
    id: 'metagenome_route', step: 2, total: 8, type: 'info',
    cat: 'METAGENOME MINING', title: 'Mining Peptides From Metagenomes',
    body: 'Metagenomes are the richest available source of novel antimicrobial peptides, precisely because most of the producing organisms have never been cultured. The trade-off is that assembly quality limits what you can find, and short contigs fragment the very clusters you are hunting.',
    tbl: [
      { v: 'Bin first', m: 'Attributing a cluster to a MAG makes the finding far more publishable', s: 'c-g' },
      { v: 'Assembly quality', m: 'BGCs are long; fragmented assemblies split clusters across contigs', s: 'c-y' },
      { v: 'Contig length', m: 'Require 5 kb or more for a credible RiPP cluster call', s: 'c-y' },
      { v: 'Read-based option', m: 'Short peptides can be found directly in reads when assembly fails', s: 'c-g' },
      { v: 'Long reads', m: 'Nanopore or PacBio metagenomes dramatically improve cluster recovery', s: 'c-g' },
    ],
    caution: 'Running antiSMASH on a fragmented short-read metagenome systematically under-reports clusters, and the ones it does report are often truncated. If BGC discovery is the goal of the study, that should drive the sequencing design from the start.',
    tools: ['MetaSPAdes', 'Flye --meta', 'antiSMASH (metagenome mode)', 'BiG-SLiCE', 'GECCO', 'DeepBGC', 'MetaBAT2'],
    act: 'Continue to peptide class →', next: 'peptide_class',
  },

  ml_prediction: {
    id: 'ml_prediction', step: 3, total: 8, type: 'rec',
    cat: 'ML PREDICTION', title: 'Predicting AMPs From a Proteome',
    tagline: 'Sequence-only classifiers are fast and cheap — and they over-predict, so treat the output as a shortlist.',
    pts: [
      'Run more than one classifier and take the intersection. Macrel, AMPlify, ampir and AMPScanner v2 were trained on different data and disagree in informative ways.',
      'Expect a high false-positive rate. These models were trained on small positive sets against an enormous negative space, so precision on a real proteome is far below the reported benchmark accuracy.',
      'Filter on physicochemistry before anything else. Net charge, hydrophobic fraction and amphipathicity eliminate a large share of implausible hits at no cost.',
      'Screen out sequences that are already characterised by searching APD3, DRAMP and dbAMP — rediscovering a known peptide is a common and avoidable outcome.',
      'For a host transcriptome, check that the candidate has a signal peptide. Genuine host-defence peptides are secreted, and SignalP is a strong discriminator.',
      'Rank by predicted activity and by novelty against known families, then take only a handful forward. Synthesis is the expensive step and it is where the funnel should narrow hard.',
    ],
    tools: ['Macrel', 'AMPlify', 'ampir', 'AMPScanner v2', 'APD3', 'DRAMP', 'dbAMP', 'SignalP 6.0'],
    act: 'Continue to candidate filtering →', next: 'physchem_filter',
  },

  denovo_design: {
    id: 'denovo_design', step: 3, total: 8, type: 'rec',
    cat: 'DE NOVO DESIGN', title: 'Generative Peptide Design',
    tagline: 'Generating candidates is now easy. Filtering them to something worth synthesising is the actual work.',
    pts: [
      'Generative models — VAEs, diffusion models and protein language models — can produce very large candidate sets quickly. Volume is not the bottleneck.',
      'Constrain generation with the physicochemical envelope that real AMPs occupy: net charge roughly +2 to +9, hydrophobic fraction around 30–50%, and 12–50 residues.',
      'Score every candidate for predicted haemolysis and cytotoxicity as a first-class filter, not an afterthought. Selectivity between bacterial and mammalian membranes is what separates a therapeutic from a detergent.',
      'Fold the survivors with AlphaFold or ESMFold, or PEP-FOLD4 for short peptides, and confirm the amphipathic helix or defined fold the design assumed.',
      'Simulate the best few in a model bacterial membrane using coarse-grained molecular dynamics before committing to synthesis.',
      'Deliberately include a diversity constraint. Generative models collapse toward a narrow region of sequence space, and an undiverse candidate set wastes the screen.',
      'Synthesise a manageable panel — typically 10 to 30 peptides — with known positive and negative controls alongside.',
    ],
    tools: ['ProteinMPNN', 'ESMFold', 'PEP-FOLD4', 'HemoPI', 'ToxinPred3', 'GROMACS', 'CHARMM-GUI', 'MARTINI'],
    act: 'Continue to candidate filtering →', next: 'physchem_filter',
  },

  physchem_filter: {
    id: 'physchem_filter', step: 4, total: 8, type: 'info',
    cat: 'PHYSICOCHEMICAL FILTER', title: 'The Properties That Predict Activity',
    body: 'Most membrane-active antimicrobial peptides are cationic and amphipathic. These properties are computed in seconds and are the cheapest meaningful filter you can apply before spending anything on synthesis.',
    tbl: [
      { v: 'Net charge +2 to +9', m: 'Drives initial electrostatic binding to anionic bacterial membranes', s: 'c-g' },
      { v: 'Length 12–50 aa', m: 'Long enough to span or disrupt a bilayer; short enough to synthesise affordably', s: 'c-g' },
      { v: 'Hydrophobic 30–50%', m: 'Below this, no insertion; above it, haemolysis rises sharply', s: 'c-g' },
      { v: 'High hydrophobic moment', m: 'Indicates a genuinely amphipathic helix rather than a merely hydrophobic one', s: 'c-g' },
      { v: 'Net charge above +10', m: 'Often high activity but poor selectivity and rapid renal clearance', s: 'c-y' },
      { v: 'Hydrophobic above 60%', m: 'Strong haemolysis risk — deprioritise', s: 'c-r' },
      { v: 'Multiple cysteines', m: 'Disulfide-stabilised classes are viable but harder to synthesise and fold', s: 'c-y' },
    ],
    caution: 'These ranges describe membrane-active peptides, which are the majority but not the whole field. Peptides with intracellular targets — proline-rich peptides such as apidaecin, for instance — sit well outside this envelope and would be discarded by these filters. Know which mechanism you are hunting before you apply them.',
    tools: ['modlAMP (Python)', 'Peptides (R)', 'ExPASy ProtParam', 'HeliQuest', 'CAMPR4'],
    act: 'Continue to selectivity screening →', next: 'toxicity_screen',
  },

  toxicity_screen: {
    id: 'toxicity_screen', step: 5, total: 8, type: 'q',
    cat: 'SELECTIVITY', title: 'Toxicity and Selectivity Screening',
    q: 'What is the intended application?',
    hint: 'Selectivity requirements differ enormously — a topical agent and a systemic therapeutic are not the same problem',
    opts: [
      { id: 'systemic', label: 'Systemic therapeutic', badge: 'Strictest', sub: 'Requires a high therapeutic index and serum stability', next: 'systemic_req', hi: true },
      { id: 'topical', label: 'Topical or surface application', sub: 'Tolerates lower selectivity; stability demands are milder', next: 'validation_workflow' },
      { id: 'agri', label: 'Agricultural or aquaculture use', sub: 'Cost and environmental persistence dominate the design', next: 'validation_workflow' },
      { id: 'preservative', label: 'Food preservation or biocontrol', sub: 'Nisin-style application; regulatory route is quite different', next: 'validation_workflow' },
    ],
  },

  systemic_req: {
    id: 'systemic_req', step: 5, total: 8, type: 'info',
    cat: 'SYSTEMIC REQUIREMENTS', title: 'What a Systemic Candidate Must Clear',
    body: 'Most antimicrobial peptides that reach clinical trials fail on toxicity, serum stability or protease susceptibility rather than on potency. Screening for these early saves years.',
    tbl: [
      { v: 'Therapeutic index >10', m: 'HC50 divided by MIC — the headline selectivity number', s: 'c-g' },
      { v: 'Haemolysis at 10× MIC', m: 'Should stay below 5% on human red blood cells', s: 'c-g' },
      { v: 'Serum stability', m: 'Many linear peptides are degraded within minutes in 50% serum', s: 'c-r' },
      { v: 'Protease resistance', m: 'Improved by D-amino acids, cyclisation or unnatural residues', s: 'c-y' },
      { v: 'Salt tolerance', m: 'Activity must survive physiological salt — many AMPs do not', s: 'c-r' },
      { v: 'Cytotoxicity', m: 'MTT or LDH against a relevant mammalian line', s: 'c-g' },
    ],
    caution: 'Salt sensitivity is the most frequently overlooked failure mode. A peptide with an excellent MIC in low-salt buffer can be entirely inactive at physiological ionic strength — test in the relevant medium early, before the candidate accumulates sunk cost.',
    tools: ['HemoPI', 'ToxinPred3', 'CytoPred', 'MTT assay', 'LDH release assay'],
    act: 'Continue to validation →', next: 'validation_workflow',
  },

  validation_workflow: {
    id: 'validation_workflow', step: 6, total: 8, type: 'rec',
    cat: 'EXPERIMENTAL VALIDATION', title: 'Wet-Lab Validation Sequence',
    tagline: 'Order the assays so the cheapest ones kill the most candidates first.',
    pts: [
      'Synthesise the shortlist by solid-phase synthesis at 95% purity or better. Crude peptide gives unreliable MICs and wastes the assay.',
      'Determine MIC by broth microdilution following CLSI M07, against a defined panel spanning Gram-positive, Gram-negative and where relevant a resistant clinical isolate.',
      'Run a haemolysis assay on fresh human erythrocytes in parallel with the MIC, not after it — the ratio is the number that matters and you want it early.',
      'Compute the therapeutic index as HC50 over MIC. Anything below about 10 is unlikely to be worth pursuing for systemic use.',
      'Confirm the mechanism on the best candidates with a membrane permeabilisation assay — SYTOX Green uptake or DiSC3(5) depolarisation.',
      'Run a time-kill curve to establish whether the peptide is bactericidal or merely bacteriostatic, which materially changes its therapeutic prospects.',
      'Check activity against biofilms separately. Planktonic MIC routinely fails to predict biofilm efficacy, and for many applications biofilm is the real target.',
      'Test for resistance development by serial passage at sub-MIC concentrations. Low resistance emergence is one of the strongest arguments for the whole class and is worth demonstrating.',
    ],
    tools: ['SPPS (solid-phase synthesis)', 'CLSI M07 broth microdilution', 'SYTOX Green', 'DiSC3(5)', 'Crystal violet biofilm assay', 'Serial passage assay'],
    act: 'Continue to structure work →', next: 'structure_step',
  },

  structure_step: {
    id: 'structure_step', step: 7, total: 8, type: 'info',
    cat: 'STRUCTURAL CHARACTERISATION', title: 'Structure and Mechanism',
    body: 'Structural evidence is what turns an activity measurement into a mechanistic story, and it is usually what a good journal will ask for. For short peptides the computational routes are now fast enough to run on every serious candidate.',
    tbl: [
      { v: 'AlphaFold / ESMFold', m: 'Fast fold prediction; less reliable for short disordered peptides', s: 'c-y' },
      { v: 'PEP-FOLD4', m: 'Purpose-built for peptides under about 50 residues', s: 'c-g' },
      { v: 'Circular dichroism', m: 'Experimental secondary structure in buffer versus membrane mimic', s: 'c-g' },
      { v: 'CD in SDS or TFE', m: 'Shows the coil-to-helix transition on membrane contact — the key observation', s: 'c-g' },
      { v: 'Solution NMR', m: 'Definitive structure in micelles; slower and needs labelled material', s: 'c-g' },
      { v: 'Coarse-grained MD', m: 'MARTINI simulation of insertion into a model bilayer', s: 'c-g' },
    ],
    caution: 'Many antimicrobial peptides are genuinely disordered in water and only fold on contact with a membrane. A low-confidence AlphaFold prediction may be biologically correct rather than a failure — pair it with CD in both buffer and a membrane mimic before concluding anything.',
    cmd: '# Physicochemical profile before anything expensive\npython -c "\nfrom modlamp.descriptors import GlobalDescriptor, PeptideDescriptor\nseq = [\'GIGKFLHSAKKFGKAFVGEIMNS\']\ng = GlobalDescriptor(seq)\ng.calculate_charge(ph=7.4); print(\'charge\', g.descriptor)\ng.hydrophobic_ratio();  print(\'hydrophobic\', g.descriptor)\np = PeptideDescriptor(seq, \'eisenberg\')\np.calculate_moment(); print(\'moment\', p.descriptor)\n"\n\n# Fold a short peptide locally\nesm-fold -i candidates.fasta -o structures/',
    tools: ['PEP-FOLD4', 'ESMFold', 'AlphaFold 3', 'Circular dichroism', 'GROMACS + MARTINI', 'CHARMM-GUI'],
    act: 'Continue to the final checklist →', next: 'amp_checklist',
  },

  amp_checklist: {
    id: 'amp_checklist', step: 8, total: 8, type: 'checklist',
    cat: 'AMP PUBLICATION CHECKLIST', title: 'Publication Readiness',
    intro: 'What reviewers of an antimicrobial peptide paper will look for.',
    items: [
      { id: 'novelty', label: 'Novelty established against APD3, DRAMP and dbAMP', required: true, tip: 'A close match to a characterised peptide must be addressed head-on' },
      { id: 'purity', label: 'Synthesised peptide purity confirmed by HPLC and mass spectrometry', required: true },
      { id: 'mic_panel', label: 'MIC determined against a defined panel with reference strains', required: true, tip: 'Include ATCC reference strains so numbers are comparable' },
      { id: 'clsi', label: 'MIC method follows CLSI or EUCAST and states the medium', required: true },
      { id: 'replicates', label: 'Biological replicates performed and variation reported', required: true },
      { id: 'hemolysis', label: 'Haemolysis measured on human erythrocytes', required: true },
      { id: 'ti', label: 'Therapeutic index reported', required: true },
      { id: 'cytotox', label: 'Cytotoxicity assessed against a mammalian cell line', required: false },
      { id: 'mechanism', label: 'Membrane mechanism supported by a permeabilisation assay', required: false },
      { id: 'structure', label: 'Secondary structure characterised experimentally or computationally', required: false },
      { id: 'salt_serum', label: 'Activity tested under physiological salt and in serum', required: false, tip: 'Essential for any systemic claim' },
      { id: 'resistance', label: 'Resistance development assessed by serial passage', required: false },
      { id: 'seq_deposited', label: 'Source genome or metagenome deposited with accessions', required: true },
      { id: 'bgc_deposited', label: 'BGC submitted to MIBiG where a cluster was characterised', required: false },
      { id: 'controls', label: 'Positive and negative control peptides included in every assay', required: true },
    ],
    scoring: {
      low: 'Early stage — core evidence missing',
      mid: 'Substantial gaps for a peptide paper',
      high: 'Nearly ready — close the remaining items',
      top: 'Publication ready',
    },
    next: '__hub__',
  },
};

/* ═══════════════════════════════════════════════════════════
   20 · dDDH & NOVEL SPECIES DESCRIPTION CHECKLIST
   ═══════════════════════════════════════════════════════════ */
export const novelSpeciesTree: DecisionTree = {
  cultured_status: {
    id: 'cultured_status', step: 1, total: 7, type: 'q',
    cat: 'CULTURE STATUS', title: 'Do You Have a Culture?',
    q: 'Is your organism available as a pure culture?',
    hint: 'This single fact determines which nomenclatural code you are working under, and the two routes barely overlap',
    opts: [
      { id: 'pure_culture', label: 'Yes — pure, viable, deposit-ready culture', badge: 'ICNP route', sub: 'Eligible for valid publication under the ICNP in IJSEM', next: 'ani_threshold', hi: true },
      { id: 'mag_only', label: 'No — MAG or SAG from a metagenome', sub: 'Uncultured; the SeqCode route applies instead', next: 'seqcode_route' },
      { id: 'unculturable', label: 'Culture attempted and failed', sub: 'Same as above — SeqCode, or Candidatus status', next: 'seqcode_route' },
    ],
  },

  seqcode_route: {
    id: 'seqcode_route', step: 2, total: 7, type: 'info',
    cat: 'SEQCODE ROUTE', title: 'Naming Uncultured Organisms',
    body: 'The ICNP requires a viable culture as the nomenclatural type, so an uncultured organism cannot be validly named under it. The SeqCode, operational since 2022, accepts a high-quality genome sequence as the type material instead, which gives MAGs and SAGs a route to a formal, stable name.',
    tbl: [
      { v: 'SeqCode', m: 'Genome sequence as type; names are valid and stable within that code', s: 'c-g' },
      { v: 'Genome quality bar', m: 'At least 90% complete and under 5% contamination — MIMAG high quality', s: 'c-g' },
      { v: 'Candidatus', m: 'The older provisional convention; still widely used but not a valid name', s: 'c-y' },
      { v: 'ICNP', m: 'Not available without a deposited viable culture', s: 'c-r' },
      { v: 'Registration', m: 'Names are registered through the SeqCode Registry', s: 'c-g' },
    ],
    caution: 'The SeqCode and the ICNP are separate systems, and the relationship between them is still being worked out by the community. If you have any realistic prospect of culturing the organism, the ICNP route remains the more universally accepted one.',
    tools: ['SeqCode Registry', 'CheckM2', 'GTDB-Tk', 'MIMAG standards'],
    act: 'Continue to genome thresholds →', next: 'ani_threshold',
  },

  ani_threshold: {
    id: 'ani_threshold', step: 2, total: 7, type: 'q',
    cat: 'ANI SCREENING', title: 'Average Nucleotide Identity',
    q: 'What is the highest ANI between your isolate and its closest relative with a validly published name?',
    hint: 'ANI is the fast screen; dDDH is the formal criterion. Compute ANI first because it costs seconds',
    opts: [
      { id: 'ani_high', label: 'Above 96%', sub: 'Almost certainly the same species — not a novel taxon', next: 'not_novel', w: true },
      { id: 'ani_border', label: '95–96% — the boundary zone', sub: 'Ambiguous; dDDH is required to resolve it', next: 'ddh_required' },
      { id: 'ani_novel', label: 'Below 95%', badge: 'Likely novel', sub: 'Below the species boundary — proceed to dDDH confirmation', next: 'ddh_required', hi: true },
      { id: 'ani_genus', label: 'Below 80%', sub: 'Possibly a novel genus — a considerably higher evidentiary bar', next: 'novel_genus' },
    ],
  },

  not_novel: {
    id: 'not_novel', type: 'block', isE: false, icon: '⚠',
    cat: 'LIKELY NOT NOVEL', title: 'ANI Above 96% — Same Species',
    body: 'An ANI above 96% against a validly named type strain places your isolate inside that species. This is a firm boundary supported by very large comparative studies, and a novel species description on this evidence will not survive review.',
    steps: [
      'Confirm you compared against the type strain genome specifically, not merely any genome carrying that species name — misidentified public genomes are common.',
      'Verify the closest relative through the LPSN entry for the species and use the designated type strain assembly.',
      'Consider whether you have a novel subspecies or a distinctive strain, both of which are publishable on their own terms.',
      'A strain with unusual phenotype, a novel BGC or notable resistance is a perfectly good paper without any novel-taxon claim.',
      'If several genomes in the comparison disagree, check GTDB — public species assignments are frequently wrong and GTDB is the more reliable reference.',
    ],
    tools: ['LPSN', 'GTDB-Tk', 'FastANI', 'TYGS', 'NCBI type material assemblies'],
    act: '← Re-check against the type strain', next: 'ani_threshold',
  },

  novel_genus: {
    id: 'novel_genus', step: 3, total: 7, type: 'info',
    cat: 'NOVEL GENUS', title: 'Describing a Novel Genus',
    body: 'A novel genus requires everything a novel species requires, plus positive evidence that the organism falls outside every existing genus in the family. The phylogenomic argument carries most of the weight here.',
    tbl: [
      { v: 'AAI 60–75%', m: 'Typical genus-level range, though it varies by family', s: 'c-y' },
      { v: 'POCP below 50%', m: 'Percentage of conserved proteins — a widely used genus criterion', s: 'c-g' },
      { v: 'Core genome tree', m: 'Must form a distinct branch outside all existing genera in the family', s: 'c-g' },
      { v: 'GTDB placement', m: 'GTDB taxonomy should agree that this is a separate genus', s: 'c-g' },
      { v: 'Phenotype', m: 'Distinguishing characters against every genus in the family, not just the closest', s: 'c-y' },
    ],
    caution: 'Genus boundaries are considerably less standardised than species boundaries, and family-specific conventions matter. Look at how genera were recently delimited within your particular family before proposing a new one.',
    tools: ['POCP calculator', 'CompareM (AAI)', 'GTDB-Tk', 'UBCG2', 'IQ-TREE 2'],
    act: 'Continue to dDDH →', next: 'ddh_required',
  },

  ddh_required: {
    id: 'ddh_required', step: 3, total: 7, type: 'info',
    cat: 'dDDH CALCULATION', title: 'Digital DNA–DNA Hybridisation',
    body: 'dDDH computed by the Genome-to-Genome Distance Calculator is the accepted in-silico replacement for wet-lab DNA-DNA hybridisation. The species boundary is 70%, chosen to reproduce the historical wet-lab threshold. Report formula d4, which is the one that behaves properly on draft genomes.',
    tbl: [
      { v: 'dDDH below 70%', m: 'Distinct species — the formal criterion is met', s: 'c-g' },
      { v: 'dDDH 70% or above', m: 'Same species — a novel species claim is not supportable', s: 'c-r' },
      { v: 'Use formula d4', m: 'Independent of genome length; the right choice for draft assemblies', s: 'c-g' },
      { v: 'Confidence interval', m: 'Report the interval, not the point estimate alone', s: 'c-g' },
      { v: 'G+C difference', m: 'A difference above 1% is itself indicative of separate species', s: 'c-g' },
      { v: 'TYGS', m: 'Runs dDDH, picks the right comparators and builds the tree in one submission', s: 'c-g' },
    ],
    caution: 'Run dDDH against the type strain genome. Comparing against an arbitrary public genome labelled with the species name is the most common technical error in novel species submissions, and reviewers check it.',
    cmd: '# TYGS — the practical route. Handles comparator selection for you.\n#   https://tygs.dsmz.de/  → upload genome → dDDH + phylogeny + closest types\n\n# ANI screen first (seconds, narrows the field)\nfastANI -q my_isolate.fna -r type_strain.fna -o ani_out.txt\nskani dist my_isolate.fna type_strain.fna\n\n# Genome-based taxonomy cross-check\ngtdbtk classify_wf --genome_dir ./genomes --out_dir ./gtdbtk_out --cpus 16',
    tools: ['TYGS', 'GGDC 4.0', 'FastANI', 'skani', 'GTDB-Tk', 'LPSN'],
    act: 'Continue to phenotypic characterisation →', next: 'phenotype_req',
  },

  phenotype_req: {
    id: 'phenotype_req', step: 4, total: 7, type: 'q',
    cat: 'PHENOTYPE', title: 'Phenotypic Characterisation',
    q: 'How far has phenotypic characterisation progressed?',
    hint: 'Genome data alone is not sufficient for an ICNP description — the protologue requires phenotype',
    opts: [
      { id: 'pheno_complete', label: 'Complete — morphology, physiology, biochemistry and chemotaxonomy', sub: 'Ready to draft the protologue', next: 'chemotax_info', hi: true },
      { id: 'pheno_partial', label: 'Partial — basic growth and biochemistry only', sub: 'Chemotaxonomy still outstanding', next: 'chemotax_info' },
      { id: 'pheno_none', label: 'Genome only — no phenotypic work yet', sub: 'This is the usual bottleneck', next: 'pheno_needed', w: true },
    ],
  },

  pheno_needed: {
    id: 'pheno_needed', type: 'block', isE: false, icon: '⚠',
    cat: 'PHENOTYPE REQUIRED', title: 'Phenotypic Data Is Mandatory',
    body: 'A novel species description under the ICNP cannot be published on genome data alone. IJSEM requires a protologue containing phenotypic and chemotaxonomic characters that distinguish the organism from its closest relatives. This is where most genome-first descriptions stall.',
    steps: [
      'Record colony morphology on a defined medium, cell morphology, Gram reaction and motility.',
      'Determine the growth range and optimum for temperature, pH and NaCl concentration.',
      'Run a biochemical panel — API 20NE, API ZYM or Biolog GEN III — alongside the closest type strains under identical conditions.',
      'Determine the cellular fatty acid profile by FAME analysis using the MIDI Sherlock system.',
      'Analyse polar lipids by two-dimensional TLC and identify respiratory quinones.',
      'For Gram-positive organisms, determine peptidoglycan type and diagnostic cell-wall sugars.',
      'Run every comparison against the type strains in parallel, in your own laboratory — literature values were generated under different conditions and are not comparable.',
    ],
    tools: ['API 20NE / API ZYM', 'Biolog GEN III', 'MIDI Sherlock (FAME)', '2D-TLC (polar lipids)', 'HPLC (quinones)'],
    act: '← Return once phenotypic work is complete', next: 'phenotype_req',
  },

  chemotax_info: {
    id: 'chemotax_info', step: 5, total: 7, type: 'info',
    cat: 'CHEMOTAXONOMY', title: 'Chemotaxonomic Requirements',
    body: 'Chemotaxonomic markers are required by IJSEM and vary by taxonomic group. Check recent descriptions within your own family to see exactly which markers reviewers in that area expect.',
    tbl: [
      { v: 'Fatty acids (FAME)', m: 'Required for essentially all groups — MIDI Sherlock', s: 'c-g' },
      { v: 'Polar lipids', m: 'Required for most groups — 2D-TLC', s: 'c-g' },
      { v: 'Respiratory quinones', m: 'Required for most aerobes — HPLC', s: 'c-g' },
      { v: 'Peptidoglycan type', m: 'Required for Gram-positive organisms', s: 'c-g' },
      { v: 'Mycolic acids', m: 'Required within the Corynebacterineae', s: 'c-y' },
      { v: 'G+C content', m: 'Calculate from the genome — no longer measured by HPLC', s: 'c-g' },
    ],
    caution: 'Grow the type strains and your isolate under identical conditions when comparing chemotaxonomic markers. Fatty acid profiles in particular shift substantially with growth temperature and medium, so cross-laboratory comparisons are not reliable.',
    act: 'Continue to deposition →', next: 'deposit_req',
  },

  deposit_req: {
    id: 'deposit_req', step: 6, total: 7, type: 'info',
    cat: 'CULTURE DEPOSITION', title: 'Two Collections, Two Countries',
    body: 'Valid publication under the ICNP requires the type strain to be deposited in two publicly accessible culture collections in two different countries, and both accession numbers must appear in the paper. Deposits take time — start them well before submission.',
    tbl: [
      { v: 'Two collections', m: 'Mandatory; must be in two different countries', s: 'c-r' },
      { v: 'Public availability', m: 'Both deposits must be unrestricted and available to any requester', s: 'c-r' },
      { v: 'Processing time', m: 'Commonly 2–6 months — begin early', s: 'c-y' },
      { v: 'Viability', m: 'The collection will verify growth and purity before accepting', s: 'c-g' },
      { v: 'Nagoya Protocol', m: 'Permits and benefit-sharing documentation for the source country', s: 'c-r' },
      { v: 'Genome accession', m: 'Genome must be public before the description is published', s: 'c-g' },
    ],
    caution: 'For organisms isolated from a country other than your own, Nagoya Protocol compliance is a legal requirement, not a formality. Culture collections increasingly refuse deposits without documented provenance and access permits, and this can halt a submission entirely.',
    tools: ['DSMZ', 'NCIMB', 'JCM', 'CGMCC', 'MTCC', 'KCTC', 'LPSN', 'NCBI GenBank'],
    act: 'Continue to the final checklist →', next: 'ijsem_checklist',
  },

  ijsem_checklist: {
    id: 'ijsem_checklist', step: 7, total: 7, type: 'checklist',
    cat: 'IJSEM SUBMISSION CHECKLIST', title: 'Novel Species Description Checklist',
    intro: 'The full requirement set for a valid novel species description under the ICNP.',
    items: [
      { id: 'ani', label: 'ANI below 95–96% against the closest type strain', required: true, tip: 'FastANI or skani against the designated type strain genome' },
      { id: 'ddh', label: 'dDDH below 70% by GGDC formula d4, with confidence interval', required: true, tip: 'TYGS handles comparator selection automatically' },
      { id: 'gc', label: 'G+C content calculated from the genome sequence', required: true },
      { id: 'genome_quality', label: 'Genome at least 95% complete with under 5% contamination', required: true, tip: 'CheckM2; a closed genome is strongly preferred' },
      { id: 'sixteen_s', label: '16S rRNA gene sequence extracted and deposited separately', required: true },
      { id: 'phylo_16s', label: '16S phylogenetic tree including all close relatives', required: true },
      { id: 'phylo_core', label: 'Core-genome or multilocus phylogeny with support values', required: true, tip: 'UBCG2, GTDB-Tk or autoMLST, inferred with IQ-TREE 2' },
      { id: 'morphology', label: 'Colony and cell morphology described', required: true },
      { id: 'gram', label: 'Gram reaction and motility determined', required: true },
      { id: 'growth_range', label: 'Temperature, pH and NaCl ranges and optima determined', required: true },
      { id: 'biochem', label: 'Biochemical panel run alongside the closest type strains', required: true, tip: 'Reference strains must be tested in parallel, not cited' },
      { id: 'fame', label: 'Cellular fatty acid profile determined', required: true },
      { id: 'polar_lipids', label: 'Polar lipid profile determined', required: true },
      { id: 'quinones', label: 'Respiratory quinones identified', required: false, tip: 'Required for most aerobic groups' },
      { id: 'peptidoglycan', label: 'Peptidoglycan type determined', required: false, tip: 'Required for Gram-positive organisms' },
      { id: 'deposit_two', label: 'Type strain deposited in two collections in two countries', required: true },
      { id: 'accessions', label: 'Both culture collection accession numbers obtained', required: true },
      { id: 'genome_public', label: 'Genome deposited in GenBank or ENA and publicly released', required: true },
      { id: 'etymology', label: 'Etymology checked and grammatically correct', required: true, tip: 'A malformed name is a common cause of rejection — have it checked' },
      { id: 'protologue', label: 'Protologue written in standard IJSEM format', required: true },
      { id: 'nagoya', label: 'Nagoya Protocol permits documented where applicable', required: true },
      { id: 'differential', label: 'Differential table against the closest relatives included', required: true },
    ],
    scoring: {
      low: 'Early stage — core requirements outstanding',
      mid: 'Substantial work remaining',
      high: 'Nearly ready — close the last items',
      top: 'Ready for IJSEM submission',
    },
    next: '__hub__',
  },
};

/* ═══════════════════════════════════════════════════════════
   21 · COMPUTATIONAL RESOURCE ESTIMATOR
   ═══════════════════════════════════════════════════════════ */
export const computeEstimatorTree: DecisionTree = {
  task_type: {
    id: 'task_type', step: 1, total: 6, type: 'q',
    cat: 'TASK', title: 'What Are You Running?',
    q: 'Which job do you need to size?',
    hint: 'Memory is almost always the binding constraint on an HPC allocation — a job that exceeds RAM is killed, whereas a slow job merely finishes late',
    opts: [
      { id: 'isolate_asm', label: 'Isolate genome assembly', sub: 'SPAdes, Flye, Unicycler on a single bacterial genome', next: 'isolate_resources' },
      { id: 'meta_asm', label: 'Metagenome assembly', badge: 'Memory-heavy', sub: 'MetaSPAdes or MEGAHIT — the most demanding common job', next: 'meta_resources', hi: true },
      { id: 'taxonomy', label: 'Taxonomic classification or placement', sub: 'Kraken2, GTDB-Tk, CheckM2', next: 'taxonomy_resources' },
      { id: 'annotation', label: 'Annotation and genome mining', sub: 'Bakta, Prokka, antiSMASH', next: 'annotation_resources' },
      { id: 'structure', label: 'Protein structure prediction', sub: 'AlphaFold, ESMFold — GPU territory', next: 'structure_resources' },
    ],
  },

  isolate_resources: {
    id: 'isolate_resources', step: 2, total: 6, type: 'info',
    cat: 'ISOLATE ASSEMBLY', title: 'Resources for Isolate Assembly',
    body: 'Single bacterial genome assembly is modest by HPC standards and runs comfortably on a well-specified workstation. These figures assume a typical 4–6 Mb genome at 100× coverage.',
    tbl: [
      { v: 'SPAdes (Illumina)', m: '16–32 GB RAM · 8–16 cores · 1–4 h', s: 'c-g' },
      { v: 'SPAdes --isolate', m: 'Lower memory and faster than the default careful mode', s: 'c-g' },
      { v: 'SKESA', m: '8–16 GB RAM · 8 cores · under 1 h — much lighter than SPAdes', s: 'c-g' },
      { v: 'Flye (Nanopore)', m: '16–32 GB RAM · 16 cores · 1–3 h', s: 'c-g' },
      { v: 'Unicycler (hybrid)', m: '32–64 GB RAM · 16 cores · 4–12 h — SPAdes runs inside it', s: 'c-y' },
      { v: 'Medaka polishing', m: '8–16 GB RAM, or a GPU · 30–90 min', s: 'c-g' },
      { v: 'Polypolish', m: '8–16 GB RAM · fast — usually under 30 min', s: 'c-g' },
      { v: 'Scratch space', m: 'Roughly 50–100 GB — SPAdes writes large intermediates', s: 'c-y' },
    ],
    caution: 'SPAdes memory scales with k-mer count, which means with coverage. If you are far above 100×, subsampling first will often halve both the memory footprint and the runtime with no loss of assembly quality.',
    act: 'Continue to storage planning →', next: 'storage_planning',
  },

  meta_resources: {
    id: 'meta_resources', step: 2, total: 6, type: 'q',
    cat: 'METAGENOME ASSEMBLY', title: 'Metagenome Complexity',
    q: 'How complex is the community and how much data per sample?',
    hint: 'Metagenome assembly memory is driven by community diversity far more than by raw data volume',
    opts: [
      { id: 'meta_low', label: 'Low complexity — under 10 Gb', sub: 'Enrichment culture, bioreactor, simple biofilm', next: 'meta_table' },
      { id: 'meta_mid', label: 'Moderate — 10–30 Gb', sub: 'Gut, marine water column, sponge holobiont', next: 'meta_table' },
      { id: 'meta_high', label: 'High complexity — 30 Gb or more', sub: 'Soil, sediment, or a large co-assembly', next: 'meta_table', w: true },
    ],
  },

  meta_table: {
    id: 'meta_table', step: 3, total: 6, type: 'info',
    cat: 'METAGENOME RESOURCES', title: 'Metagenome Assembly Requirements',
    body: 'MetaSPAdes produces better contiguity but its peak memory can be extreme on diverse samples. MEGAHIT trades some contiguity for a memory footprint that is often an order of magnitude smaller — on soil, that difference decides whether the job runs at all.',
    tbl: [
      { v: 'MetaSPAdes · low', m: '64–120 GB RAM · 16–32 cores · 6–18 h', s: 'c-g' },
      { v: 'MetaSPAdes · moderate', m: '150–300 GB RAM · 32 cores · 24–48 h', s: 'c-y' },
      { v: 'MetaSPAdes · soil', m: '500 GB to 1 TB+ · frequently fails outright', s: 'c-r' },
      { v: 'MEGAHIT · moderate', m: '32–64 GB RAM · 32 cores · 6–12 h', s: 'c-g' },
      { v: 'MEGAHIT · soil', m: '64–200 GB RAM · 32–64 cores · 12–36 h', s: 'c-y' },
      { v: 'Flye --meta', m: '64–256 GB RAM depending on diversity · 24–72 h', s: 'c-y' },
      { v: 'Binning (MetaBAT2)', m: '16–32 GB RAM · 16 cores · 1–4 h', s: 'c-g' },
      { v: 'Scratch space', m: '500 GB to 2 TB for a large co-assembly', s: 'c-r' },
    ],
    caution: 'On a genuinely diverse soil metagenome, use MEGAHIT. Attempting MetaSPAdes there commonly burns days of wall-clock time before being killed by the memory limit, and no amount of node time fixes a fundamentally superlinear memory curve.',
    cmd: '# Ask for what you need, and no more — oversized requests queue longer\n#SBATCH --job-name=metaspades\n#SBATCH --cpus-per-task=32\n#SBATCH --mem=250G\n#SBATCH --time=48:00:00\n#SBATCH --partition=himem\n\nmetaspades.py -1 R1.fq.gz -2 R2.fq.gz -o out/ \\\n  -t 32 -m 250 --tmp-dir $TMPDIR\n\n# What did it actually use? Right-size the next run from this.\nseff $SLURM_JOB_ID\nsacct -j $SLURM_JOB_ID --format=JobID,MaxRSS,Elapsed,State',
    act: 'Continue to storage planning →', next: 'storage_planning',
  },

  taxonomy_resources: {
    id: 'taxonomy_resources', step: 2, total: 6, type: 'info',
    cat: 'TAXONOMY RESOURCES', title: 'Classification and Placement',
    body: 'These tools are dominated by database size rather than by input size. The database has to be resident in memory, so RAM is fixed by which database you choose and barely varies with how many genomes you classify.',
    tbl: [
      { v: 'Kraken2 · Standard DB', m: '~55 GB RAM — the whole index is loaded', s: 'c-y' },
      { v: 'Kraken2 · Standard-8', m: '~8 GB RAM — capped index, slight sensitivity loss', s: 'c-g' },
      { v: 'Kraken2 · full nt', m: '250 GB or more RAM', s: 'c-r' },
      { v: 'GTDB-Tk classify_wf', m: '~110 GB RAM using --mash_db; pplacer needs far more', s: 'c-r' },
      { v: 'GTDB-Tk · full pplacer', m: '~320 GB RAM for the full reference tree', s: 'c-r' },
      { v: 'CheckM2', m: '8–16 GB RAM · fast · a few minutes per genome', s: 'c-g' },
      { v: 'FastANI / skani', m: 'Under 8 GB RAM · seconds per pair', s: 'c-g' },
      { v: 'Bracken', m: 'Under 8 GB RAM · runs on Kraken2 output', s: 'c-g' },
    ],
    caution: 'GTDB-Tk is the job most likely to be killed on a standard node. Use --mash_db to avoid the full pplacer placement, or request a high-memory partition explicitly — the default classify_wf assumes resources most general nodes do not have.',
    act: 'Continue to storage planning →', next: 'storage_planning',
  },

  annotation_resources: {
    id: 'annotation_resources', step: 2, total: 6, type: 'info',
    cat: 'ANNOTATION RESOURCES', title: 'Annotation and Genome Mining',
    body: 'Annotation is light on memory and parallelises well across genomes. For large genome sets the practical constraint is job scheduling and I/O rather than any single job\'s footprint.',
    tbl: [
      { v: 'Bakta', m: '8–16 GB RAM · 8–16 cores · 5–15 min per genome', s: 'c-g' },
      { v: 'Bakta database', m: '~65 GB on disk for the full database', s: 'c-y' },
      { v: 'Prokka', m: '8 GB RAM · 8 cores · 5–10 min per genome', s: 'c-g' },
      { v: 'antiSMASH 7', m: '8–16 GB RAM · 8 cores · 10–40 min per genome', s: 'c-g' },
      { v: 'BiG-SCAPE', m: '16–64 GB RAM — scales with the number of clusters compared', s: 'c-y' },
      { v: 'eggNOG-mapper', m: '16–32 GB RAM; ~50 GB database', s: 'c-g' },
      { v: 'Roary / Panaroo', m: '32–64 GB RAM for 100+ genomes', s: 'c-y' },
      { v: 'InterProScan', m: '16–32 GB RAM; the database exceeds 200 GB', s: 'c-y' },
    ],
    caution: 'For large genome collections, submit an array job rather than a loop inside one allocation. One job per genome schedules far better, and a single failure does not lose the whole batch.',
    cmd: '# SLURM array — one genome per task, 20 running concurrently\n#SBATCH --array=1-500%20\n#SBATCH --cpus-per-task=8\n#SBATCH --mem=16G\n#SBATCH --time=01:00:00\n\nGENOME=$(sed -n "${SLURM_ARRAY_TASK_ID}p" genome_list.txt)\nbakta --db "$BAKTA_DB" --threads 8 \\\n      --output "annot/$(basename "$GENOME" .fna)" "$GENOME"',
    act: 'Continue to storage planning →', next: 'storage_planning',
  },

  structure_resources: {
    id: 'structure_resources', step: 2, total: 6, type: 'info',
    cat: 'STRUCTURE PREDICTION', title: 'Protein Structure Prediction',
    body: 'Structure prediction is the one common bioinformatics task that genuinely requires a GPU. AlphaFold additionally needs a very large sequence database and a lengthy CPU-bound search phase before the GPU stage begins.',
    tbl: [
      { v: 'AlphaFold 2 · monomer', m: '1 GPU (16 GB+) · ~85 GB system RAM · 1–6 h', s: 'c-y' },
      { v: 'AlphaFold databases', m: '~2.6 TB on disk — the real barrier for most groups', s: 'c-r' },
      { v: 'AlphaFold MSA stage', m: 'CPU-bound, several hours; runs before the GPU is used', s: 'c-y' },
      { v: 'ColabFold (MMseqs2)', m: 'Far faster MSA; ~40 GB database instead of 2.6 TB', s: 'c-g' },
      { v: 'ESMFold', m: '1 GPU (16 GB+) · no MSA at all · seconds to minutes', s: 'c-g' },
      { v: 'PEP-FOLD4', m: 'CPU only · minutes · peptides under ~50 residues', s: 'c-g' },
      { v: 'Multimer', m: 'GPU memory scales steeply with total chain length', s: 'c-r' },
      { v: 'GROMACS MD', m: '1 GPU · 8–16 cores · days for atomistic membrane systems', s: 'c-y' },
    ],
    caution: 'For short peptides, ESMFold or PEP-FOLD4 will give you an answer in minutes without any database at all. Standing up a full AlphaFold installation for peptides under 50 residues is rarely justified.',
    act: 'Continue to storage planning →', next: 'storage_planning',
  },

  storage_planning: {
    id: 'storage_planning', step: 4, total: 6, type: 'info',
    cat: 'STORAGE', title: 'Storage — the Constraint People Forget',
    body: 'Allocations are usually described in CPU hours, but projects far more often run aground on disk quota. Intermediate files typically dwarf both the input and the final result.',
    tbl: [
      { v: 'Raw FASTQ (isolate)', m: '1–3 GB per genome, gzipped', s: 'c-g' },
      { v: 'Raw FASTQ (metagenome)', m: '5–30 GB per sample, gzipped', s: 'c-y' },
      { v: 'Nanopore POD5', m: '10–50 GB per flow cell — keep it, re-basecalling needs it', s: 'c-y' },
      { v: 'SPAdes intermediates', m: '10–50× the input size; deleted only on success', s: 'c-r' },
      { v: 'BAM files', m: 'Roughly 1–2× the FASTQ size — use CRAM for archival', s: 'c-y' },
      { v: 'Reference databases', m: 'Frequently 500 GB to 3 TB in total across tools', s: 'c-r' },
      { v: 'Rule of thumb', m: 'Budget 10× your raw data for working space', s: 'c-g' },
    ],
    caution: 'Use node-local scratch ($TMPDIR) for intermediates wherever the scheduler provides it. Writing them to a shared parallel filesystem is slower for you and degrades performance for everyone else on the cluster.',
    act: 'Continue to job submission →', next: 'job_strategy',
  },

  job_strategy: {
    id: 'job_strategy', step: 5, total: 6, type: 'rec',
    cat: 'JOB STRATEGY', title: 'Getting Jobs Through the Queue',
    tagline: 'Accurate requests start sooner than generous ones.',
    pts: [
      'Request what the job actually needs. Schedulers backfill small jobs into gaps, so a right-sized request frequently starts hours before an inflated one.',
      'Measure real usage with seff or sacct after every job, and use those numbers to size the next run. Two or three iterations converge on an accurate request.',
      'Always set a time limit you believe. Jobs with no limit, or an absurd one, sit at the back of the queue on most schedulers.',
      'Use array jobs for anything you would otherwise loop over. They schedule better, restart individually on failure, and are far easier to monitor.',
      'Checkpoint long assemblies where the tool supports it. A 48-hour job killed at hour 47 by a node fault is an expensive lesson.',
      'Run a single sample end to end before launching the full batch. Nearly every pipeline failure is discoverable on one sample, and discovering it on 500 is costly.',
      'Pin your tool versions in a container or a Conda environment file, and record them. Reproducibility is a publication requirement, not a nicety.',
      'Watch the memory curve on the first run of a new sample type. Metagenome assembly memory is superlinear in diversity, so a soil sample can need many times what a gut sample did.',
    ],
    tools: ['SLURM (sbatch, seff, sacct)', 'Nextflow', 'Snakemake', 'Apptainer / Singularity', 'Conda / mamba'],
    act: 'Continue to the final checklist →', next: 'compute_checklist',
  },

  compute_checklist: {
    id: 'compute_checklist', step: 6, total: 6, type: 'checklist',
    cat: 'COMPUTE READINESS CHECKLIST', title: 'Before You Submit at Scale',
    intro: 'Work through this before launching a large batch — each item corresponds to a common way to lose days of cluster time.',
    items: [
      { id: 'mem_est', label: 'Peak memory estimated for the largest expected input', required: true },
      { id: 'pilot', label: 'Pipeline tested end to end on a single sample', required: true, tip: 'The single highest-value step on this list' },
      { id: 'seff', label: 'Actual usage measured with seff or sacct and the request adjusted', required: true },
      { id: 'quota', label: 'Disk quota checked against the 10× working-space estimate', required: true },
      { id: 'scratch', label: 'Intermediates directed to node-local scratch', required: false },
      { id: 'time_limit', label: 'Realistic wall-clock limit set', required: true },
      { id: 'array', label: 'Array jobs used for per-sample tasks', required: false },
      { id: 'versions', label: 'Tool versions pinned in a container or environment file', required: true },
      { id: 'db_local', label: 'Reference databases downloaded and verified in advance', required: true, tip: 'Downloading inside a compute job wastes the allocation and often times out' },
      { id: 'backup', label: 'Raw data backed up outside the scratch filesystem', required: true, tip: 'Scratch is routinely purged without notice' },
      { id: 'logging', label: 'stdout and stderr captured to per-job log files', required: true },
      { id: 'resume', label: 'Workflow manager configured to resume from failure', required: false, tip: 'Nextflow -resume or Snakemake --rerun-incomplete' },
    ],
    scoring: {
      low: 'High risk of failed or killed jobs',
      mid: 'Several gaps remain',
      high: 'Nearly ready — close the last items',
      top: 'Ready to run at scale',
    },
    next: '__hub__',
  },
};
