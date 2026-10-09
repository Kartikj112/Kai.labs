import assert from 'node:assert/strict'
import test from 'node:test'
import {
  crossrefDate, inPublicationWindow, mergeCandidates, normaliseDoi,
  parseDate, publishedDoisFromFiles, stripMarkup, vetScreening,
} from './research-core.mts'
import type { Candidate } from './research-core.mts'

const make = (doi: string, abstract: string): Candidate => ({
  doi, title: 'Metagenomics for antibiotic discovery', abstract,
  journal: 'Research Journal', authors: ['A Researcher'],
  date: '2026-10-07', url: `https://doi.org/${doi}`,
})

test('normalise common DOI forms and reject broken identifiers', () => {
  assert.equal(normaliseDoi('https://doi.org/10.1038/ABC.123'), '10.1038/abc.123')
  assert.equal(normaliseDoi('doi:10.1016/j.cell.2026.01.020'), '10.1016/j.cell.2026.01.020')
  assert.equal(normaliseDoi('not a DOI'), null)
  assert.equal(normaliseDoi(undefined), null)
})

test('normalise XML abstracts and publication dates safely', () => {
  assert.equal(stripMarkup('<jats:p>AMP &amp; protein <i>design</i>.</jats:p>'), 'AMP & protein design .')
  assert.equal(parseDate('2026-02-30'), null)
  assert.equal(parseDate('2026-10-09'), '2026-10-09')
  assert.equal(crossrefDate({ published: { 'date-parts': [[2027, 3, 1]] }, 'published-online': { 'date-parts': [[2026, 10, 8]] } }), '2026-10-08')
  assert.ok(inPublicationWindow('2026-10-08', '2026-09-01', '2026-10-09'))
  assert.ok(!inPublicationWindow('2026-12-01', '2026-09-01', '2026-10-09'))
})

test('merge provider hits by DOI while keeping longer evidence', () => {
  const merged = mergeCandidates([make('10.1111/TEST', ''), make('https://doi.org/10.1111/test', 'Detailed abstract')])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].abstract, 'Detailed abstract')
  assert.equal(merged[0].doi, '10.1111/test')
})

test('only screen real, unique DOIs with known categories and legal scores', () => {
  const vetted = vetScreening([
    { doi: '10.1111/TEST', relevance: 8, category: 'Genomics', reason: 'Relevant' },
    { doi: '10.1111/test', relevance: 9, category: 'Genomics', reason: 'Duplicate' },
    { doi: '10.2222/hallucinated', relevance: 9, category: 'Genomics', reason: 'Fake' },
    { doi: '10.1111/test', relevance: 11, category: 'Genomics', reason: 'Out of range' },
  ], [make('10.1111/test', 'abstract')], ['Genomics'])
  assert.equal(vetted.length, 1)
  assert.equal(vetted[0].doi, '10.1111/test')
})

test('published article DOIs prevent duplication even if the ledger is missing', () => {
  assert.deepEqual([...publishedDoisFromFiles([{ doi: 'https://doi.org/10.1111/test' }, {}, { doi: '10.1111/TEST' }])], ['10.1111/test'])
})
