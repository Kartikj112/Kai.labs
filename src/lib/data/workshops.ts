import type { Workshop } from '@/lib/types'

export const workshops: Workshop[] = [
  {
    id: 'intro_bio',
    number: '01',
    title: 'Introduction to Bioinformatics',
    description:
      'Learn how biological data becomes scientific insight. Explore DNA, proteins, and biological databases, understand how sequences are compared, and see how researchers turn raw data into meaningful discoveries — no coding required.',
    tags: ['Biological Data', 'Databases', 'BLAST', 'Sequence Comparison', 'Protein Structure'],
    isLive: true,
    level: 'Beginner',
    duration: '2 Days',
    format: 'Online / In-Person',
    overview:
      'This foundational workshop bridges biology and computation — no prior coding knowledge required. You will explore how biological sequences (DNA, RNA, protein) are stored, queried, and compared using global databases and alignment tools. By the end, you will understand the core principles that underpin modern genomics and be equipped to navigate the bioinformatics landscape with confidence.',
    prerequisites: [
      { text: 'Basic understanding of biology (high school level)' },
      { text: 'No programming experience required' },
      { text: 'Laptop with internet connection' },
    ],
    modules: [
      { num: '01', name: 'The Language of Life', desc: 'DNA, RNA, and protein — how biological information is encoded, stored, and retrieved in public databases like NCBI and UniProt.' },
      { num: '02', name: 'Sequence Alignment Fundamentals', desc: 'Pairwise and multiple sequence alignment — BLAST, MUSCLE, and the mathematics of similarity scoring.' },
      { num: '03', name: 'From Sequence to Function', desc: 'Annotating unknown sequences using homology, domain databases (Pfam, InterPro), and functional inference.' },
      { num: '04', name: 'Protein Structure & Prediction', desc: 'Introduction to 3D protein structure, PDB, and AlphaFold — seeing biology in three dimensions.' },
      { num: '05', name: 'Putting It Together', desc: 'A capstone mini-project: take a mystery sequence from raw data to a functional hypothesis using tools covered throughout.' },
    ],
    tools: ['NCBI BLAST', 'MUSCLE', 'UniProt', 'Pfam', 'InterPro', 'PDB', 'AlphaFold', 'Jalview'],
  },
  {
    id: 'sanger',
    number: '02',
    title: 'Sanger Sequencing Analysis',
    description:
      'From chromatogram to confident sequence. Trace file interpretation, quality assessment, and BLAST-based identification workflows.',
    tags: ['Sanger', 'Chromas', 'BLAST', 'MUSCLE'],
    level: 'Beginner–Intermediate',
    duration: '1 Day',
    format: 'Online / In-Person',
    overview:
      'Sanger sequencing remains the gold standard for validating clones, confirming PCR products, and identifying microbial isolates. This focused one-day workshop takes you from raw .ab1 trace files through quality assessment, trimming, and confident BLAST-based species identification. You will leave with a reproducible SOP you can immediately apply in your own lab.',
    prerequisites: [
      { text: 'Basic molecular biology knowledge' },
      { text: 'Familiarity with DNA sequences helpful but not required' },
      { text: 'Laptop with Chromas Lite (free, provided link before workshop)' },
    ],
    modules: [
      { num: '01', name: 'Understanding Chromatograms', desc: 'Reading .ab1 files, interpreting peak quality, identifying ambiguous bases, and using Chromas Lite for visualisation.' },
      { num: '02', name: 'Quality Trimming & Assembly', desc: 'Trimming low-quality ends, assembling paired reads (forward + reverse), and resolving conflicts.' },
      { num: '03', name: 'BLAST-Based Identification', desc: 'Submitting trimmed consensus sequences to NCBI BLAST, interpreting e-values, and confirming identities.' },
      { num: '04', name: 'Phylogenetic Placement', desc: 'Quick MUSCLE alignment and neighbour-joining tree construction to contextualise your isolate within known taxa.' },
    ],
    tools: ['Chromas Lite', 'NCBI BLAST', 'MUSCLE', 'MEGA', 'FinchTV'],
  },
  {
    id: 'bacterial_wgs',
    number: '03',
    title: 'Introduction to Bacterial WGS and Mining',
    description:
      'End-to-end bacterial whole-genome sequencing — assembly, annotation, and biosynthetic gene cluster discovery from real genomes.',
    tags: ['SPAdes', 'Prokka', 'antiSMASH', 'QUAST'],
    isLive: true,
    level: 'Intermediate',
    duration: '3 Days',
    format: 'Online / In-Person',
    overview:
      'Take a bacterial isolate from raw Illumina reads to a fully annotated genome and biosynthetic gene cluster map. This three-day intensive covers the complete WGS pipeline — quality control, de novo assembly, structural and functional annotation, and genome mining for secondary metabolite pathways using antiSMASH. Real bacterial genomes are used throughout.',
    prerequisites: [
      { text: 'Completion of Intro to Bioinformatics or equivalent experience' },
      { text: 'Basic comfort with command-line navigation' },
      { text: 'Linux/macOS system or Windows with WSL2 installed' },
    ],
    modules: [
      { num: '01', name: 'Raw Reads & Quality Control', desc: 'FastQC, MultiQC, adapter trimming with Trimmomatic — understanding read quality before you assemble.' },
      { num: '02', name: 'De Novo Genome Assembly', desc: 'SPAdes assembly, QUAST quality metrics, and understanding N50, contigs vs scaffolds.' },
      { num: '03', name: 'Structural & Functional Annotation', desc: 'Prokka for automated CDS prediction; PGAP for NCBI-ready annotation; Eggnog-mapper for COG assignment.' },
      { num: '04', name: 'Biosynthetic Gene Cluster Mining', desc: 'antiSMASH for BGC detection — PKS, NRPS, terpene clusters and their ecological significance.' },
      { num: '05', name: 'Comparative Genomics Primer', desc: 'MLST, Average Nucleotide Identity (ANI), and strain delineation using pyANI.' },
    ],
    tools: ['FastQC', 'MultiQC', 'Trimmomatic', 'SPAdes', 'QUAST', 'Prokka', 'antiSMASH', 'pyANI', 'MLST'],
  },
  {
    id: 'amplicon',
    number: '04',
    title: 'Amplicon Metagenomics',
    description:
      'From raw 16S rRNA reads to community profiles. OTU/ASV pipelines, diversity metrics, and ecological interpretation in real datasets.',
    tags: ['QIIME2', '16S rRNA', 'R', 'Diversity'],
    level: 'Intermediate',
    duration: '3 Days',
    format: 'Online / In-Person',
    overview:
      'Amplicon metagenomics using 16S rRNA gene sequencing is the most widely used approach for profiling microbial communities. This workshop covers the full pipeline from raw paired-end reads through denoising (DADA2), taxonomic classification, and diversity analysis in QIIME2, with downstream visualisation in R. Environmental datasets (soil, marine, gut) are used throughout.',
    prerequisites: [
      { text: 'Basic command-line familiarity' },
      { text: 'Some exposure to microbial ecology concepts helpful' },
      { text: 'R and RStudio installed' },
    ],
    modules: [
      { num: '01', name: 'Amplicon Sequencing Fundamentals', desc: 'The 16S rRNA gene, variable regions, primer design, and sequencing platforms for amplicon data.' },
      { num: '02', name: 'QIIME2 Environment & Import', desc: 'Setting up QIIME2, importing and demultiplexing paired-end reads, quality visualisation.' },
      { num: '03', name: 'DADA2 Denoising & ASV Generation', desc: 'Error modelling, chimera removal, ASV vs OTU, and feature table construction.' },
      { num: '04', name: 'Taxonomic Classification', desc: 'Training the SILVA classifier, assigning taxonomy, filtering contaminants, and interpreting barplots.' },
      { num: '05', name: 'Alpha & Beta Diversity', desc: 'Shannon, Faith\'s PD, Bray-Curtis, UniFrac — statistical testing and PERMANOVA in QIIME2 and R.' },
      { num: '06', name: 'Visualisation & Reporting', desc: 'ggplot2 diversity plots, microbiome R packages, and producing publication-quality figures.' },
    ],
    tools: ['QIIME2', 'DADA2', 'SILVA', 'R', 'ggplot2', 'vegan', 'phyloseq', 'microbiome'],
  },
  {
    id: 'functional_meta',
    number: '05',
    title: 'Functional Metagenomics',
    description:
      'Uncover what microbial communities do — gene prediction, pathway reconstruction, and metabolic profiling from metagenomic data.',
    tags: ['HUMAnN3', 'Prokka', 'KEGG', 'Python'],
    level: 'Advanced',
    duration: '3 Days',
    format: 'Online / In-Person',
    overview:
      'Functional metagenomics moves beyond who is there to what they are doing. This workshop covers shotgun metagenomic processing, gene-centric analysis with HUMAnN3, metabolic pathway profiling against KEGG and MetaCyc, and binning of metagenome-assembled genomes (MAGs). Python scripting is used for custom analysis steps.',
    prerequisites: [
      { text: 'Completion of Amplicon Metagenomics or equivalent experience' },
      { text: 'Comfortable with Linux command line and Python basics' },
      { text: 'High-memory compute environment (16 GB RAM minimum recommended)' },
    ],
    modules: [
      { num: '01', name: 'Shotgun Metagenomics Overview', desc: 'Library preparation concepts, sequencing depth, host decontamination with Bowtie2, and read QC.' },
      { num: '02', name: 'Taxonomic Profiling at Scale', desc: 'Kraken2 + Bracken for species-level profiling; Krona visualisation; comparing with amplicon results.' },
      { num: '03', name: 'Functional Pathway Analysis', desc: 'HUMAnN3 pipeline — translated search, pathway and gene-family abundances, stratified outputs.' },
      { num: '04', name: 'KEGG & MetaCyc Interpretation', desc: 'Mapping gene families to metabolic pathways; differential abundance with MaAsLin2.' },
      { num: '05', name: 'Metagenome Assembled Genomes', desc: 'Assembly with MEGAHIT, binning with MetaBAT2, quality assessment with CheckM, taxonomy with GTDB-Tk.' },
      { num: '06', name: 'Python for Custom Analysis', desc: 'Pandas-based parsing of HUMAnN3 outputs, custom heatmaps, and automated reporting.' },
    ],
    tools: ['HUMAnN3', 'Kraken2', 'Bracken', 'Bowtie2', 'MEGAHIT', 'MetaBAT2', 'CheckM', 'GTDB-Tk', 'MaAsLin2', 'Python', 'Pandas'],
  },
  {
    id: 'pangenomics',
    number: '06',
    title: 'Pan-genomics and Meta-Pangenomics',
    description:
      'Compare genomes across strains and communities. Core vs. accessory genome dynamics, and pangenome-scale metagenomic analysis.',
    tags: ['Roary', 'PGGB', 'Panaroo', 'R'],
    level: 'Advanced',
    duration: '2 Days',
    format: 'Online / In-Person',
    overview:
      'The pangenome concept — core genome shared by all strains, plus flexible accessory genes — is reshaping how we understand microbial evolution and ecology. This two-day workshop covers bacterial pangenomics with Roary/Panaroo, graph-based pangenomics with PGGB, and how pangenome thinking extends into metagenomics for population-level analysis.',
    prerequisites: [
      { text: 'Completion of Bacterial WGS workshop or equivalent' },
      { text: 'Comfortable with command-line tools and R' },
      { text: 'Multiple annotated genomes available (provided if needed)' },
    ],
    modules: [
      { num: '01', name: 'Pangenomics Theory', desc: 'Core, accessory, and unique genomes — Heap\'s law, open vs. closed pangenomes, and ecological implications.' },
      { num: '02', name: 'Gene-Based Pangenomics', desc: 'Roary and Panaroo workflows — clustering, alignment, and producing pangenome matrices for downstream analysis.' },
      { num: '03', name: 'Pangenome Visualisation in R', desc: 'Presence-absence matrices, PCA of accessory genomes, and phylogenetic pangenome plots.' },
      { num: '04', name: 'Graph Pangenomics with PGGB', desc: 'Sequence-level pangenome graphs — construction, visualisation with Bandage, and variant calling from graphs.' },
      { num: '05', name: 'Meta-Pangenomics', desc: 'Extending pangenomics to metagenomic datasets — read mapping to pangenome graphs, population-level genomic variation.' },
    ],
    tools: ['Roary', 'Panaroo', 'PGGB', 'Bandage', 'R', 'ggplot2', 'Minimap2', 'MASH'],
  },
]
